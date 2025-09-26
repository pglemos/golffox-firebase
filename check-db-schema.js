const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseSchema() {
  console.log('🔍 Verificando estrutura das tabelas...\n');

  try {
    // Verificar estrutura da tabela permission_profiles
    console.log('📋 Estrutura da tabela permission_profiles:');
    const { data: permissionProfiles, error: ppError } = await supabase
      .from('permission_profiles')
      .select('*')
      .limit(1);

    if (ppError) {
      console.error('❌ Erro ao consultar permission_profiles:', ppError.message);
    } else {
      console.log('✅ Tabela permission_profiles encontrada');
      if (permissionProfiles && permissionProfiles.length > 0) {
        console.log('📊 Colunas disponíveis:', Object.keys(permissionProfiles[0]));
      } else {
        console.log('⚠️ Tabela permission_profiles está vazia');
      }
    }

    console.log('\n📋 Estrutura da tabela users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Erro ao consultar users:', usersError.message);
    } else {
      console.log('✅ Tabela users encontrada');
      if (users && users.length > 0) {
        console.log('📊 Colunas disponíveis:', Object.keys(users[0]));
      } else {
        console.log('⚠️ Tabela users está vazia');
      }
    }

    console.log('\n📋 Estrutura da tabela companies:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companiesError) {
      console.error('❌ Erro ao consultar companies:', companiesError.message);
    } else {
      console.log('✅ Tabela companies encontrada');
      if (companies && companies.length > 0) {
        console.log('📊 Colunas disponíveis:', Object.keys(companies[0]));
      } else {
        console.log('⚠️ Tabela companies está vazia');
      }
    }

    // Verificar dados específicos do usuário de teste
    console.log('\n👤 Verificando dados do usuário admin@teste.com:');
    const { data: testUser, error: testUserError } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          id,
          name,
          status
        ),
        permission_profiles (
          id,
          name
        )
      `)
      .eq('email', 'admin@teste.com')
      .single();

    if (testUserError) {
      console.error('❌ Erro ao buscar usuário de teste:', testUserError.message);
    } else {
      console.log('✅ Usuário de teste encontrado:');
      console.log('📧 Email:', testUser.email);
      console.log('👤 Nome:', testUser.name);
      console.log('🏢 Company ID:', testUser.company_id);
      console.log('🏢 Company Name:', testUser.companies?.name || 'N/A');
      console.log('🔑 Profile ID:', testUser.profile_id);
      console.log('🔑 Profile Name:', testUser.permission_profiles?.name || 'N/A');
      console.log('🎭 Role:', testUser.role);
      console.log('✅ Ativo:', testUser.is_active);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDatabaseSchema();