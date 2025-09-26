const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserAuth() {
  console.log('🔍 Verificando dados de autenticação do usuário\n');

  try {
    // 1. Verificar usuário na tabela auth.users
    console.log('1. Verificando usuário na tabela auth.users...');
    const { data: authUsers, error: authError } = await supabaseServer
      .from('auth.users')
      .select('id, email, email_confirmed_at, created_at')
      .eq('email', 'admin@teste.com');

    if (authError) {
      console.log('❌ Erro ao acessar auth.users (esperado):', authError.message);
    } else {
      console.log('✅ Dados em auth.users:', authUsers);
    }

    // 2. Verificar usuário na tabela users (nossa tabela customizada)
    console.log('\n2. Verificando usuário na tabela users...');
    const { data: customUsers, error: customError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('email', 'admin@teste.com');

    if (customError) {
      console.error('❌ Erro ao buscar na tabela users:', customError.message);
    } else {
      console.log('✅ Dados na tabela users:', JSON.stringify(customUsers, null, 2));
    }

    // 3. Tentar listar todos os usuários autenticados (usando admin)
    console.log('\n3. Listando usuários autenticados...');
    const { data: allUsers, error: listError } = await supabaseServer.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
    } else {
      console.log('✅ Total de usuários autenticados:', allUsers.users.length);
      const adminUser = allUsers.users.find(u => u.email === 'admin@teste.com');
      if (adminUser) {
        console.log('👤 Usuário admin encontrado:');
        console.log('  ID:', adminUser.id);
        console.log('  Email:', adminUser.email);
        console.log('  Email confirmado:', adminUser.email_confirmed_at ? 'Sim' : 'Não');
        console.log('  Criado em:', adminUser.created_at);
      } else {
        console.log('❌ Usuário admin@teste.com não encontrado na autenticação');
      }
    }

    // 4. Testar login via API
    console.log('\n4. Testando login via API...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@teste.com',
        password: 'admin123456'
      })
    });

    console.log('📊 Status do login via API:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login via API funcionou');
      console.log('🔑 Token recebido:', loginData.session?.access_token ? 'Sim' : 'Não');
      
      // Testar o token recebido
      if (loginData.session?.access_token) {
        console.log('\n5. Testando validação do token recebido...');
        const { data: { user }, error: tokenError } = await supabaseServer.auth.getUser(loginData.session.access_token);
        
        if (tokenError) {
          console.error('❌ Token inválido:', tokenError.message);
        } else {
          console.log('✅ Token válido para usuário:', user.email);
        }
      }
    } else {
      const errorData = await loginResponse.text();
      console.log('❌ Erro no login via API:', errorData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkUserAuth();