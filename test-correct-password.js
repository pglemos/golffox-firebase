const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCorrectPassword() {
  console.log('🔍 Testando com a senha correta\n');

  try {
    // 1. Testar login direto com Supabase
    console.log('1. Testando login direto com Supabase (senha: 123456)...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@teste.com',
      password: '123456'
    });

    if (loginError) {
      console.error('❌ Erro no login direto:', loginError.message);
    } else {
      console.log('✅ Login direto funcionou!');
      console.log('📧 Email:', loginData.user.email);
      console.log('🔑 Token (primeiros 50 chars):', loginData.session.access_token.substring(0, 50) + '...');

      // 2. Testar API de profile com o token
      console.log('\n2. Testando API de profile...');
      const profileResponse = await fetch('http://localhost:3000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Status da resposta:', profileResponse.status);
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        console.log('✅ Profile API funcionou:', JSON.stringify(profileData, null, 2));
      } else {
        const errorData = await profileResponse.text();
        console.log('❌ Erro na Profile API:', errorData);
      }

      // 3. Testar API de drivers
      console.log('\n3. Testando API de drivers...');
      const driversResponse = await fetch('http://localhost:3000/api/drivers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Status da resposta:', driversResponse.status);
      
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        console.log('✅ Drivers API funcionou:', JSON.stringify(driversData, null, 2));
      } else {
        const errorData = await driversResponse.text();
        console.log('❌ Erro na Drivers API:', errorData);
      }
    }

    // 4. Testar login via API também
    console.log('\n4. Testando login via API (senha: 123456)...');
    const apiLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@teste.com',
        password: '123456'
      })
    });

    console.log('📊 Status do login via API:', apiLoginResponse.status);
    
    if (apiLoginResponse.ok) {
      const apiLoginData = await apiLoginResponse.json();
      console.log('✅ Login via API funcionou também!');
    } else {
      const errorData = await apiLoginResponse.text();
      console.log('❌ Erro no login via API:', errorData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testCorrectPassword();