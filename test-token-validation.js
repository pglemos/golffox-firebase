const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

async function testTokenValidation() {
  console.log('🔍 Teste de Validação de Token\n');

  try {
    // 1. Fazer login
    console.log('1. Fazendo login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@teste.com',
      password: 'admin123456'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('📧 Email:', loginData.user.email);
    console.log('🔑 Token (primeiros 50 chars):', loginData.session.access_token.substring(0, 50) + '...');

    // 2. Testar validação do token usando o cliente servidor
    console.log('\n2. Testando validação do token...');
    const { data: { user }, error: tokenError } = await supabaseServer.auth.getUser(loginData.session.access_token);

    if (tokenError) {
      console.error('❌ Erro na validação do token:', tokenError.message);
      return;
    }

    console.log('✅ Token válido');
    console.log('👤 User ID:', user.id);
    console.log('📧 Email:', user.email);

    // 3. Buscar dados do usuário na tabela users
    console.log('\n3. Buscando dados do usuário na tabela users...');
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, name, role, company_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar dados do usuário:', userError.message);
      return;
    }

    console.log('✅ Dados do usuário encontrados:');
    console.log('👤 ID:', userData.id);
    console.log('📧 Email:', userData.email);
    console.log('👤 Nome:', userData.name);
    console.log('🎭 Role:', userData.role);
    console.log('🏢 Company ID:', userData.company_id);

    // 4. Testar uma chamada para a API usando fetch
    console.log('\n4. Testando chamada para API usando fetch...');
    const response = await fetch('http://localhost:3000/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const profileData = await response.json();
      console.log('✅ Resposta da API:', JSON.stringify(profileData, null, 2));
    } else {
      const errorData = await response.text();
      console.log('❌ Erro da API:', errorData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testTokenValidation();