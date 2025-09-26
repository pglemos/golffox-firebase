const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserCompany() {
  try {
    // Buscar uma empresa
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companyError) {
      console.error('❌ Erro ao buscar empresa:', companyError.message);
      return;
    }

    if (!companies || companies.length === 0) {
      console.error('❌ Nenhuma empresa encontrada');
      return;
    }

    const company = companies[0];
    console.log('Empresa encontrada:', company);

    // Atualizar o usuário admin@teste.com
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ company_id: company.id })
      .eq('email', 'admin@teste.com');

    if (updateError) {
      console.error('❌ Erro ao atualizar usuário:', updateError.message);
      return;
    }

    console.log('✅ Usuário atualizado com sucesso!');

    // Verificar se a atualização funcionou
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, company_id')
      .eq('email', 'admin@teste.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao verificar usuário:', userError.message);
      return;
    }

    console.log('Usuário verificado:', user);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

updateUserCompany();