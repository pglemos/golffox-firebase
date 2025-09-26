-- Políticas de Segurança RLS (Row Level Security) para Golffox
-- Este arquivo configura as políticas de acesso baseadas no papel do usuário

-- Habilitar RLS em todas as tabelas
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_profiles ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter o papel do usuário atual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para obter a empresa do usuário atual
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário é operador
CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'operator';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário é motorista
CREATE OR REPLACE FUNCTION is_driver()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'driver';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o usuário é passageiro
CREATE OR REPLACE FUNCTION is_passenger()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role() = 'passenger';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- POLÍTICAS PARA TABELA COMPANIES
-- ========================================

-- Admins podem ver todas as empresas
CREATE POLICY "Admins can view all companies" ON companies
    FOR SELECT USING (is_admin());

-- Operadores podem ver apenas sua própria empresa
CREATE POLICY "Operators can view their company" ON companies
    FOR SELECT USING (is_operator() AND id = get_user_company_id());

-- Admins podem inserir empresas
CREATE POLICY "Admins can insert companies" ON companies
    FOR INSERT WITH CHECK (is_admin());

-- Admins podem atualizar empresas
CREATE POLICY "Admins can update companies" ON companies
    FOR UPDATE USING (is_admin());

-- Admins podem deletar empresas
CREATE POLICY "Admins can delete companies" ON companies
    FOR DELETE USING (is_admin());

-- ========================================
-- POLÍTICAS PARA TABELA USERS
-- ========================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin());

-- Operadores podem ver usuários de sua empresa
CREATE POLICY "Operators can view company users" ON users
    FOR SELECT USING (is_operator() AND company_id = get_user_company_id());

-- Admins podem inserir usuários
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (is_admin());

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Admins podem atualizar qualquer usuário
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (is_admin());

-- ========================================
-- POLÍTICAS PARA TABELA DRIVERS
-- ========================================

-- Admins podem ver todos os motoristas
CREATE POLICY "Admins can view all drivers" ON drivers
    FOR SELECT USING (is_admin());

-- Operadores podem ver motoristas de sua empresa
CREATE POLICY "Operators can view company drivers" ON drivers
    FOR SELECT USING (is_operator() AND linked_company = (SELECT name FROM companies WHERE id = get_user_company_id()));

-- Motoristas podem ver seu próprio perfil
CREATE POLICY "Drivers can view their own profile" ON drivers
    FOR SELECT USING (is_driver() AND user_id = auth.uid());

-- Admins podem inserir motoristas
CREATE POLICY "Admins can insert drivers" ON drivers
    FOR INSERT WITH CHECK (is_admin());

-- Admins podem atualizar motoristas
CREATE POLICY "Admins can update drivers" ON drivers
    FOR UPDATE USING (is_admin());

-- Motoristas podem atualizar alguns campos do próprio perfil
CREATE POLICY "Drivers can update their own profile" ON drivers
    FOR UPDATE USING (is_driver() AND user_id = auth.uid());

-- ========================================
-- POLÍTICAS PARA TABELA VEHICLES
-- ========================================

-- Admins podem ver todos os veículos
CREATE POLICY "Admins can view all vehicles" ON vehicles
    FOR SELECT USING (is_admin());

-- Operadores podem ver veículos relacionados às suas rotas
CREATE POLICY "Operators can view company vehicles" ON vehicles
    FOR SELECT USING (
        is_operator() AND 
        route_id IN (
            SELECT id FROM routes WHERE company_id = get_user_company_id()
        )
    );

-- Motoristas podem ver veículos atribuídos a eles
CREATE POLICY "Drivers can view their vehicles" ON vehicles
    FOR SELECT USING (
        is_driver() AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Admins podem inserir/atualizar/deletar veículos
CREATE POLICY "Admins can manage vehicles" ON vehicles
    FOR ALL USING (is_admin());

-- ========================================
-- POLÍTICAS PARA TABELA PASSENGERS
-- ========================================

-- Admins podem ver todos os passageiros
CREATE POLICY "Admins can view all passengers" ON passengers
    FOR SELECT USING (is_admin());

-- Operadores podem ver passageiros de sua empresa
CREATE POLICY "Operators can view company passengers" ON passengers
    FOR SELECT USING (is_operator() AND company_id = get_user_company_id());

-- Passageiros podem ver seu próprio perfil
CREATE POLICY "Passengers can view their own profile" ON passengers
    FOR SELECT USING (is_passenger() AND user_id = auth.uid());

-- Motoristas podem ver passageiros de suas rotas
CREATE POLICY "Drivers can view route passengers" ON passengers
    FOR SELECT USING (
        is_driver() AND 
        id IN (
            SELECT passenger_id FROM route_passengers 
            WHERE route_id IN (
                SELECT id FROM routes 
                WHERE driver_id IN (
                    SELECT id FROM drivers WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Admins e operadores podem inserir passageiros
CREATE POLICY "Admins and operators can insert passengers" ON passengers
    FOR INSERT WITH CHECK (is_admin() OR (is_operator() AND company_id = get_user_company_id()));

-- Admins e operadores podem atualizar passageiros
CREATE POLICY "Admins and operators can update passengers" ON passengers
    FOR UPDATE USING (is_admin() OR (is_operator() AND company_id = get_user_company_id()));

-- ========================================
-- POLÍTICAS PARA TABELA ROUTES
-- ========================================

-- Admins podem ver todas as rotas
CREATE POLICY "Admins can view all routes" ON routes
    FOR SELECT USING (is_admin());

-- Operadores podem ver rotas de sua empresa
CREATE POLICY "Operators can view company routes" ON routes
    FOR SELECT USING (is_operator() AND company_id = get_user_company_id());

-- Motoristas podem ver suas rotas
CREATE POLICY "Drivers can view their routes" ON routes
    FOR SELECT USING (
        is_driver() AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Passageiros podem ver rotas em que estão incluídos
CREATE POLICY "Passengers can view their routes" ON routes
    FOR SELECT USING (
        is_passenger() AND 
        id IN (
            SELECT route_id FROM route_passengers 
            WHERE passenger_id IN (
                SELECT id FROM passengers WHERE user_id = auth.uid()
            )
        )
    );

-- Admins e operadores podem gerenciar rotas
CREATE POLICY "Admins can manage all routes" ON routes
    FOR ALL USING (is_admin());

CREATE POLICY "Operators can manage company routes" ON routes
    FOR ALL USING (is_operator() AND company_id = get_user_company_id());

-- ========================================
-- POLÍTICAS PARA TABELA ROUTE_PASSENGERS
-- ========================================

-- Admins podem ver todos os relacionamentos
CREATE POLICY "Admins can view all route_passengers" ON route_passengers
    FOR SELECT USING (is_admin());

-- Operadores podem ver relacionamentos de sua empresa
CREATE POLICY "Operators can view company route_passengers" ON route_passengers
    FOR SELECT USING (
        is_operator() AND 
        route_id IN (
            SELECT id FROM routes WHERE company_id = get_user_company_id()
        )
    );

-- Motoristas podem ver passageiros de suas rotas
CREATE POLICY "Drivers can view their route_passengers" ON route_passengers
    FOR SELECT USING (
        is_driver() AND 
        route_id IN (
            SELECT id FROM routes 
            WHERE driver_id IN (
                SELECT id FROM drivers WHERE user_id = auth.uid()
            )
        )
    );

-- Passageiros podem ver suas próprias associações
CREATE POLICY "Passengers can view their route_passengers" ON route_passengers
    FOR SELECT USING (
        is_passenger() AND 
        passenger_id IN (
            SELECT id FROM passengers WHERE user_id = auth.uid()
        )
    );

-- Admins e operadores podem gerenciar relacionamentos
CREATE POLICY "Admins can manage route_passengers" ON route_passengers
    FOR ALL USING (is_admin());

CREATE POLICY "Operators can manage company route_passengers" ON route_passengers
    FOR ALL USING (
        is_operator() AND 
        route_id IN (
            SELECT id FROM routes WHERE company_id = get_user_company_id()
        )
    );

-- ========================================
-- POLÍTICAS PARA TABELA ALERTS
-- ========================================

-- Usuários podem ver alertas direcionados a eles
CREATE POLICY "Users can view their alerts" ON alerts
    FOR SELECT USING (user_id = auth.uid());

-- Admins podem ver todos os alertas
CREATE POLICY "Admins can view all alerts" ON alerts
    FOR SELECT USING (is_admin());

-- Operadores podem ver alertas de sua empresa
CREATE POLICY "Operators can view company alerts" ON alerts
    FOR SELECT USING (
        is_operator() AND 
        (route_id IN (SELECT id FROM routes WHERE company_id = get_user_company_id()) OR
         vehicle_id IN (SELECT id FROM vehicles WHERE route_id IN (SELECT id FROM routes WHERE company_id = get_user_company_id())))
    );

-- Sistema pode inserir alertas
CREATE POLICY "System can insert alerts" ON alerts
    FOR INSERT WITH CHECK (true);

-- Usuários podem marcar seus alertas como lidos
CREATE POLICY "Users can update their alerts" ON alerts
    FOR UPDATE USING (user_id = auth.uid());

-- ========================================
-- POLÍTICAS PARA TABELA ROUTE_HISTORY
-- ========================================

-- Admins podem ver todo o histórico
CREATE POLICY "Admins can view all route_history" ON route_history
    FOR SELECT USING (is_admin());

-- Operadores podem ver histórico de sua empresa
CREATE POLICY "Operators can view company route_history" ON route_history
    FOR SELECT USING (
        is_operator() AND 
        route_id IN (
            SELECT id FROM routes WHERE company_id = get_user_company_id()
        )
    );

-- Motoristas podem ver histórico de suas rotas
CREATE POLICY "Drivers can view their route_history" ON route_history
    FOR SELECT USING (
        is_driver() AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Sistema pode inserir histórico
CREATE POLICY "System can insert route_history" ON route_history
    FOR INSERT WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA TABELA VEHICLE_LOCATIONS
-- ========================================

-- Admins podem ver todas as localizações
CREATE POLICY "Admins can view all vehicle_locations" ON vehicle_locations
    FOR SELECT USING (is_admin());

-- Operadores podem ver localizações de veículos de sua empresa
CREATE POLICY "Operators can view company vehicle_locations" ON vehicle_locations
    FOR SELECT USING (
        is_operator() AND 
        vehicle_id IN (
            SELECT id FROM vehicles 
            WHERE route_id IN (
                SELECT id FROM routes WHERE company_id = get_user_company_id()
            )
        )
    );

-- Motoristas podem ver localização de seus veículos
CREATE POLICY "Drivers can view their vehicle_locations" ON vehicle_locations
    FOR SELECT USING (
        is_driver() AND 
        vehicle_id IN (
            SELECT id FROM vehicles 
            WHERE driver_id IN (
                SELECT id FROM drivers WHERE user_id = auth.uid()
            )
        )
    );

-- Passageiros podem ver localizações de veículos de suas rotas
CREATE POLICY "Passengers can view their route vehicle_locations" ON vehicle_locations
    FOR SELECT USING (
        is_passenger() AND 
        vehicle_id IN (
            SELECT vehicle_id FROM routes 
            WHERE id IN (
                SELECT route_id FROM route_passengers 
                WHERE passenger_id IN (
                    SELECT id FROM passengers WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Sistema pode inserir localizações
CREATE POLICY "System can insert vehicle_locations" ON vehicle_locations
    FOR INSERT WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA TABELA PERMISSION_PROFILES
-- ========================================

-- Todos os usuários autenticados podem ver perfis de permissão
CREATE POLICY "Authenticated users can view permission_profiles" ON permission_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admins podem gerenciar perfis de permissão
CREATE POLICY "Admins can manage permission_profiles" ON permission_profiles
    FOR ALL USING (is_admin());

-- ========================================
-- POLÍTICAS PARA TABELAS DE CONTROLE E PERFORMANCE
-- ========================================

-- Admins podem ver tudo
CREATE POLICY "Admins can view all cost_control" ON cost_control
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all driver_performance" ON driver_performance
    FOR SELECT USING (is_admin());

-- Operadores podem ver dados de sua empresa
CREATE POLICY "Operators can view company cost_control" ON cost_control
    FOR SELECT USING (
        is_operator() AND 
        route_id IN (
            SELECT id FROM routes WHERE company_id = get_user_company_id()
        )
    );

CREATE POLICY "Operators can view company driver_performance" ON driver_performance
    FOR SELECT USING (
        is_operator() AND 
        driver_id IN (
            SELECT d.id FROM drivers d
            JOIN routes r ON d.id = r.driver_id
            WHERE r.company_id = get_user_company_id()
        )
    );

-- Motoristas podem ver sua própria performance
CREATE POLICY "Drivers can view their own performance" ON driver_performance
    FOR SELECT USING (
        is_driver() AND 
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Sistema pode inserir dados de controle e performance
CREATE POLICY "System can insert cost_control" ON cost_control
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert driver_performance" ON driver_performance
    FOR INSERT WITH CHECK (true);

-- Admins podem atualizar dados de controle e performance
CREATE POLICY "Admins can update cost_control" ON cost_control
    FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can update driver_performance" ON driver_performance
    FOR UPDATE USING (is_admin());