const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
require('dotenv').config({ path: '.env.local' });

// Configuração do Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('❌ Variáveis de ambiente do Firebase Admin não encontradas');
  process.exit(1);
}

// Inicializar Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId
});

const db = getFirestore(app, 'golffox-main');

// Dados de exemplo
const sampleData = {
  companies: [
    {
      name: 'GolfFox Transportes Ltda',
      cnpj: '12.345.678/0001-90',
      contact: 'contato@golffox.com.br',
      status: 'Ativo',
      addressText: 'Av. Paulista, 1000 - São Paulo, SP',
      addressLat: -23.5613,
      addressLng: -46.6565,
      contractedPassengers: 500,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Transporte Seguro S.A.',
      cnpj: '98.765.432/0001-10',
      contact: 'admin@transporteseguro.com.br',
      status: 'Ativo',
      addressText: 'Rua das Flores, 500 - Rio de Janeiro, RJ',
      addressLat: -22.9068,
      addressLng: -43.1729,
      contractedPassengers: 250,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Via Rápida Transportes',
      cnpj: '11.222.333/0001-44',
      contact: 'contato@viarapida.com.br',
      status: 'Ativo',
      addressText: 'Av. Brasil, 2000 - Belo Horizonte, MG',
      addressLat: -19.9167,
      addressLng: -43.9345,
      contractedPassengers: 100,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ],

  drivers: [
    {
      name: 'Carlos Oliveira',
      cpf: '123.456.789-01',
      rg: '12.345.678-9',
      birthDate: new Date('1985-03-15'),
      phone: '(11) 99999-1111',
      email: 'carlos@golffox.com.br',
      address: 'Rua A, 123 - São Paulo, SP',
      cep: '01234-567',
      cnh: '12345678901',
      cnhValidity: new Date('2025-12-31'),
      cnhCategory: 'D',
      hasEar: true,
      transportCourseValidity: new Date('2025-06-30'),
      lastToxicologicalExam: new Date('2024-01-15'),
      contractType: 'CLT',
      credentialingDate: new Date('2023-01-15'),
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Roberto Costa',
      cpf: '987.654.321-02',
      rg: '98.765.432-1',
      birthDate: new Date('1980-07-22'),
      phone: '(11) 99999-2222',
      email: 'roberto@golffox.com.br',
      address: 'Rua B, 456 - São Paulo, SP',
      cep: '01234-890',
      cnh: '98765432102',
      cnhValidity: new Date('2026-06-30'),
      cnhCategory: 'D',
      hasEar: true,
      transportCourseValidity: new Date('2025-12-15'),
      lastToxicologicalExam: new Date('2024-02-10'),
      contractType: 'CLT',
      credentialingDate: new Date('2023-03-20'),
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Pedro Almeida',
      cpf: '456.789.123-03',
      rg: '45.678.912-3',
      birthDate: new Date('1978-11-08'),
      phone: '(21) 99999-3333',
      email: 'pedro@transporteseguro.com.br',
      address: 'Av. Central, 789 - Rio de Janeiro, RJ',
      cep: '20000-123',
      cnh: '45678912303',
      cnhValidity: new Date('2025-09-15'),
      cnhCategory: 'D',
      hasEar: false,
      transportCourseValidity: new Date('2025-03-30'),
      lastToxicologicalExam: new Date('2023-12-05'),
      contractType: 'terceirizado',
      credentialingDate: new Date('2022-11-10'),
      status: 'Ativo',
      linkedCompany: 'Transporte Seguro S.A.',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Ana Paula Santos',
      cpf: '789.123.456-04',
      rg: '78.912.345-6',
      birthDate: new Date('1990-05-12'),
      phone: '(11) 99999-4444',
      email: 'ana@golffox.com.br',
      address: 'Rua C, 321 - São Paulo, SP',
      cep: '01234-111',
      cnh: '78912345604',
      cnhValidity: new Date('2026-03-20'),
      cnhCategory: 'D',
      hasEar: true,
      transportCourseValidity: new Date('2025-09-10'),
      lastToxicologicalExam: new Date('2024-03-01'),
      contractType: 'CLT',
      credentialingDate: new Date('2023-05-08'),
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ],

  vehicles: [
    {
      plate: 'ABC-1234',
      model: 'Mercedes-Benz Sprinter',
      brand: 'Mercedes-Benz',
      year: 2020,
      capacity: 20,
      type: 'van',
      fuelType: 'diesel',
      status: 'Disponível',
      color: 'Branco',
      chassisNumber: 'WDB9066331R123456',
      renavam: '12345678901',
      positionLat: -23.5505,
      positionLng: -46.6333,
      lastMaintenance: new Date('2024-01-15'),
      nextMaintenance: new Date('2024-07-15'),
      currentKm: 45000,
      isRegistered: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      plate: 'DEF-5678',
      model: 'Iveco Daily',
      brand: 'Iveco',
      year: 2019,
      capacity: 16,
      type: 'van',
      fuelType: 'diesel',
      status: 'Disponível',
      color: 'Azul',
      chassisNumber: 'ZCF35A0001234567',
      renavam: '98765432109',
      positionLat: -23.5618,
      positionLng: -46.6565,
      lastMaintenance: new Date('2024-02-10'),
      nextMaintenance: new Date('2024-08-10'),
      currentKm: 38000,
      isRegistered: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      plate: 'GHI-9012',
      model: 'Volkswagen Crafter',
      brand: 'Volkswagen',
      year: 2021,
      capacity: 18,
      type: 'van',
      fuelType: 'diesel',
      status: 'Disponível',
      color: 'Prata',
      chassisNumber: 'WV1ZZZ2KZLX123456',
      renavam: '11223344556',
      positionLat: -22.9711,
      positionLng: -43.1822,
      lastMaintenance: new Date('2024-01-20'),
      nextMaintenance: new Date('2024-07-20'),
      currentKm: 25000,
      isRegistered: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ],

  passengers: [
    {
      name: 'João da Silva',
      cpf: '111.222.333-44',
      email: 'joao@email.com',
      phone: '(11) 99999-5555',
      address: 'Rua das Flores, 100 - São Paulo, SP',
      positionLat: -23.5505,
      positionLng: -46.6333,
      pickupTime: '07:30:00',
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Maria Oliveira',
      cpf: '222.333.444-55',
      email: 'maria@email.com',
      phone: '(11) 99999-6666',
      address: 'Av. Paulista, 200 - São Paulo, SP',
      positionLat: -23.5618,
      positionLng: -46.6565,
      pickupTime: '07:45:00',
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Pedro Santos',
      cpf: '333.444.555-66',
      email: 'pedro@email.com',
      phone: '(11) 99999-7777',
      address: 'Rua Augusta, 300 - São Paulo, SP',
      positionLat: -23.5489,
      positionLng: -46.6388,
      pickupTime: '08:00:00',
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Ana Costa',
      cpf: '444.555.666-77',
      email: 'ana@email.com',
      phone: '(21) 99999-8888',
      address: 'Copacabana, 400 - Rio de Janeiro, RJ',
      positionLat: -22.9711,
      positionLng: -43.1822,
      pickupTime: '08:15:00',
      status: 'Ativo',
      linkedCompany: 'Transporte Seguro S.A.',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Carlos Ferreira',
      cpf: '555.666.777-88',
      email: 'carlos@email.com',
      phone: '(11) 99999-9999',
      address: 'Vila Madalena, 500 - São Paulo, SP',
      positionLat: -23.5440,
      positionLng: -46.6890,
      pickupTime: '07:15:00',
      status: 'Ativo',
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ],

  routes: [
    {
      name: 'Rota Centro - Zona Sul',
      status: 'No Horário',
      scheduledStart: '07:30:00',
      startLocation: 'Centro - São Paulo, SP',
      destination: 'Vila Olímpia - São Paulo, SP',
      origin: 'Centro - São Paulo, SP',
      punctuality: 0,
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Rota Aeroporto - Hotéis',
      status: 'No Horário',
      scheduledStart: '06:00:00',
      startLocation: 'Aeroporto de Congonhas - São Paulo, SP',
      destination: 'Região Hoteleira - São Paulo, SP',
      origin: 'Aeroporto de Congonhas - São Paulo, SP',
      punctuality: 5,
      linkedCompany: 'GolfFox Transportes Ltda',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      name: 'Rota Copacabana - Centro',
      status: 'No Horário',
      scheduledStart: '08:00:00',
      startLocation: 'Copacabana - Rio de Janeiro, RJ',
      destination: 'Centro - Rio de Janeiro, RJ',
      origin: 'Copacabana - Rio de Janeiro, RJ',
      punctuality: -10,
      linkedCompany: 'Transporte Seguro S.A.',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ],

  alerts: [
    {
      type: 'Atenção',
      title: 'Manutenção Preventiva Veículo ABC-1234',
      message: 'Veículo ABC-1234 precisa de manutenção preventiva em 15 dias',
      isRead: false,
      priority: 'medium',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      type: 'Crítico',
      title: 'CNH Vencendo - Carlos Oliveira',
      message: 'CNH do motorista Carlos Oliveira vence em 30 dias',
      isRead: false,
      priority: 'high',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      type: 'Informativo',
      title: 'Atraso na Rota Copacabana-Centro',
      message: 'Rota apresentou atraso de 20 minutos devido ao trânsito',
      isRead: true,
      priority: 'low',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    {
      type: 'Crítico',
      title: 'Velocidade Excessiva Detectada',
      message: 'Veículo DEF-5678 excedeu limite de velocidade na Marginal Tietê',
      isRead: false,
      priority: 'high',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    }
  ]
};

// Função para buscar IDs das empresas
async function getCompanyIds() {
  try {
    const companiesSnapshot = await db.collection('companies').get();
    const companyMap = {};
    
    companiesSnapshot.forEach(doc => {
      const company = doc.data();
      companyMap[company.name] = doc.id;
    });

    return companyMap;
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    return null;
  }
}

// Função para processar dados baseado na estrutura de cada coleção
function processDataWithCompanyIds(data, companyMap, collectionName) {
  return data.map(item => {
    const processedItem = { ...item };
    
    if (item.linkedCompany) {
      // Para drivers: manter linkedCompany como string
      if (collectionName === 'drivers') {
        // linkedCompany já está correto, não precisa alterar
      }
      // Para outras coleções: converter para companyId
      else if (companyMap[item.linkedCompany]) {
        processedItem.companyId = companyMap[item.linkedCompany];
        delete processedItem.linkedCompany;
      }
    }
    
    return processedItem;
  });
}

async function insertData(collectionName, data) {
  console.log(`📝 Inserindo dados na coleção ${collectionName}...`);
  
  try {
    const batch = db.batch();
    
    data.forEach(item => {
      const docRef = db.collection(collectionName).doc();
      batch.set(docRef, item);
    });
    
    await batch.commit();
    console.log(`✅ ${data.length} documentos inseridos na coleção ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao inserir dados na coleção ${collectionName}:`, error.message);
    return false;
  }
}

// Função para limpar dados existentes
async function clearCollection(collectionName) {
  console.log(`🗑️ Limpando coleção ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Coleção ${collectionName} limpa (${snapshot.size} documentos removidos)`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao limpar coleção ${collectionName}:`, error.message);
    return false;
  }
}

// Função principal
async function populateDatabase() {
  console.log('🚀 Iniciando população do banco de dados Firebase...\n');

  try {
    // Limpar dados existentes (em ordem reversa devido às dependências)
    const collectionsTolear = ['alerts', 'routes', 'passengers', 'vehicles', 'drivers', 'companies'];
    
    for (const collection of collectionsTolear) {
      await clearCollection(collection);
    }

    console.log('\n📊 Inserindo novos dados...\n');

    // Primeiro, inserir empresas
    const companiesSuccess = await insertData('companies', sampleData.companies);
    if (!companiesSuccess) {
      console.error('❌ Falha ao inserir empresas. Interrompendo processo.');
      return;
    }

    // Aguardar um pouco para garantir que os dados foram persistidos
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Buscar IDs das empresas inseridas
    console.log('🔍 Buscando IDs das empresas...');
    const companyMap = await getCompanyIds();
    if (!companyMap) {
      console.error('❌ Falha ao buscar IDs das empresas. Interrompendo processo.');
      return;
    }

    console.log('✅ Mapeamento de empresas:', companyMap);

    // Processar e inserir dados com companyId correto
    const insertOrder = [
      { collection: 'drivers', data: sampleData.drivers },
      { collection: 'vehicles', data: sampleData.vehicles },
      { collection: 'passengers', data: sampleData.passengers },
      { collection: 'routes', data: sampleData.routes },
      { collection: 'alerts', data: sampleData.alerts }
    ];

    for (const { collection, data } of insertOrder) {
      const processedData = processDataWithCompanyIds(data, companyMap, collection);
      const success = await insertData(collection, processedData);
      if (!success) {
        console.error(`❌ Falha ao inserir dados na coleção ${collection}. Interrompendo processo.`);
        return;
      }
    }

    console.log('\n🎉 População do banco de dados Firebase concluída com sucesso!');
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
populateDatabase().then(() => {
  console.log('\n✅ Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
