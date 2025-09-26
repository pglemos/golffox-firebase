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

// Dados de exemplo
const sampleData = {
  companies: [
    {
      name: 'GolfFox Transportes Ltda',
      cnpj: '12.345.678/0001-90',
      contact: 'contato@golffox.com.br',
      status: 'Ativo',
      address_text: 'Av. Paulista, 1000 - São Paulo, SP',
      address_lat: -23.5613,
      address_lng: -46.6565,
      contracted_passengers: 500
    },
    {
      name: 'Transporte Seguro S.A.',
      cnpj: '98.765.432/0001-10',
      contact: 'admin@transporteseguro.com.br',
      status: 'Ativo',
      address_text: 'Rua das Flores, 500 - Rio de Janeiro, RJ',
      address_lat: -22.9068,
      address_lng: -43.1729,
      contracted_passengers: 250
    },
    {
      name: 'Via Rápida Transportes',
      cnpj: '11.222.333/0001-44',
      contact: 'contato@viarapida.com.br',
      status: 'Ativo',
      address_text: 'Av. Brasil, 2000 - Belo Horizonte, MG',
      address_lat: -19.9167,
      address_lng: -43.9345,
      contracted_passengers: 100
    }
  ],

  // Nota: usuários serão criados via API de registro, não diretamente no banco

  drivers: [
    {
      name: 'Carlos Oliveira',
      cpf: '123.456.789-01',
      rg: '12.345.678-9',
      birth_date: '1985-03-15',
      phone: '(11) 99999-1111',
      email: 'carlos@golffox.com.br',
      address: 'Rua A, 123 - São Paulo, SP',
      cep: '01234-567',
      cnh: '12345678901',
      cnh_validity: '2025-12-31',
      cnh_category: 'D',
      has_ear: true,
      transport_course_validity: '2025-06-30',
      last_toxicological_exam: '2024-01-15',
      contract_type: 'CLT',
      credentialing_date: '2023-01-15',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Roberto Costa',
      cpf: '987.654.321-02',
      rg: '98.765.432-1',
      birth_date: '1980-07-22',
      phone: '(11) 99999-2222',
      email: 'roberto@golffox.com.br',
      address: 'Rua B, 456 - São Paulo, SP',
      cep: '01234-890',
      cnh: '98765432102',
      cnh_validity: '2026-06-30',
      cnh_category: 'D',
      has_ear: true,
      transport_course_validity: '2025-12-15',
      last_toxicological_exam: '2024-02-10',
      contract_type: 'CLT',
      credentialing_date: '2023-03-20',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Pedro Almeida',
      cpf: '456.789.123-03',
      rg: '45.678.912-3',
      birth_date: '1978-11-08',
      phone: '(21) 99999-3333',
      email: 'pedro@transporteseguro.com.br',
      address: 'Av. Central, 789 - Rio de Janeiro, RJ',
      cep: '20000-123',
      cnh: '45678912303',
      cnh_validity: '2025-09-15',
      cnh_category: 'D',
      has_ear: false,
      transport_course_validity: '2025-03-30',
      last_toxicological_exam: '2023-12-05',
      contract_type: 'terceirizado',
      credentialing_date: '2022-11-10',
      status: 'Ativo',
      linked_company: 'Transporte Seguro S.A.'
    },
    {
      name: 'Ana Paula Santos',
      cpf: '789.123.456-04',
      rg: '78.912.345-6',
      birth_date: '1990-05-12',
      phone: '(11) 99999-4444',
      email: 'ana@golffox.com.br',
      address: 'Rua C, 321 - São Paulo, SP',
      cep: '01234-111',
      cnh: '78912345604',
      cnh_validity: '2026-03-20',
      cnh_category: 'D',
      has_ear: true,
      transport_course_validity: '2025-09-10',
      last_toxicological_exam: '2024-03-01',
      contract_type: 'CLT',
      credentialing_date: '2023-05-08',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    }
  ],

  vehicles: [
    {
      plate: 'ABC-1234',
      model: 'Mercedes-Benz Sprinter',
      status: 'Garagem',
      position_lat: -23.5505,
      position_lng: -46.6333,
      last_maintenance: '2024-01-15',
      next_maintenance: '2024-07-15',
      is_registered: true
    },
    {
      plate: 'DEF-5678',
      model: 'Iveco Daily',
      status: 'Garagem',
      position_lat: -23.5618,
      position_lng: -46.6565,
      last_maintenance: '2024-02-10',
      next_maintenance: '2024-08-10',
      is_registered: true
    },
    {
      plate: 'GHI-9012',
      model: 'Volkswagen Crafter',
      status: 'Garagem',
      position_lat: -22.9711,
      position_lng: -43.1822,
      last_maintenance: '2024-01-20',
      next_maintenance: '2024-07-20',
      is_registered: true
    }
  ],

  passengers: [
    {
      name: 'João da Silva',
      cpf: '111.222.333-44',
      email: 'joao@email.com',
      address: 'Rua das Flores, 100 - São Paulo, SP',
      position_lat: -23.5505,
      position_lng: -46.6333,
      pickup_time: '07:30:00',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Maria Oliveira',
      cpf: '222.333.444-55',
      email: 'maria@email.com',
      address: 'Av. Paulista, 200 - São Paulo, SP',
      position_lat: -23.5618,
      position_lng: -46.6565,
      pickup_time: '07:45:00',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Pedro Santos',
      cpf: '333.444.555-66',
      email: 'pedro@email.com',
      address: 'Rua Augusta, 300 - São Paulo, SP',
      position_lat: -23.5489,
      position_lng: -46.6388,
      pickup_time: '08:00:00',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Ana Costa',
      cpf: '444.555.666-77',
      email: 'ana@email.com',
      address: 'Copacabana, 400 - Rio de Janeiro, RJ',
      position_lat: -22.9711,
      position_lng: -43.1822,
      pickup_time: '08:15:00',
      status: 'Ativo',
      linked_company: 'Transporte Seguro S.A.'
    },
    {
      name: 'Carlos Ferreira',
      cpf: '555.666.777-88',
      email: 'carlos@email.com',
      address: 'Vila Madalena, 500 - São Paulo, SP',
      position_lat: -23.5440,
      position_lng: -46.6890,
      pickup_time: '07:15:00',
      status: 'Ativo',
      linked_company: 'GolfFox Transportes Ltda'
    }
  ],

  routes: [
    {
      name: 'Rota Centro - Zona Sul',
      status: 'No Horário',
      scheduled_start: '07:30:00',
      start_location: 'Centro - São Paulo, SP',
      destination: 'Vila Olímpia - São Paulo, SP',
      origin: 'Centro - São Paulo, SP',
      punctuality: 0,
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Rota Aeroporto - Hotéis',
      status: 'No Horário',
      scheduled_start: '06:00:00',
      start_location: 'Aeroporto de Congonhas - São Paulo, SP',
      destination: 'Região Hoteleira - São Paulo, SP',
      origin: 'Aeroporto de Congonhas - São Paulo, SP',
      punctuality: 5,
      linked_company: 'GolfFox Transportes Ltda'
    },
    {
      name: 'Rota Copacabana - Centro',
      status: 'No Horário',
      scheduled_start: '08:00:00',
      start_location: 'Copacabana - Rio de Janeiro, RJ',
      destination: 'Centro - Rio de Janeiro, RJ',
      origin: 'Copacabana - Rio de Janeiro, RJ',
      punctuality: -10,
      linked_company: 'Transporte Seguro S.A.'
    }
  ],

  alerts: [
    {
      type: 'Atenção',
      title: 'Manutenção Preventiva Veículo ABC-1234',
      message: 'Veículo ABC-1234 precisa de manutenção preventiva em 15 dias',
      is_read: false
    },
    {
      type: 'Crítico',
      title: 'CNH Vencendo - Carlos Oliveira',
      message: 'CNH do motorista Carlos Oliveira vence em 30 dias',
      is_read: false
    },
    {
      type: 'Informativo',
      title: 'Atraso na Rota Copacabana-Centro',
      message: 'Rota apresentou atraso de 20 minutos devido ao trânsito',
      is_read: true
    },
    {
      type: 'Crítico',
      title: 'Velocidade Excessiva Detectada',
      message: 'Veículo DEF-5678 excedeu limite de velocidade na Marginal Tietê',
      is_read: false
    }
  ]
};

// Função para buscar IDs das empresas
async function getCompanyIds() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name');

  if (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    return null;
  }

  const companyMap = {};
  companies.forEach(company => {
    companyMap[company.name] = company.id;
  });

  return companyMap;
}

// Função para processar dados baseado na estrutura de cada tabela
function processDataWithCompanyIds(data, companyMap, tableName) {
  return data.map(item => {
    const processedItem = { ...item };
    
    if (item.linked_company) {
      // Para drivers: manter linked_company como VARCHAR
      if (tableName === 'drivers') {
        // linked_company já está correto, não precisa alterar
      }
      // Para outras tabelas: converter para company_id UUID
      else if (companyMap[item.linked_company]) {
        processedItem.company_id = companyMap[item.linked_company];
        delete processedItem.linked_company;
      }
    }
    
    return processedItem;
  });
}

async function insertData(tableName, data) {
  console.log(`📝 Inserindo dados na tabela ${tableName}...`);
  
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data);

  if (error) {
    console.error(`❌ Erro ao inserir dados na tabela ${tableName}:`, error.message);
    return false;
  }

  console.log(`✅ ${data.length} registros inseridos na tabela ${tableName}`);
  return true;
}

// Função para limpar dados existentes
async function clearTable(tableName) {
  console.log(`🗑️ Limpando tabela ${tableName}...`);
  
  const { error } = await supabase
    .from(tableName)
    .delete()
    .not('id', 'is', null);

  if (error) {
    console.error(`❌ Erro ao limpar tabela ${tableName}:`, error.message);
    return false;
  }

  console.log(`✅ Tabela ${tableName} limpa`);
  return true;
}

// Função principal
async function populateDatabase() {
  console.log('🚀 Iniciando população do banco de dados...\n');

  try {
    // Limpar dados existentes (em ordem reversa devido às dependências)
    const tablesToClear = ['alerts', 'routes', 'passengers', 'vehicles', 'drivers', 'companies'];
    
    for (const table of tablesToClear) {
      await clearTable(table);
    }

    console.log('\n📊 Inserindo novos dados...\n');

    // Primeiro, inserir empresas
    const companiesSuccess = await insertData('companies', sampleData.companies);
    if (!companiesSuccess) {
      console.error('❌ Falha ao inserir empresas. Interrompendo processo.');
      return;
    }

    // Buscar IDs das empresas inseridas
    console.log('🔍 Buscando IDs das empresas...');
    const companyMap = await getCompanyIds();
    if (!companyMap) {
      console.error('❌ Falha ao buscar IDs das empresas. Interrompendo processo.');
      return;
    }

    console.log('✅ Mapeamento de empresas:', companyMap);

    // Processar e inserir dados com company_id correto
    const insertOrder = [
      { table: 'drivers', data: sampleData.drivers },
      { table: 'vehicles', data: sampleData.vehicles },
      { table: 'passengers', data: sampleData.passengers },
      { table: 'routes', data: sampleData.routes },
      { table: 'alerts', data: sampleData.alerts }
    ];

    for (const { table, data } of insertOrder) {
      const processedData = processDataWithCompanyIds(data, companyMap, table);
      const success = await insertData(table, processedData);
      if (!success) {
        console.error(`❌ Falha ao inserir dados na tabela ${table}. Interrompendo processo.`);
        return;
      }
    }

    console.log('\n🎉 População do banco de dados concluída com sucesso!');
    console.log('\n📈 Resumo dos dados inseridos:');
    console.log(`   • ${sampleData.companies.length} empresas`);
    console.log(`   • ${sampleData.drivers.length} motoristas`);
    console.log(`   • ${sampleData.vehicles.length} veículos`);
    console.log(`   • ${sampleData.passengers.length} passageiros`);
    console.log(`   • ${sampleData.routes.length} rotas`);
    console.log(`   • ${sampleData.alerts.length} alertas`);

  } catch (error) {
    console.error('❌ Erro durante a população do banco:', error.message);
  }
}

// Executar o script
populateDatabase();