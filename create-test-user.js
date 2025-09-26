const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  try {
    // Primeiro, vamos buscar uma empresa para associar o usuário
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companiesError) {
      console.error('Erro ao buscar empresas:', companiesError);
      return;
    }

    if (!companies || companies.length === 0) {
      console.error('Nenhuma empresa encontrada');
      return;
    }

    const company = companies[0];
    console.log('Empresa encontrada:', company);

    // Criar usuário de teste
    const testUserData = {
      email: 'admin@teste.com',
      password: '123456',
      name: 'Admin Teste',
      role: 'admin',
      company_id: company.id
    };

    console.log('Criando usuário de teste:', testUserData);

    // Fazer requisição para o endpoint de registro
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Usuário criado com sucesso:', result);
    } else {
      console.error('❌ Erro ao criar usuário:', result);
    }

  } catch (error) {
    console.error('Erro:', error);
  }
}

createTestUser();