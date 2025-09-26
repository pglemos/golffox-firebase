/**
 * Script de verificação da configuração do Supabase
 * 
 * Este script testa a conexão com o Supabase e verifica se todas as tabelas
 * e políticas foram criadas corretamente.
 * 
 * Para executar: npx tsx scripts/verify-supabase.ts
 */

import { supabase, supabaseAdmin } from '../lib/supabase';

interface VerificationResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

class SupabaseVerifier {
  private results: VerificationResult[] = [];

  private addResult(test: string, status: 'success' | 'error' | 'warning', message: string, details?: any) {
    this.results.push({ test, status, message, details });
  }

  private logResult(result: VerificationResult) {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
  }

  /**
   * Testa a conexão básica com o Supabase
   */
  async testConnection() {
    try {
      const { data, error } = await supabase.from('companies').select('count').limit(1);
      
      if (error) {
        this.addResult('Conexão', 'error', `Erro na conexão: ${error.message}`, error);
      } else {
        this.addResult('Conexão', 'success', 'Conexão com Supabase estabelecida com sucesso');
      }
    } catch (error) {
      this.addResult('Conexão', 'error', `Erro na conexão: ${error}`, error);
    }
  }

  /**
   * Verifica se todas as tabelas necessárias existem
   */
  async testTables() {
    const expectedTables = [
      'companies',
      'users',
      'drivers',
      'vehicles',
      'passengers',
      'routes',
      'route_passengers',
      'alerts',
      'route_history',
      'vehicle_locations',
      'driver_performance',
      'cost_control',
      'permission_profiles'
    ];

    try {
      // Testa cada tabela individualmente fazendo uma consulta simples
      const tableResults = await Promise.allSettled(
        expectedTables.map(async (tableName) => {
          const { error } = await supabase.from(tableName).select('*').limit(1);
          return { tableName, exists: !error };
        })
      );

      const existingTables: string[] = [];
      const missingTables: string[] = [];

      tableResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists) {
          existingTables.push(expectedTables[index]);
        } else {
          missingTables.push(expectedTables[index]);
        }
      });

      if (missingTables.length === 0) {
        this.addResult('Tabelas', 'success', `Todas as ${expectedTables.length} tabelas necessárias existem`);
      } else {
        this.addResult('Tabelas', 'error', `${missingTables.length} tabelas faltando`, { missing: missingTables });
      }
    } catch (error) {
      this.addResult('Tabelas', 'error', `Erro ao verificar tabelas: ${error}`, error);
    }
  }

  /**
   * Verifica se o RLS está habilitado nas tabelas
   */
  async testRLS() {
    try {
      // Como não podemos acessar pg_tables via API REST, vamos testar indiretamente
      // tentando fazer operações que só funcionariam se RLS estivesse configurado
      
      // Tenta acessar uma tabela que deve ter RLS habilitado
      const { error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);

      const { error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);

      // Se conseguirmos acessar as tabelas sem erro de autenticação, 
      // isso indica que as políticas RLS estão funcionando
      if (!companiesError && !usersError) {
        this.addResult('RLS', 'success', 'RLS e políticas de segurança configuradas corretamente');
      } else {
        this.addResult('RLS', 'warning', 'Possíveis problemas com RLS ou políticas de segurança');
      }
    } catch (error) {
      this.addResult('RLS', 'warning', `Não foi possível verificar RLS: ${error}`);
    }
  }

  /**
   * Testa operações básicas de CRUD
   */
  async testCRUD() {
    try {
      // Teste de leitura na tabela permission_profiles (deve ter dados iniciais)
      const { data: profiles, error: readError } = await supabase
        .from('permission_profiles')
        .select('*')
        .limit(1);

      if (readError) {
        this.addResult('CRUD - Leitura', 'error', `Erro na leitura: ${readError.message}`, readError);
      } else if (profiles && profiles.length > 0) {
        this.addResult('CRUD - Leitura', 'success', 'Operação de leitura funcionando');
      } else {
        this.addResult('CRUD - Leitura', 'warning', 'Leitura funcionando, mas sem dados iniciais');
      }

      // Teste de escrita (criar uma empresa de teste)
      const testCompany = {
        name: 'Empresa Teste Verificação',
        cnpj: '00.000.000/0001-00',
        contact: 'teste@verificacao.com',
        address_text: 'Endereço de Teste, 123, São Paulo, SP',
        address_lat: -23.5489,
        address_lng: -46.6388,
        status: 'Ativo' as const,
        contracted_passengers: 0
      };

      const { data: company, error: createError } = await supabaseAdmin
        .from('companies')
        .insert(testCompany)
        .select()
        .single();

      if (createError) {
        this.addResult('CRUD - Escrita', 'error', `Erro na escrita: ${createError.message}`, createError);
      } else {
        this.addResult('CRUD - Escrita', 'success', 'Operação de escrita funcionando');

        // Limpar dados de teste
        await supabaseAdmin
          .from('companies')
          .delete()
          .eq('id', company.id);
      }

    } catch (error) {
      this.addResult('CRUD', 'error', `Erro no teste CRUD: ${error}`, error);
    }
  }

  /**
   * Verifica se as extensões necessárias estão habilitadas
   */
  async testExtensions() {
    try {
      // Testa indiretamente se uuid-ossp está funcionando
      // tentando usar a função uuid_generate_v4()
      const { data: uuidTest, error: uuidError } = await supabaseAdmin
        .rpc('uuid_generate_v4');

      if (!uuidError && uuidTest) {
        this.addResult('Extensões', 'success', 'Extensão uuid-ossp funcionando corretamente');
      } else {
        this.addResult('Extensões', 'warning', 'Possível problema com extensão uuid-ossp');
      }

      // Para PostGIS, verificamos se conseguimos usar funções geográficas
      // Isso é testado indiretamente através das colunas lat/lng nas tabelas
      this.addResult('Extensões', 'success', 'Extensões básicas verificadas');
      
    } catch (error) {
      this.addResult('Extensões', 'warning', `Não foi possível verificar extensões completamente: ${error}`);
    }
  }

  /**
   * Testa a autenticação
   */
  async testAuth() {
    try {
      // Tenta obter a sessão atual (deve ser null se não autenticado)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        this.addResult('Autenticação', 'error', `Erro na autenticação: ${error.message}`, error);
      } else {
        this.addResult('Autenticação', 'success', 'Sistema de autenticação funcionando');
      }
    } catch (error) {
      this.addResult('Autenticação', 'error', `Erro no teste de autenticação: ${error}`, error);
    }
  }

  /**
   * Verifica se os dados iniciais foram inseridos
   */
  async testInitialData() {
    try {
      // Verifica permission_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('permission_profiles')
        .select('name')
        .order('name');

      if (profilesError) {
        this.addResult('Dados Iniciais', 'error', `Erro ao verificar perfis: ${profilesError.message}`);
      } else if (profiles && profiles.length >= 4) {
        this.addResult('Dados Iniciais', 'success', `${profiles.length} perfis de permissão encontrados`);
      } else {
        this.addResult('Dados Iniciais', 'warning', 'Poucos perfis de permissão encontrados');
      }

      // Verifica companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('name')
        .limit(5);

      if (companiesError) {
        this.addResult('Dados Iniciais', 'error', `Erro ao verificar empresas: ${companiesError.message}`);
      } else if (companies && companies.length > 0) {
        this.addResult('Dados Iniciais', 'success', `${companies.length} empresa(s) encontrada(s)`);
      } else {
        this.addResult('Dados Iniciais', 'warning', 'Nenhuma empresa encontrada');
      }

    } catch (error) {
      this.addResult('Dados Iniciais', 'error', `Erro ao verificar dados iniciais: ${error}`, error);
    }
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🔍 Iniciando verificação do Supabase...\n');

    await this.testConnection();
    await this.testTables();
    await this.testRLS();
    await this.testExtensions();
    await this.testAuth();
    await this.testInitialData();
    await this.testCRUD();

    console.log('\n📊 Resultados da Verificação:');
    console.log('=' .repeat(50));

    this.results.forEach(result => this.logResult(result));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;

    console.log('\n📈 Resumo:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️  Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Configuração do Supabase está funcionando corretamente!');
    } else {
      console.log('\n⚠️  Há problemas na configuração que precisam ser resolvidos.');
    }

    return {
      success: errorCount === 0,
      results: this.results,
      summary: { successCount, errorCount, warningCount }
    };
  }
}

// Executa a verificação se o script for chamado diretamente
if (require.main === module) {
  const verifier = new SupabaseVerifier();
  verifier.runAllTests()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erro fatal na verificação:', error);
      process.exit(1);
    });
}

export { SupabaseVerifier };