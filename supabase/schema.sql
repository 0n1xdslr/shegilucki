-- =======================================================
-- LUCKY MOTORS RISK MANAGER - SUPABASE SCHEMA
-- =======================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'auditor', 'viewer');
CREATE TYPE asset_type AS ENUM ('Humano', 'Tecnológico', 'Físico', 'Intangible', 'Información', 'Software', 'Otro');
CREATE TYPE risk_status AS ENUM ('Identificado', 'En tratamiento', 'Mitigado', 'Aceptado', 'Cerrado');
CREATE TYPE treatment_strategy AS ENUM ('Mitigar', 'Evitar', 'Transferir', 'Aceptar');
CREATE TYPE treatment_status AS ENUM ('Pendiente', 'En progreso', 'Completado', 'Vencido');
CREATE TYPE risk_classification AS ENUM ('Bajo', 'Medio', 'Alto', 'Crítico');

-- 3. TABLES

-- Profiles
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'viewer'::user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type asset_type NOT NULL,
    description TEXT,
    owner TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Threats
CREATE TABLE threats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vulnerabilities
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risks
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    threat_id UUID REFERENCES threats(id) ON DELETE CASCADE NOT NULL,
    vulnerability_id UUID REFERENCES vulnerabilities(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    probability INTEGER CHECK (probability >= 1 AND probability <= 5) NOT NULL,
    impact INTEGER CHECK (impact >= 1 AND impact <= 5) NOT NULL,
    risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
    risk_level risk_classification NOT NULL, -- Will be set by trigger or manually based on score
    recommended_mitigation TEXT,
    owner TEXT,
    status risk_status DEFAULT 'Identificado'::risk_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment Plans
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE NOT NULL,
    strategy treatment_strategy NOT NULL,
    action_plan TEXT NOT NULL,
    owner TEXT,
    start_date DATE,
    end_date DATE,
    status treatment_status DEFAULT 'Pendiente'::treatment_status NOT NULL,
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,
    observations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evidences
CREATE TABLE evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (risk_id IS NOT NULL OR treatment_plan_id IS NOT NULL)
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Settings (Optional configurations)
CREATE TABLE risk_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    config_key TEXT NOT NULL,
    config_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, config_key)
);

-- 4. FUNCTIONS AND TRIGGERS

-- Updated At Trigger Function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_threats_updated_at BEFORE UPDATE ON threats FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_vulnerabilities_updated_at BEFORE UPDATE ON vulnerabilities FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_risks_updated_at BEFORE UPDATE ON risks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_evidences_updated_at BEFORE UPDATE ON evidences FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_risk_settings_updated_at BEFORE UPDATE ON risk_settings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- Function to calculate risk level classification
CREATE OR REPLACE FUNCTION classify_risk()
RETURNS TRIGGER AS $$
DECLARE
    calc_score INTEGER;
BEGIN
    calc_score := NEW.probability * NEW.impact;
    
    IF calc_score BETWEEN 1 AND 5 THEN
        NEW.risk_level = 'Bajo'::risk_classification;
    ELSIF calc_score BETWEEN 6 AND 10 THEN
        NEW.risk_level = 'Medio'::risk_classification;
    ELSIF calc_score BETWEEN 11 AND 15 THEN
        NEW.risk_level = 'Alto'::risk_classification;
    ELSIF calc_score BETWEEN 16 AND 25 THEN
        NEW.risk_level = 'Crítico'::risk_classification;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply risk classification trigger
CREATE TRIGGER set_risk_level
BEFORE INSERT OR UPDATE OF probability, impact
ON risks
FOR EACH ROW
EXECUTE FUNCTION classify_risk();


-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'viewer'::public.user_role -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check role
CREATE OR REPLACE FUNCTION public.get_user_role() RETURNS TEXT AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- General Policies (Admins/Auditors can ALL, Viewers can SELECT)
-- Companies
CREATE POLICY "Viewers can read companies" ON companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert companies" ON companies FOR INSERT WITH CHECK (public.get_user_role() IN ('admin'));
CREATE POLICY "Admins can update companies" ON companies FOR UPDATE USING (public.get_user_role() IN ('admin'));

-- Assets
CREATE POLICY "Viewers can read assets" ON assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert assets" ON assets FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update assets" ON assets FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Threats
CREATE POLICY "Viewers can read threats" ON threats FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert threats" ON threats FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update threats" ON threats FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Vulnerabilities
CREATE POLICY "Viewers can read vulnerabilities" ON vulnerabilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert vulnerabilities" ON vulnerabilities FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update vulnerabilities" ON vulnerabilities FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Risks
CREATE POLICY "Viewers can read risks" ON risks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert risks" ON risks FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update risks" ON risks FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Treatment Plans
CREATE POLICY "Viewers can read treatment plans" ON treatment_plans FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert treatment plans" ON treatment_plans FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update treatment plans" ON treatment_plans FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Evidences
CREATE POLICY "Viewers can read evidences" ON evidences FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins and Auditors can insert evidences" ON evidences FOR INSERT WITH CHECK (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can update evidences" ON evidences FOR UPDATE USING (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "Admins and Auditors can delete evidences" ON evidences FOR DELETE USING (public.get_user_role() IN ('admin', 'auditor'));

-- Audit Logs (Only Admins/Auditors can insert, Admin can read)
CREATE POLICY "Admins and Auditors can read audit logs" ON audit_logs FOR SELECT USING (public.get_user_role() IN ('admin', 'auditor'));
CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 6. INITIAL DATA SEED (Lucky Motors)

INSERT INTO companies (id, name, description, industry) 
VALUES ('c10a4e76-0000-0000-0000-000000000001', 'Lucky Motors', 'Comercialización de mototaxis, venta de repuestos y servicio técnico mecánico', 'Automotriz');

-- Assets
INSERT INTO assets (id, company_id, name, type, description) VALUES 
('a1000000-0000-0000-0000-000000000001', 'c10a4e76-0000-0000-0000-000000000001', 'Empleados', 'Humano', 'Personal administrativo y técnico'),
('a1000000-0000-0000-0000-000000000002', 'c10a4e76-0000-0000-0000-000000000001', 'Clientes / usuarios', 'Humano', 'Compradores y usuarios de servicios'),
('a1000000-0000-0000-0000-000000000003', 'c10a4e76-0000-0000-0000-000000000001', 'Computadoras', 'Físico', 'Equipos de cómputo en oficinas y talleres'),
('a1000000-0000-0000-0000-000000000004', 'c10a4e76-0000-0000-0000-000000000001', 'Motocicletas', 'Físico', 'Inventario de vehículos para la venta'),
('a1000000-0000-0000-0000-000000000005', 'c10a4e76-0000-0000-0000-000000000001', 'Repuestos', 'Físico', 'Inventario de partes y refacciones'),
('a1000000-0000-0000-0000-000000000006', 'c10a4e76-0000-0000-0000-000000000001', 'Reputación', 'Intangible', 'Imagen de marca de la empresa'),
('a1000000-0000-0000-0000-000000000007', 'c10a4e76-0000-0000-0000-000000000001', 'Base de datos', 'Información', 'Datos de clientes y transacciones'),
('a1000000-0000-0000-0000-000000000008', 'c10a4e76-0000-0000-0000-000000000001', 'Software', 'Software', 'Sistemas informáticos y aplicativos internos');

-- Threats
INSERT INTO threats (id, company_id, name, description) VALUES
('d1000000-0000-0000-0000-000000000001', 'c10a4e76-0000-0000-0000-000000000001', 'Fraude interno o mal manejo de dinero', 'Empleados manipulando finanzas'),
('d1000000-0000-0000-0000-000000000002', 'c10a4e76-0000-0000-0000-000000000001', 'Suplantación de identidad en compras', 'Compras con identidades falsas'),
('d1000000-0000-0000-0000-000000000003', 'c10a4e76-0000-0000-0000-000000000001', 'Malware, robo o deterioro de computadoras', 'Daño o infección de equipos informáticos'),
('d1000000-0000-0000-0000-000000000004', 'c10a4e76-0000-0000-0000-000000000001', 'Daños en motocicletas que afectan la venta', 'Desperfectos en el inventario vehicular'),
('d1000000-0000-0000-0000-000000000005', 'c10a4e76-0000-0000-0000-000000000001', 'Pérdida de inventario por robo o deterioro', 'Robo de piezas o repuestos'),
('d1000000-0000-0000-0000-000000000006', 'c10a4e76-0000-0000-0000-000000000001', 'Pérdida de clientes por mala imagen', 'Clientes insatisfechos y quejas'),
('d1000000-0000-0000-0000-000000000007', 'c10a4e76-0000-0000-0000-000000000001', 'Filtración de datos de clientes', 'Fuga de información confidencial'),
('d1000000-0000-0000-0000-000000000008', 'c10a4e76-0000-0000-0000-000000000001', 'Vulnerabilidades explotadas por ataques', 'Ciberataques externos a sistemas');

-- Vulnerabilities
INSERT INTO vulnerabilities (id, company_id, name, description) VALUES
('e1000000-0000-0000-0000-000000000001', 'c10a4e76-0000-0000-0000-000000000001', 'Falta de capacitación técnica', 'Personal sin conocimientos suficientes'),
('e1000000-0000-0000-0000-000000000002', 'c10a4e76-0000-0000-0000-000000000001', 'Descuido en el manejo de información', 'Malas prácticas de seguridad de datos'),
('e1000000-0000-0000-0000-000000000003', 'c10a4e76-0000-0000-0000-000000000001', 'Falta de validación de identidad', 'No se verifica quién realiza la compra'),
('e1000000-0000-0000-0000-000000000004', 'c10a4e76-0000-0000-0000-000000000001', 'Equipos sin antivirus', 'Sistemas desprotegidos contra malware'),
('e1000000-0000-0000-0000-000000000005', 'c10a4e76-0000-0000-0000-000000000001', 'Falta de control de inventario', 'No hay registros precisos de existencias'),
('e1000000-0000-0000-0000-000000000006', 'c10a4e76-0000-0000-0000-000000000001', 'Mala atención al cliente', 'Servicio deficiente al público'),
('e1000000-0000-0000-0000-000000000007', 'c10a4e76-0000-0000-0000-000000000001', 'Accesos sin control', 'Cualquiera puede acceder a áreas restringidas o sistemas');

-- Risks
INSERT INTO risks (id, company_id, asset_id, threat_id, vulnerability_id, name, probability, impact, recommended_mitigation) VALUES
('f1000000-0000-0000-0000-000000000001', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000007', 'Fraude interno o mal manejo de dinero', 3, 5, 'Implementar arqueos de caja diarios'),
('f1000000-0000-0000-0000-000000000002', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000003', 'Suplantación de identidad en compras', 2, 4, 'Registro digital de clientes con datos completos'),
('f1000000-0000-0000-0000-000000000003', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000004', 'Pérdida de información por virus o malware', 2, 4, 'Uso de firewall en la red'),
('f1000000-0000-0000-0000-000000000004', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000007', 'Daños en vehículos que afectan la venta', 4, 5, 'Almacenamiento en áreas seguras y techadas'),
('f1000000-0000-0000-0000-000000000005', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000005', 'Pérdida de inventario por robo o deterioro', 4, 5, 'Acceso restringido al área de repuestos'),
('f1000000-0000-0000-0000-000000000006', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'e1000000-0000-0000-0000-000000000006', 'Pérdida de clientes por mala imagen', 4, 5, 'Capacitación en atención al cliente'),
('f1000000-0000-0000-0000-000000000007', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007', 'e1000000-0000-0000-0000-000000000002', 'Filtración de datos de clientes', 3, 4, 'Uso de contraseñas seguras y acceso restringido'),
('f1000000-0000-0000-0000-000000000008', 'c10a4e76-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000008', 'e1000000-0000-0000-0000-000000000007', 'Vulnerabilidades explotadas por ataques', 3, 3, 'Actualización constante de sistemas y software');

-- Treatment Plans
INSERT INTO treatment_plans (id, risk_id, strategy, action_plan, status) VALUES
('b1000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Mitigar', 'Implementar arqueos de caja diarios', 'Pendiente'),
('b1000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'Mitigar', 'Registro digital de clientes con datos completos', 'En progreso'),
('b1000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', 'Evitar', 'Uso de firewall en la red', 'En progreso'),
('b1000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000004', 'Mitigar', 'Almacenamiento en áreas seguras y techadas', 'Pendiente'),
('b1000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000005', 'Mitigar', 'Acceso restringido al área de repuestos', 'Pendiente'),
('b1000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000006', 'Mitigar', 'Capacitación en atención al cliente', 'Pendiente'),
('b1000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000007', 'Mitigar', 'Uso de contraseñas seguras y acceso restringido', 'Completado'),
('b1000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000008', 'Mitigar', 'Actualización constante de sistemas y software', 'En progreso');
