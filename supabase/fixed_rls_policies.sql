-- ========================================
-- POLÍTICAS RLS CORRIGIDAS - SEM RECURSÃO
-- ========================================

-- Primeiro, vamos remover TODAS as políticas que dependem das funções problemáticas
-- POLÍTICAS DA TABELA USERS
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Operators can view company users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- POLÍTICAS DA TABELA COMPANIES
DROP POLICY IF EXISTS "Operators can view their company" ON companies;

-- POLÍTICAS DA TABELA DRIVERS
DROP POLICY IF EXISTS "Operators can view company drivers" ON drivers;

-- POLÍTICAS DA TABELA VEHICLES
DROP POLICY IF EXISTS "Operators can view company vehicles" ON vehicles;

-- POLÍTICAS DA TABELA PASSENGERS
DROP POLICY IF EXISTS "Operators can view company passengers" ON passengers;
DROP POLICY IF EXISTS "Admins and operators can insert passengers" ON passengers;
DROP POLICY IF EXISTS "Admins and operators can update passengers" ON passengers;

-- POLÍTICAS DA TABELA ROUTES
DROP POLICY IF EXISTS "Operators can view company routes" ON routes;
DROP POLICY IF EXISTS "Operators can manage company routes" ON routes;

-- POLÍTICAS DA TABELA ROUTE_PASSENGERS
DROP POLICY IF EXISTS "Operators can view company route_passengers" ON route_passengers;
DROP POLICY IF EXISTS "Operators can manage company route_passengers" ON route_passengers;

-- POLÍTICAS DA TABELA ALERTS
DROP POLICY IF EXISTS "Operators can view company alerts" ON alerts;

-- POLÍTICAS DA TABELA ROUTE_HISTORY
DROP POLICY IF EXISTS "Operators can view company route_history" ON route_history;

-- POLÍTICAS DA TABELA VEHICLE_LOCATIONS
DROP POLICY IF EXISTS "Operators can view company vehicle_locations" ON vehicle_locations;

-- POLÍTICAS DA TABELA COST_CONTROL
DROP POLICY IF EXISTS "Operators can view company cost_control" ON cost_control;

-- POLÍTICAS DA TABELA DRIVER_PERFORMANCE
DROP POLICY IF EXISTS "Operators can view company driver_performance" ON driver_performance;

-- Agora podemos remover as funções que causam recursão
DROP FUNCTION IF EXISTS get_user_role() CASCADE;
DROP FUNCTION IF EXISTS get_user_company_id() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_operator() CASCADE;
DROP FUNCTION IF EXISTS is_driver() CASCADE;
DROP FUNCTION IF EXISTS is_passenger() CASCADE;

-- ========================================
-- NOVAS FUNÇÕES AUXILIARES (SEM RECURSÃO)
-- ========================================

-- Função para verificar se o usuário é admin (usando auth.uid() diretamente)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é operador
CREATE OR REPLACE FUNCTION is_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'operator'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é motorista
CREATE OR REPLACE FUNCTION is_driver()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'driver'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário é passageiro
CREATE OR REPLACE FUNCTION is_passenger()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'passenger'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter a empresa do usuário atual
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

-- Função para obter o papel do usuário atual
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

-- Função para obter o nome da empresa do usuário (para drivers que usam linked_company)
CREATE OR REPLACE FUNCTION get_user_company_name()
RETURNS VARCHAR AS $$
BEGIN
    RETURN (
        SELECT c.name 
        FROM users u
        JOIN companies c ON c.id = u.company_id
        WHERE u.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- NOVAS POLÍTICAS PARA TABELA USERS (SEM RECURSÃO)
-- ========================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

-- Admins podem ver todos os usuários (usando consulta direta)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Operadores podem ver usuários de sua empresa (usando consulta direta)
CREATE POLICY "Operators can view company users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'operator'
            AND u.company_id = users.company_id
        )
    );

-- Admins podem inserir usuários
CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Admins podem atualizar qualquer usuário
CREATE POLICY "Admins can update any user" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = auth.uid() 
            AND u.role = 'admin'
        )
    );

-- ========================================
-- RECRIAR POLÍTICAS PARA OUTRAS TABELAS
-- ========================================

-- POLÍTICAS PARA COMPANIES
CREATE POLICY "Operators can view their company" ON companies
    FOR SELECT USING (is_operator() AND id = get_user_company_id());

-- POLÍTICAS PARA DRIVERS (usa linked_company como VARCHAR, não company_id)
CREATE POLICY "Operators can view company drivers" ON drivers
    FOR SELECT USING (is_operator() AND linked_company = get_user_company_name());

-- POLÍTICAS PARA VEHICLES (não tem company_id, vamos permitir acesso baseado no driver)
CREATE POLICY "Operators can view vehicles" ON vehicles
    FOR SELECT USING (is_operator() OR is_admin());

-- POLÍTICAS PARA PASSENGERS (tem company_id)
CREATE POLICY "Operators can view company passengers" ON passengers
    FOR SELECT USING (is_operator() AND company_id = get_user_company_id());

CREATE POLICY "Admins and operators can insert passengers" ON passengers
    FOR INSERT WITH CHECK (is_admin() OR (is_operator() AND company_id = get_user_company_id()));

CREATE POLICY "Admins and operators can update passengers" ON passengers
    FOR UPDATE USING (is_admin() OR (is_operator() AND company_id = get_user_company_id()));

-- POLÍTICAS PARA ROUTES (tem company_id)
CREATE POLICY "Operators can view company routes" ON routes
    FOR SELECT USING (is_operator() AND company_id = get_user_company_id());

CREATE POLICY "Operators can manage company routes" ON routes
    FOR ALL USING (is_operator() AND company_id = get_user_company_id());

-- POLÍTICAS PARA ROUTE_PASSENGERS
CREATE POLICY "Operators can view company route_passengers" ON route_passengers
    FOR SELECT USING (is_operator() AND EXISTS (
        SELECT 1 FROM routes r WHERE r.id = route_passengers.route_id AND r.company_id = get_user_company_id()
    ));

CREATE POLICY "Operators can manage company route_passengers" ON route_passengers
    FOR ALL USING (is_operator() AND EXISTS (
        SELECT 1 FROM routes r WHERE r.id = route_passengers.route_id AND r.company_id = get_user_company_id()
    ));

-- POLÍTICAS PARA ALERTS (não tem company_id, vamos permitir acesso baseado no user_id)
CREATE POLICY "Users can view their alerts" ON alerts
    FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- POLÍTICAS PARA ROUTE_HISTORY (não tem company_id, vamos usar route_id)
CREATE POLICY "Operators can view company route_history" ON route_history
    FOR SELECT USING (is_operator() AND EXISTS (
        SELECT 1 FROM routes r WHERE r.id = route_history.route_id AND r.company_id = get_user_company_id()
    ));

-- POLÍTICAS PARA VEHICLE_LOCATIONS (não tem company_id, vamos permitir acesso geral para operadores)
CREATE POLICY "Operators can view vehicle_locations" ON vehicle_locations
    FOR SELECT USING (is_operator() OR is_admin());

-- POLÍTICAS PARA COST_CONTROL (não tem company_id, vamos usar route_id)
CREATE POLICY "Operators can view company cost_control" ON cost_control
    FOR SELECT USING (is_operator() AND EXISTS (
        SELECT 1 FROM routes r WHERE r.id = cost_control.route_id AND r.company_id = get_user_company_id()
    ));

-- POLÍTICAS PARA DRIVER_PERFORMANCE (não tem company_id, vamos usar driver_id)
CREATE POLICY "Operators can view company driver_performance" ON driver_performance
    FOR SELECT USING (is_operator() AND EXISTS (
        SELECT 1 FROM drivers d WHERE d.id = driver_performance.driver_id AND d.linked_company = get_user_company_name()
    ));