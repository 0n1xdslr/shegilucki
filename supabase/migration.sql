-- =======================================================
-- LUCKY MOTORS UPGRADES - DATABASE MIGRATION
-- =======================================================

-- 1. ENUM EXTENSION
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'vendedor';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'mecanico';

-- 2. CREATE USER SESSIONS TABLE (For Single Device Session)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    session_id TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for user_sessions
DROP POLICY IF EXISTS "Allow public read of sessions" ON public.user_sessions;
CREATE POLICY "Allow public read of sessions" ON public.user_sessions 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated upsert of sessions" ON public.user_sessions;
CREATE POLICY "Allow authenticated upsert of sessions" ON public.user_sessions 
    FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. TRIGGERS TO AUTOMATICALLY TRACK SESSIONS
CREATE OR REPLACE FUNCTION public.on_session_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_sessions (user_id, session_id, updated_at)
  VALUES (NEW.user_id, NEW.id::text, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET session_id = NEW.id::text, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_session_created ON auth.sessions;
CREATE TRIGGER on_session_created
  AFTER INSERT OR UPDATE OF id ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.on_session_created();

-- Delete active session on sign out
CREATE OR REPLACE FUNCTION public.on_session_deleted()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_sessions WHERE session_id = OLD.id::text;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_session_deleted ON auth.sessions;
CREATE TRIGGER on_session_deleted
  AFTER DELETE ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION public.on_session_deleted();


-- 4. SALES AND SERVICES TABLES

-- Sales (Ventas)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    vehicle_details TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    sale_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (Servicios)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mechanic_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    vehicle_details TEXT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
    service_date DATE DEFAULT CURRENT_DATE NOT NULL,
    status TEXT DEFAULT 'Realizado' NOT NULL, -- e.g. 'Pendiente', 'En progreso', 'Realizado'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_sales_updated_at ON public.sales;
CREATE TRIGGER set_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_services_updated_at ON public.services;
CREATE TRIGGER set_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- 5. RLS POLICIES FOR SALES AND SERVICES

-- Sales Policies
DROP POLICY IF EXISTS "Super admins can manage all sales" ON public.sales;
CREATE POLICY "Super admins can manage all sales" ON public.sales
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'super_admin'))
    WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Sellers can view their own sales" ON public.sales;
CREATE POLICY "Sellers can view their own sales" ON public.sales
    FOR SELECT TO authenticated
    USING (seller_id = auth.uid() OR public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Sellers can insert their own sales" ON public.sales;
CREATE POLICY "Sellers can insert their own sales" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK (seller_id = auth.uid() AND public.get_user_role() = 'vendedor');

DROP POLICY IF EXISTS "Sellers can update their own sales" ON public.sales;
CREATE POLICY "Sellers can update their own sales" ON public.sales
    FOR UPDATE TO authenticated
    USING (seller_id = auth.uid() AND public.get_user_role() = 'vendedor')
    WITH CHECK (seller_id = auth.uid() AND public.get_user_role() = 'vendedor');

-- Services Policies
DROP POLICY IF EXISTS "Super admins can manage all services" ON public.services;
CREATE POLICY "Super admins can manage all services" ON public.services
    TO authenticated
    USING (public.get_user_role() IN ('admin', 'super_admin'))
    WITH CHECK (public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Mechanics can view their own services" ON public.services;
CREATE POLICY "Mechanics can view their own services" ON public.services
    FOR SELECT TO authenticated
    USING (mechanic_id = auth.uid() OR public.get_user_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Mechanics can insert their own services" ON public.services;
CREATE POLICY "Mechanics can insert their own services" ON public.services
    FOR INSERT TO authenticated
    WITH CHECK (mechanic_id = auth.uid() AND public.get_user_role() = 'mecanico');

DROP POLICY IF EXISTS "Mechanics can update their own services" ON public.services;
CREATE POLICY "Mechanics can update their own services" ON public.services
    FOR UPDATE TO authenticated
    USING (mechanic_id = auth.uid() AND public.get_user_role() = 'mecanico')
    WITH CHECK (mechanic_id = auth.uid() AND public.get_user_role() = 'mecanico');


-- 6. ADMIN USER MANAGEMENT FUNCTIONS (SECURITY DEFINER)

-- Create User function
CREATE OR REPLACE FUNCTION public.create_new_user(
  user_email TEXT,
  user_password TEXT,
  user_full_name TEXT,
  user_role public.user_role
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  encrypted_pw TEXT;
BEGIN
  -- Check if caller is admin or super_admin
  IF public.get_user_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden crear usuarios';
  END IF;

  -- Hash password using crypt from pgcrypto (which is enabled by default in Supabase)
  encrypted_pw := crypt(user_password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    encrypted_pw,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', user_full_name),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Insert into auth.identities to link email identity
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', user_email, 'email_verified', true, 'phone_verified', false),
    'email',
    user_email,
    NOW(),
    NOW(),
    NOW()
  );

  -- Update profiles role since trigger public.handle_new_user might insert with default 'viewer'
  UPDATE public.profiles
  SET role = user_role, full_name = user_full_name
  WHERE id = new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Update User function
CREATE OR REPLACE FUNCTION public.update_existing_user(
  target_user_id UUID,
  new_email TEXT,
  new_password TEXT,
  new_full_name TEXT,
  new_role public.user_role
)
RETURNS VOID AS $$
DECLARE
  encrypted_pw TEXT;
BEGIN
  -- Check if caller is admin or super_admin
  IF public.get_user_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden actualizar usuarios';
  END IF;

  -- Update auth.users email and raw_user_meta_data
  UPDATE auth.users
  SET 
    email = new_email,
    raw_user_meta_data = jsonb_build_object('full_name', new_full_name),
    updated_at = NOW()
  WHERE id = target_user_id;

  -- Update auth.identities if the email changes
  UPDATE auth.identities
  SET 
    provider_id = new_email,
    identity_data = jsonb_build_object('sub', target_user_id::text, 'email', new_email, 'email_verified', true, 'phone_verified', false),
    updated_at = NOW()
  WHERE user_id = target_user_id AND provider = 'email';

  -- Update password if provided
  IF new_password IS NOT NULL AND new_password <> '' THEN
    encrypted_pw := crypt(new_password, gen_salt('bf'));
    UPDATE auth.users
    SET encrypted_password = encrypted_pw
    WHERE id = target_user_id;
  END IF;

  -- Update public.profiles
  UPDATE public.profiles
  SET 
    email = new_email,
    full_name = new_full_name,
    role = new_role,
    updated_at = NOW()
  WHERE id = target_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

-- Delete User function
CREATE OR REPLACE FUNCTION public.delete_existing_user(
  target_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Check if caller is admin or super_admin
  IF public.get_user_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden eliminar usuarios';
  END IF;

  -- Delete from auth.users (cascades to public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

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

