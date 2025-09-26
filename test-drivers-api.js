const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api';

async function testDriversAPI() {
  try {
    console.log('=== TESTE ESPECÍFICO DA API DE MOTORISTAS ===\n');

    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      email: 'admin@teste.com',
      password: '123456'
    })
    });

    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    console.log('Login Response:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.error('❌ Falha no login');
      return;
    }

    const token = loginData.session.access_token;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Verificar dados do usuário
    console.log('2. Verificando dados do usuário...');
    const userResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const userData = await userResponse.json();
    console.log('User Status:', userResponse.status);
    console.log('User Data:', JSON.stringify(userData, null, 2));
    console.log('');

    // 3. Testar API de motoristas com diferentes parâmetros
    console.log('3. Testando API de motoristas...');
    
    // Teste sem parâmetros
    console.log('3.1. Sem parâmetros:');
    const driversResponse1 = await fetch(`${API_BASE}/drivers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const driversData1 = await driversResponse1.json();
    console.log('Status:', driversResponse1.status);
    console.log('Response:', JSON.stringify(driversData1, null, 2));
    console.log('');

    // Teste com withDetails
    console.log('3.2. Com withDetails=true:');
    const driversResponse2 = await fetch(`${API_BASE}/drivers?withDetails=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const driversData2 = await driversResponse2.json();
    console.log('Status:', driversResponse2.status);
    console.log('Response:', JSON.stringify(driversData2, null, 2));
    console.log('');

    // Teste com company_id específico
    if (userData.user && userData.user.company_id) {
      console.log('3.3. Com company_id específico:');
      const driversResponse3 = await fetch(`${API_BASE}/drivers?company_id=${userData.user.company_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      const driversData3 = await driversResponse3.json();
      console.log('Status:', driversResponse3.status);
      console.log('Response:', JSON.stringify(driversData3, null, 2));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testDriversAPI();