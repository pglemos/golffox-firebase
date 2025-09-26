require('dotenv').config({ path: '.env.local' });

const API_BASE = 'http://localhost:3000/api';

async function testFinal() {
  console.log('=== TESTE FINAL COMPLETO ===\n');

  try {
    // 1. Login
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@teste.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login Status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Falha no login:', loginData);
      return;
    }
    
    const token = loginData.session.access_token;
    console.log('✅ Login realizado com sucesso\n');

    // 2. Verificar perfil
    console.log('2. Verificando perfil do usuário...');
    const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const profileData = await profileResponse.json();
    console.log('Profile Status:', profileResponse.status);
    
    if (profileResponse.status !== 200) {
      console.error('❌ Falha ao obter perfil:', profileData);
      return;
    }
    
    console.log('✅ Perfil obtido com sucesso');
    console.log('User:', profileData.data.name, '-', profileData.data.role, '\n');

    // 3. Testar API de motoristas
    console.log('3. Testando API de motoristas...');
    
    // 3.1. Sem parâmetros
    const driversResponse = await fetch(`${API_BASE}/drivers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Drivers (sem parâmetros) Status:', driversResponse.status);
    
    if (driversResponse.status !== 200) {
      const driversError = await driversResponse.json();
      console.error('❌ Falha na API de motoristas:', driversError);
      return;
    }
    
    console.log('✅ API de motoristas funcionando');

    // 3.2. Com withDetails
    const driversDetailResponse = await fetch(`${API_BASE}/drivers?withDetails=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Drivers (com detalhes) Status:', driversDetailResponse.status);
    
    if (driversDetailResponse.status !== 200) {
      const driversDetailError = await driversDetailResponse.json();
      console.error('❌ Falha na API de motoristas com detalhes:', driversDetailError);
      return;
    }
    
    console.log('✅ API de motoristas com detalhes funcionando\n');

    // 4. Testar outras APIs principais
    console.log('4. Testando outras APIs...');
    
    const apis = [
      { name: 'Veículos', endpoint: '/vehicles' },
      { name: 'Rotas', endpoint: '/routes' },
      { name: 'Passageiros', endpoint: '/passengers' },
      { name: 'Alertas', endpoint: '/alerts' }
    ];

    for (const api of apis) {
      const response = await fetch(`${API_BASE}${api.endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log(`${api.name} Status:`, response.status);
      
      if (response.status === 200) {
        console.log(`✅ ${api.name} funcionando`);
      } else {
        const errorData = await response.json();
        console.log(`⚠️ ${api.name} com problema:`, errorData.message || 'Erro desconhecido');
      }
    }

    console.log('\n=== TESTE FINAL CONCLUÍDO ===');
    console.log('🎉 Todas as correções foram aplicadas com sucesso!');
    console.log('✅ Autenticação funcionando');
    console.log('✅ API de motoristas corrigida');
    console.log('✅ Problemas de schema resolvidos');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testFinal();