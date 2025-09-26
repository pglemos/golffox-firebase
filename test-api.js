// Script de teste para validar os endpoints da API
// Execute com: node test-api.js

const BASE_URL = 'http://localhost:3000/api';

// Função para fazer requisições
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`\n${options.method || 'GET'} ${endpoint}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`Erro na requisição ${endpoint}:`, error.message);
    return { error };
  }
}

// Testes principais
async function runTests() {
  console.log('🚀 Iniciando testes da API GolfFox\n');

  // 1. Teste de registro de usuário
  console.log('=== TESTE 1: Registro de Usuário ===');
  const registerData = {
    email: 'admin@example.com',
    password: 'admin123456',
    name: 'Admin Teste',
    role: 'admin'
  };

  await makeRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerData)
  });

  // 2. Teste de login
  console.log('\n=== TESTE 2: Login ===');
  const loginData = {
    email: 'admin@teste.com',
    password: '123456'
  };

  const loginResult = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(loginData)
  });

  let authToken = null;
  if (loginResult.data && loginResult.data.session && loginResult.data.session.access_token) {
    authToken = loginResult.data.session.access_token;
    console.log('✅ Token obtido com sucesso');
  }

  if (!authToken) {
    console.log('❌ Não foi possível obter token de autenticação');
    return;
  }

  // Headers com autenticação
  const authHeaders = {
    'Authorization': `Bearer ${authToken}`
  };

  // 3. Teste de perfil
  console.log('\n=== TESTE 3: Perfil do Usuário ===');
  await makeRequest('/auth/profile', {
    headers: authHeaders
  });

  // 4. Teste de empresas
  console.log('\n=== TESTE 4: Listar Empresas ===');
  await makeRequest('/companies', {
    headers: authHeaders
  });

  // 5. Teste de criação de empresa
  console.log('\n=== TESTE 5: Criar Empresa ===');
  const companyData = {
    name: 'Empresa Teste',
    cnpj: '12345678000199',
    email: 'empresa@test.com',
    phone: '11999999999',
    address: 'Rua Teste, 123'
  };

  const companyResult = await makeRequest('/companies', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(companyData)
  });

  let companyId = null;
  if (companyResult.data && companyResult.data.data && companyResult.data.data.id) {
    companyId = companyResult.data.data.id;
    console.log('✅ Empresa criada com sucesso');
  }

  // 6. Teste de estatísticas
  console.log('\n=== TESTE 6: Estatísticas ===');
  await makeRequest('/stats', {
    headers: authHeaders
  });

  // 7. Teste de motoristas
  console.log('\n=== TESTE 7: Listar Motoristas ===');
  await makeRequest('/drivers', {
    headers: authHeaders
  });

  // 8. Teste de veículos
  console.log('\n=== TESTE 8: Listar Veículos ===');
  await makeRequest('/vehicles', {
    headers: authHeaders
  });

  // 9. Teste de passageiros
  console.log('\n=== TESTE 9: Listar Passageiros ===');
  await makeRequest('/passengers', {
    headers: authHeaders
  });

  // 10. Teste de rotas
  console.log('\n=== TESTE 10: Listar Rotas ===');
  await makeRequest('/routes', {
    headers: authHeaders
  });

  // 11. Teste de alertas
  console.log('\n=== TESTE 11: Listar Alertas ===');
  await makeRequest('/alerts', {
    headers: authHeaders
  });

  // 12. Teste de logout
  console.log('\n=== TESTE 12: Logout ===');
  await makeRequest('/auth/logout', {
    method: 'POST',
    headers: authHeaders
  });

  console.log('\n✅ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error);