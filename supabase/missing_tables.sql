-- Script para criar apenas as tabelas faltantes
-- Execute este script no Supabase SQL Editor

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS vehicles (
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
CREATE TABLE IF NOT EXISTS passengers (
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
CREATE TABLE IF NOT EXISTS routes (
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
CREATE TABLE IF NOT EXISTS route_passengers (
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
CREATE TABLE IF NOT EXISTS alerts (
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
CREATE TABLE IF NOT EXISTS route_history (
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
CREATE TABLE IF NOT EXISTS cost_control (
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
CREATE TABLE IF NOT EXISTS driver_performance (
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
CREATE TABLE IF NOT EXISTS vehicle_locations (
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

-- Índices para melhor performance (apenas para as novas tabelas)
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_passengers_company_id ON passengers(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_company_id ON routes(company_id);
CREATE INDEX IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_route_passengers_route_id ON route_passengers(route_id);
CREATE INDEX IF NOT EXISTS idx_route_passengers_passenger_id ON route_passengers(passenger_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_route_history_route_id ON route_history(route_id);
CREATE INDEX IF NOT EXISTS idx_route_history_execution_date ON route_history(execution_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_vehicle_id ON vehicle_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_timestamp ON vehicle_locations(timestamp);

-- Triggers para atualizar updated_at automaticamente (apenas para as novas tabelas)
-- Primeiro removemos os triggers se já existirem, depois criamos novos
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
DROP TRIGGER IF EXISTS update_passengers_updated_at ON passengers;
DROP TRIGGER IF EXISTS update_routes_updated_at ON routes;
DROP TRIGGER IF EXISTS update_cost_control_updated_at ON cost_control;
DROP TRIGGER IF EXISTS update_driver_performance_updated_at ON driver_performance;

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON passengers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cost_control_updated_at BEFORE UPDATE ON cost_control FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driver_performance_updated_at BEFORE UPDATE ON driver_performance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas
COMMENT ON TABLE vehicles IS 'Veículos da frota';
COMMENT ON TABLE passengers IS 'Passageiros/funcionários das empresas';
COMMENT ON TABLE routes IS 'Rotas de transporte';
COMMENT ON TABLE route_passengers IS 'Relacionamento entre rotas e passageiros';
COMMENT ON TABLE alerts IS 'Alertas e notificações do sistema';
COMMENT ON TABLE route_history IS 'Histórico de execução das rotas';
COMMENT ON TABLE cost_control IS 'Controle de custos operacionais';
COMMENT ON TABLE driver_performance IS 'Performance e gamificação dos motoristas';
COMMENT ON TABLE vehicle_locations IS 'Localizações em tempo real dos veículos';