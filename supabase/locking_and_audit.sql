-- =======================================================
-- LUCKY MOTORS UPGRADES - ACCESOS, AUDITORÍA Y BLOQUEO DE CUENTAS
-- =======================================================

-- 1. AGREGAR COLUMNAS DE BLOQUEO A PROFILES
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- 2. FUNCIONES AUXILIARES PARA CAPTURAR IP Y USER AGENT DESDE CABECERAS HTTP
CREATE OR REPLACE FUNCTION public.get_client_ip() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    '127.0.0.1'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN '127.0.0.1';
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_client_user_agent() RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'user-agent',
    'Unknown'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'Unknown';
END;
$$ LANGUAGE plpgsql;

-- 3. FUNCION PARA VERIFICAR ESTADO DE BLOQUEO DE UN USUARIO
CREATE OR REPLACE FUNCTION public.check_user_login_status(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_locked BOOLEAN := FALSE;
  v_locked_until TIMESTAMPTZ;
  v_remaining_seconds DOUBLE PRECISION := 0;
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE email = user_email;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object('locked', FALSE);
  END IF;

  IF v_profile.locked_until IS NOT NULL AND v_profile.locked_until > NOW() THEN
    v_locked := TRUE;
    v_locked_until := v_profile.locked_until;
    v_remaining_seconds := EXTRACT(EPOCH FROM (v_profile.locked_until - NOW()));
  END IF;

  RETURN jsonb_build_object(
    'locked', v_locked,
    'locked_until', v_locked_until,
    'remaining_seconds', v_remaining_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. FUNCION PARA REGISTRAR ACCESO FALLIDO E INCREMENTAR CONTADOR / BLOQUEAR
CREATE OR REPLACE FUNCTION public.register_login_failure(user_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_attempts INTEGER := 0;
  v_locked BOOLEAN := FALSE;
  v_locked_until TIMESTAMPTZ := NULL;
  v_ip TEXT;
  v_ua TEXT;
BEGIN
  v_ip := public.get_client_ip();
  v_ua := public.get_client_user_agent();
  
  SELECT * INTO v_profile FROM public.profiles WHERE email = user_email;
  
  IF v_profile IS NOT NULL THEN
    v_attempts := v_profile.failed_login_attempts + 1;
    
    IF v_attempts >= 3 THEN
      v_locked := TRUE;
      v_locked_until := NOW() + INTERVAL '3 minutes';
      
      UPDATE public.profiles 
      SET failed_login_attempts = v_attempts, locked_until = v_locked_until
      WHERE id = v_profile.id;
    ELSE
      UPDATE public.profiles 
      SET failed_login_attempts = v_attempts
      WHERE id = v_profile.id;
    END IF;
    
    -- Registrar en audit_logs
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
    VALUES (
      v_profile.id,
      CASE WHEN v_attempts >= 3 THEN 'ACCOUNT_LOCKED' ELSE 'LOGIN_FAILED' END,
      'auth',
      v_profile.id,
      jsonb_build_object('failed_attempts', v_profile.failed_login_attempts),
      jsonb_build_object('failed_attempts', v_attempts, 'locked_until', v_locked_until),
      v_ip,
      v_ua
    );
  ELSE
    -- Intento en cuenta no existente (auditoría ciega)
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address, user_agent)
    VALUES (
      NULL,
      'LOGIN_FAILED_UNKNOWN',
      'auth',
      '00000000-0000-0000-0000-000000000000'::uuid,
      jsonb_build_object('email', user_email),
      v_ip,
      v_ua
    );
  END IF;

  RETURN jsonb_build_object(
    'locked', v_locked,
    'failed_attempts', v_attempts,
    'locked_until', v_locked_until
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. FUNCION PARA REGISTRAR ACCESO EXITOSO Y RESETEAR INTENTOS
CREATE OR REPLACE FUNCTION public.register_login_success(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  v_profile RECORD;
  v_ip TEXT;
  v_ua TEXT;
BEGIN
  v_ip := public.get_client_ip();
  v_ua := public.get_client_user_agent();
  
  SELECT * INTO v_profile FROM public.profiles WHERE email = user_email;
  
  IF v_profile IS NOT NULL THEN
    UPDATE public.profiles 
    SET failed_login_attempts = 0, locked_until = NULL
    WHERE id = v_profile.id;
    
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address, user_agent)
    VALUES (
      v_profile.id,
      'LOGIN_SUCCESS',
      'auth',
      v_profile.id,
      jsonb_build_object('email', user_email),
      v_ip,
      v_ua
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- 6. POLÍTICAS DE RLS ACTUALIZADAS PARA AUDITORÍA (INCLUYE SUPER_ADMIN)
DROP POLICY IF EXISTS "Admins and Auditors can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins, Auditors and SuperAdmins can read audit logs" ON public.audit_logs 
  FOR SELECT USING (public.get_user_role() IN ('admin', 'auditor', 'super_admin'));

-- 7. AUDITORÍA AUTOMÁTICA DE CREACIÓN/MUTACIÓN DE USUARIOS (PROFILES)
CREATE OR REPLACE FUNCTION public.audit_profiles_mutations()
RETURNS TRIGGER AS $$
DECLARE
  v_operator_id UUID;
  v_ip TEXT;
  v_ua TEXT;
BEGIN
  v_operator_id := auth.uid();
  v_ip := public.get_client_ip();
  v_ua := public.get_client_user_agent();

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, new_data, ip_address, user_agent)
    VALUES (v_operator_id, 'CREATE_USER', 'profiles', NEW.id, row_to_json(NEW)::jsonb, v_ip, v_ua);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.email IS DISTINCT FROM NEW.email) THEN
      INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
      VALUES (v_operator_id, 'UPDATE_USER', 'profiles', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_ip, v_ua);
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, ip_address, user_agent)
    VALUES (v_operator_id, 'DELETE_USER', 'profiles', OLD.id, row_to_json(OLD)::jsonb, v_ip, v_ua);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_profiles_trigger ON public.profiles;
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profiles_mutations();

-- 8. AUDITORÍA AUTOMÁTICA DE ENTIDADES DE RIESGO
CREATE OR REPLACE FUNCTION public.audit_generic_mutations()
RETURNS TRIGGER AS $$
DECLARE
  v_operator_id UUID;
  v_ip TEXT;
  v_ua TEXT;
  v_old JSONB := NULL;
  v_new JSONB := NULL;
  v_entity_id UUID;
BEGIN
  v_operator_id := auth.uid();
  v_ip := public.get_client_ip();
  v_ua := public.get_client_user_agent();

  IF (TG_OP = 'DELETE') THEN
    v_entity_id := OLD.id;
    v_old := row_to_json(OLD)::jsonb;
  ELSE
    v_entity_id := NEW.id;
    v_new := row_to_json(NEW)::jsonb;
    IF (TG_OP = 'UPDATE') THEN
      v_old := row_to_json(OLD)::jsonb;
    END IF;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
  VALUES (
    v_operator_id,
    TG_OP,
    TG_TABLE_NAME,
    v_entity_id,
    v_old,
    v_new,
    v_ip,
    v_ua
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_assets_trigger ON public.assets;
CREATE TRIGGER audit_assets_trigger AFTER INSERT OR UPDATE OR DELETE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.audit_generic_mutations();

DROP TRIGGER IF EXISTS audit_threats_trigger ON public.threats;
CREATE TRIGGER audit_threats_trigger AFTER INSERT OR UPDATE OR DELETE ON public.threats FOR EACH ROW EXECUTE FUNCTION public.audit_generic_mutations();

DROP TRIGGER IF EXISTS audit_vulnerabilities_trigger ON public.vulnerabilities;
CREATE TRIGGER audit_vulnerabilities_trigger AFTER INSERT OR UPDATE OR DELETE ON public.vulnerabilities FOR EACH ROW EXECUTE FUNCTION public.audit_generic_mutations();

DROP TRIGGER IF EXISTS audit_risks_trigger ON public.risks;
CREATE TRIGGER audit_risks_trigger AFTER INSERT OR UPDATE OR DELETE ON public.risks FOR EACH ROW EXECUTE FUNCTION public.audit_generic_mutations();

DROP TRIGGER IF EXISTS audit_treatment_plans_trigger ON public.treatment_plans;
CREATE TRIGGER audit_treatment_plans_trigger AFTER INSERT OR UPDATE OR DELETE ON public.treatment_plans FOR EACH ROW EXECUTE FUNCTION public.audit_generic_mutations();
