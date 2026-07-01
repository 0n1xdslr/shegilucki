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
