/**
 * Script de configuração inicial do projeto Golffox
 * 
 * Este script automatiza a configuração inicial do projeto,
 * incluindo criação de usuários de teste e dados de exemplo.
 * 
 * Para executar: npx tsx scripts/setup-project.ts
 */

import { supabaseAdmin } from '../lib/supabase';
import { SupabaseVerifier } from './verify-supabase';

interface SetupResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  details?: any;
}

class ProjectSetup {
  private results: SetupResult[] = [];

  private addResult(step: string, status: 'success' | 'error' | 'skipped', message: string, details?: any) {
    this.results.push({ step, status, message, details });
  }

  private logResult(result: SetupResult) {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  }

  /**
   * Verifica se o Supabase está configurado corretamente
   */
  async verifySupabase(): Promise<boolean> {
    console.log('🔍 Verificando configuração do Supabase...\n');
    
    const verifier = new SupabaseVerifier();
    const result = await verifier.runAllTests();
    
    if (result.success) {
      this.addResult('Verificação', 'success', 'Supabase configurado corretamente');
      return true;
    } else {
      this.addResult('Verificação', 'error', 'Problemas na configuração do Supabase encontrados');
      console.log('\n❌ Por favor, configure o Supabase primeiro seguindo as instruções em supabase/README.md\n');
      return false;
    }
  }

  /**
   * Cria usuário administrador de teste
   */
  async createAdminUser() {
    try {
      // Verificar se já existe um admin
      const { data: existingAdmin, error: checkError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        this.addResult('Admin User', 'error', `Erro ao verificar admin existente: ${checkError.message}`);
        return;
      }

      if (existingAdmin && existingAdmin.length > 0) {
        this.addResult('Admin User', 'skipped', 'Usuário admin já existe');
        return;
      }

      // Criar usuário admin via Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: 'admin@golffox.com',
        password: 'admin123456',
        email_confirm: true,
        user_metadata: {
          name: 'Administrador Golffox',
          role: 'admin'
        }
      });

      if (authError) {
        this.addResult('Admin User', 'error', `Erro ao criar usuário auth: ${authError.message}`);
        return;
      }

      // Obter ID da empresa Golffox
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', 'Golffox Transportes')
        .single();

      if (companyError) {
        this.addResult('Admin User', 'error', `Erro ao obter empresa: ${companyError.message}`);
        return;
      }

      // Criar registro na tabela users
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: 'admin@golffox.com',
          name: 'Administrador Golffox',
          role: 'admin',
          company_id: company.id
        });

      if (userError) {
        this.addResult('Admin User', 'error', `Erro ao criar registro do usuário: ${userError.message}`);
        return;
      }

      this.addResult('Admin User', 'success', 'Usuário admin criado com sucesso (admin@golffox.com / admin123456)');

    } catch (error) {
      this.addResult('Admin User', 'error', `Erro inesperado: ${error}`);
    }
  }

  /**
   * Cria dados de exemplo para demonstração
   */
  async createSampleData() {
    try {
      // Obter ID da empresa
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('name', 'Golffox Transportes')
        .single();

      if (companyError) {
        this.addResult('Sample Data', 'error', `Erro ao obter empresa: ${companyError.message}`);
        return;
      }

      // Criar motorista de exemplo
      const { data: driver, error: driverError } = await supabaseAdmin
        .from('drivers')
        .insert({
          name: 'João Silva',
          cpf: '12345678901',
          rg: '123456789',
          birth_date: '1980-05-15',
          phone: '(11) 99999-9999',
          email: 'joao.silva@golffox.com',
          address: 'Rua das Flores, 123',
          cep: '01234-567',
          cnh: '12345678901',
          cnh_validity: '2025-12-31',
          cnh_category: 'D',
          has_ear: true,
          last_toxicological_exam: '2024-01-15',
          photo_url: 'https://via.placeholder.com/150',
          contract_type: 'CLT',
          credentialing_date: '2024-01-01',
          status: 'active',
          linked_company: company.id,
          availability: 'Manhã e Tarde'
        })
        .select()
        .single();

      if (driverError) {
        this.addResult('Sample Data', 'error', `Erro ao criar motorista: ${driverError.message}`);
        return;
      }

      // Criar veículo de exemplo
      const { data: vehicle, error: vehicleError } = await supabaseAdmin
        .from('vehicles')
        .insert({
          plate: 'ABC-1234',
          model: 'Mercedes-Benz Sprinter',
          driver_id: driver.id,
          status: 'garage',
          position_lat: -23.5505,
          position_lng: -46.6333,
          last_maintenance: '2024-01-01',
          next_maintenance: '2024-07-01',
          is_registered: true
        })
        .select()
        .single();

      if (vehicleError) {
        this.addResult('Sample Data', 'error', `Erro ao criar veículo: ${vehicleError.message}`);
        return;
      }

      // Criar passageiro de exemplo
      const { data: passenger, error: passengerError } = await supabaseAdmin
        .from('passengers')
        .insert({
          name: 'Maria Santos',
          cpf: '98765432109',
          email: 'maria.santos@empresa.com',
          address: 'Av. Paulista, 1000',
          position_lat: -23.5616,
          position_lng: -46.6565,
          pickup_time: '07:30',
          photo_url: 'https://via.placeholder.com/150',
          company_id: company.id,
          permission_profile_id: (await supabaseAdmin
            .from('permission_profiles')
            .select('id')
            .eq('name', 'Passageiro')
            .single()).data?.id || '',
          status: 'active'
        })
        .select()
        .single();

      if (passengerError) {
        this.addResult('Sample Data', 'error', `Erro ao criar passageiro: ${passengerError.message}`);
        return;
      }

      // Criar rota de exemplo
      const { data: route, error: routeError } = await supabaseAdmin
        .from('routes')
        .insert({
          name: 'Rota Centro - Zona Sul',
          driver_id: driver.id,
          vehicle_id: vehicle.id,
          status: 'on_time',
          scheduled_start: '07:00',
          punctuality: 95,
          start_location: 'Centro',
          destination: 'Zona Sul',
          origin: 'Garagem Central',
          company_id: company.id
        })
        .select()
        .single();

      if (routeError) {
        this.addResult('Sample Data', 'error', `Erro ao criar rota: ${routeError.message}`);
        return;
      }

      // Associar passageiro à rota
      const { error: routePassengerError } = await supabaseAdmin
        .from('route_passengers')
        .insert({
          route_id: route.id,
          passenger_id: passenger.id,
          pickup_order: 1,
          is_onboard: false
        });

      if (routePassengerError) {
        this.addResult('Sample Data', 'error', `Erro ao associar passageiro à rota: ${routePassengerError.message}`);
        return;
      }

      this.addResult('Sample Data', 'success', 'Dados de exemplo criados com sucesso');

    } catch (error) {
      this.addResult('Sample Data', 'error', `Erro inesperado: ${error}`);
    }
  }

  /**
   * Executa toda a configuração inicial
   */
  async runSetup() {
    console.log('🚀 Iniciando configuração do projeto Golffox...\n');

    // Verificar Supabase
    const isSupabaseReady = await this.verifySupabase();
    if (!isSupabaseReady) {
      return false;
    }

    console.log('\n📝 Criando dados iniciais...\n');

    // Criar usuário admin
    await this.createAdminUser();

    // Criar dados de exemplo
    await this.createSampleData();

    console.log('\n📊 Resultados da Configuração:');
    console.log('=' .repeat(50));

    this.results.forEach(result => this.logResult(result));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const skippedCount = this.results.filter(r => r.status === 'skipped').length;

    console.log('\n📈 Resumo:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⏭️  Ignorados: ${skippedCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Projeto configurado com sucesso!');
      console.log('\n📋 Credenciais de acesso:');
      console.log('   Email: admin@golffox.com');
      console.log('   Senha: admin123456');
      console.log('\n🌐 Acesse: http://localhost:3000');
    } else {
      console.log('\n⚠️  Há problemas na configuração que precisam ser resolvidos.');
    }

    return errorCount === 0;
  }
}

// Executa a configuração se o script for chamado diretamente
if (require.main === module) {
  const setup = new ProjectSetup();
  setup.runSetup()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal na configuração:', error);
      process.exit(1);
    });
}

export { ProjectSetup };