const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api';

async function testAuth() {
  try {
    console.log('=== TESTE DE AUTENTICAÇÃO ===\n');

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
    
    if (!loginResponse.ok) {
      console.error('❌ Falha no login:', loginData);
      return;
    }

    const token = loginData.session.access_token;
    console.log('✅ Login realizado com sucesso');
    console.log('Token (primeiros 50 chars):', token.substring(0, 50) + '...');
    console.log('');

    // 2. Testar health check (sem auth)
    console.log('2. Testando health check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('Health Status:', healthResponse.status);
    console.log('Health Response:', JSON.stringify(healthData, null, 2));
    console.log('');

    // 3. Testar profile (com auth)
    console.log('3. Testando profile...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile Status:', profileResponse.status);
    console.log('Profile Headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    const profileText = await profileResponse.text();
    console.log('Profile Raw Response:', profileText);
    
    try {
      const profileData = JSON.parse(profileText);
      console.log('Profile Data:', JSON.stringify(profileData, null, 2));
    } catch (e) {
      console.log('❌ Não foi possível fazer parse do JSON da resposta');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAuth();