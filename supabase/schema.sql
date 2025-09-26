-- Golffox Database Schema
-- Este arquivo contém todo o esquema de banco de dados para o sistema Golffox

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Criar tipos ENUM
CREATE TYPE user_role AS ENUM ('admin', 'operator', 'driver', 'passenger');
CREATE TYPE company_status AS ENUM ('Ativo', 'Inativo');
CREATE TYPE driver_status AS ENUM ('Ativo', 'Em análise', 'Inativo');
CREATE TYPE contract_type AS ENUM ('CLT', 'terceirizado', 'autônomo');
CREATE TYPE cnh_category AS ENUM ('D', 'E');
CREATE TYPE vehicle_status AS ENUM ('Em Movimento', 'Parado', 'Com Problema', 'Garagem');
CREATE TYPE route_status AS ENUM ('No Horário', 'Atrasado', 'Com Problema');
CREATE TYPE alert_type AS ENUM ('Crítico', 'Atenção', 'Informativo');

-- Tabela de perfis de permissão
CREATE TABLE permission_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    access TEXT[] NOT NULL DEFAULT '{}',
    is_admin_feature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de empresas
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    contact VARCHAR(255) NOT NULL,
    status company_status DEFAULT 'Ativo',
    address_text TEXT NOT NULL,
    address_lat DECIMAL(10, 8) NOT NULL,
    address_lng DECIMAL(11, 8) NOT NULL,
    contracted_passengers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários (integrada com Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    permission_profile_id UUID REFERENCES permission_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de motoristas
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    cep VARCHAR(9) NOT NULL,
    cnh VARCHAR(20) UNIQUE NOT NULL,
    cnh_validity DATE NOT NULL,
    cnh_category cnh_category NOT NULL,
    has_ear BOOLEAN DEFAULT FALSE,
    transport_course_file TEXT,
    transport_course_validity DATE,
    last_toxicological_exam DATE NOT NULL,
    photo_url TEXT,
    cnh_file TEXT,
    residence_proof_file TEXT,
    course_file TEXT,
    toxicological_exam_file TEXT,
    id_photo_file TEXT,
    contract_type contract_type NOT NULL,
    credentialing_date DATE NOT NULL,
    status driver_status DEFAULT 'Em análise',
    linked_company VARCHAR(255) NOT NULL,
    assigned_routes TEXT[] DEFAULT '{}',
    availability TEXT,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de veículos
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate VARCHAR(8) UNIQUE NOT NULL,
    model VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status vehicle_status DEFAULT 'Garagem',
    position_lat DECIMAL(10, 8) NOT NULL,
    position_lng DECIMAL(11, 8) NOT NULL,
    route_id UUID,
    last_maintenance DATE NOT NULL,
    next_maintenance DATE NOT NULL,
    is_registered BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de passageiros/funcionários
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    position_lat DECIMAL(10, 8) NOT NULL,
    position_lng DECIMAL(11, 8) NOT NULL,
    pickup_time TIME,
    photo_url TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    permission_profile_id UUID REFERENCES permission_profiles(id) ON DELETE SET NULL,
    status company_status DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rotas
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    status route_status DEFAULT 'No Horário',
    scheduled_start TIME NOT NULL,
    actual_start TIME,
    punctuality INTEGER DEFAULT 0,
    start_location TEXT,
    destination TEXT,
    origin TEXT,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento entre rotas e passageiros
CREATE TABLE route_passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    passenger_id UUID REFERENCES passengers(id) ON DELETE CASCADE,
    pickup_order INTEGER NOT NULL,
    is_onboard BOOLEAN DEFAULT FALSE,
    pickup_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, passenger_id)
);

-- Tabela de alertas
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type alert_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de rotas
CREATE TABLE route_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_plate VARCHAR(8) NOT NULL,
    execution_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    total_time INTEGER, -- em minutos
    total_distance DECIMAL(10, 2), -- em km
    passengers_boarded INTEGER NOT NULL,
    passengers_not_boarded INTEGER NOT NULL,
    total_passengers INTEGER NOT NULL,
    fuel_consumption DECIMAL(8, 2), -- em litros
    operational_cost DECIMAL(10, 2), -- em reais
    punctuality INTEGER DEFAULT 0, -- em minutos
    route_optimization DECIMAL(5, 2), -- percentual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de controle de custos
CREATE TABLE cost_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL,
    total_kilometers DECIMAL(10, 2) NOT NULL,
    average_fuel_consumption DECIMAL(8, 2) NOT NULL, -- km/l
    fuel_cost DECIMAL(8, 2) NOT NULL, -- custo por litro
    total_fuel_cost DECIMAL(10, 2) NOT NULL,
    driver_cost DECIMAL(10, 2) NOT NULL, -- salário + benefícios
    vehicle_maintenance_cost DECIMAL(10, 2) NOT NULL,
    operational_cost DECIMAL(10, 2) NOT NULL, -- custo total operacional
    revenue_per_passenger DECIMAL(8, 2) NOT NULL, -- receita por passageiro
    total_revenue DECIMAL(10, 2) NOT NULL,
    profit_margin DECIMAL(5, 2) NOT NULL, -- margem de lucro em %
    cost_per_km DECIMAL(8, 2) NOT NULL,
    cost_per_passenger DECIMAL(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de performance dos motoristas
CREATE TABLE driver_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    driver_name VARCHAR(255) NOT NULL,
    driver_photo TEXT,
    punctuality_score INTEGER CHECK (punctuality_score >= 0 AND punctuality_score <= 100),
    fuel_efficiency_score INTEGER CHECK (fuel_efficiency_score >= 0 AND fuel_efficiency_score <= 100),
    route_compliance_score INTEGER CHECK (route_compliance_score >= 0 AND route_compliance_score <= 100),
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    routes_completed INTEGER DEFAULT 0,
    total_savings DECIMAL(10, 2) DEFAULT 0,
    deviations INTEGER DEFAULT 0,
    ranking INTEGER,
    badges TEXT[] DEFAULT '{}',
    level VARCHAR(20) DEFAULT 'Bronze',
    monthly_points INTEGER DEFAULT 0,
    month_year VARCHAR(7) NOT NULL, -- formato YYYY-MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(driver_id, month_year)
);

-- Tabela de localizações de veículos (para rastreamento em tempo real)
CREATE TABLE vehicle_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(5, 2) DEFAULT 0, -- km/h
    heading INTEGER DEFAULT 0, -- graus (0-360)
    accuracy DECIMAL(8, 2) DEFAULT 0, -- metros
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_linked_company ON drivers(linked_company);
CREATE INDEX idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_passengers_company_id ON passengers(company_id);
CREATE INDEX idx_routes_company_id ON routes(company_id);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX idx_route_passengers_route_id ON route_passengers(route_id);
CREATE INDEX idx_route_passengers_passenger_id ON route_passengers(passenger_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_route_history_route_id ON route_history(route_id);
CREATE INDEX idx_route_history_execution_date ON route_history(execution_date);
CREATE INDEX idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX idx_vehicle_locations_timestamp ON vehicle_locations(timestamp);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_profiles_updated_at BEFORE UPDATE ON permission_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_control_updated_at BEFORE UPDATE ON cost_control FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_performance_updated_at BEFORE UPDATE ON driver_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais dos perfis de permissão
INSERT INTO permission_profiles (id, name, description, access, is_admin_feature) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Admin', 'Acesso total a todas as áreas do sistema, incluindo gerenciamento de usuários e permissões.', 
 ARRAY['Painel de Gestão (Completo)', 'Portal do Operador', 'App do Motorista', 'App do Passageiro'], true),
('550e8400-e29b-41d4-a716-446655440002', 'Suporte', 'Acesso às principais funcionalidades do Painel de Gestão para monitoramento e suporte, sem permissão para editar usuários.', 
 ARRAY['Painel de Gestão (Visualização)'], false),
('550e8400-e29b-41d4-a716-446655440003', 'Motorista', 'Acesso exclusivo ao aplicativo do motorista para visualização de rotas, checklists e navegação.', 
 ARRAY['App do Motorista'], false),
('550e8400-e29b-41d4-a716-446655440004', 'Passageiro', 'Acesso exclusivo ao aplicativo do passageiro para rastreamento de rotas em tempo real.', 
 ARRAY['App do Passageiro'], false),
('550e8400-e29b-41d4-a716-446655440005', 'Operador', 'Acesso ao portal da empresa para gerenciar os funcionários e acompanhar as rotas contratadas.', 
 ARRAY['Portal do Operador'], false);

-- Inserir dados de exemplo das empresas
INSERT INTO companies (id, name, cnpj, contact, status, address_text, address_lat, address_lng, contracted_passengers) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Minerva Foods', '12.345.678/0001-99', 'financeiro@minervafoods.com', 'Ativo', 'Rua das Flores, 123, São Paulo, SP', -23.5489, -46.6388, 50),
('660e8400-e29b-41d4-a716-446655440002', 'JBS S.A.', '98.765.432/0001-11', 'contato@jbs.com.br', 'Ativo', 'Av. Paulista, 456, São Paulo, SP', -23.5505, -46.6333, 75),
('660e8400-e29b-41d4-a716-446655440003', 'BRF S.A.', '11.222.333/0001-44', 'rh@brf.com', 'Ativo', 'Rua Augusta, 789, São Paulo, SP', -23.5558, -46.6396, 30),
('660e8400-e29b-41d4-a716-446655440004', 'Marfrig Global Foods', '55.666.777/0001-88', 'operacoes@marfrig.com.br', 'Inativo', 'Rua Consolação, 321, São Paulo, SP', -23.5506, -46.6444, 0);

-- Comentários nas tabelas
COMMENT ON TABLE companies IS 'Empresas clientes que contratam os serviços de transporte';
COMMENT ON TABLE users IS 'Usuários do sistema integrados com Supabase Auth';
COMMENT ON TABLE drivers IS 'Motoristas cadastrados no sistema';
COMMENT ON TABLE vehicles IS 'Veículos da frota';
COMMENT ON TABLE passengers IS 'Passageiros/funcionários das empresas';
COMMENT ON TABLE routes IS 'Rotas de transporte';
COMMENT ON TABLE route_passengers IS 'Relacionamento entre rotas e passageiros';
COMMENT ON TABLE alerts IS 'Alertas e notificações do sistema';
COMMENT ON TABLE route_history IS 'Histórico de execução das rotas';
COMMENT ON TABLE cost_control IS 'Controle de custos operacionais';
COMMENT ON TABLE driver_performance IS 'Performance e gamificação dos motoristas';
COMMENT ON TABLE vehicle_locations IS 'Localizações em tempo real dos veículos';
COMMENT ON TABLE permission_profiles IS 'Perfis de permissão do sistema';