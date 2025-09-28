const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
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

// Inicializar Firebase Admin para o banco DEFAULT
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.projectId
});

// Conectar ao banco DEFAULT (sem especificar databaseId)
const db = getFirestore(app);

async function cleanCollection(collectionName) {
  console.log(`🗑️ Limpando coleção ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (snapshot.size > 0) {
      await batch.commit();
      console.log(`✅ ${snapshot.size} documentos removidos da coleção ${collectionName}`);
    } else {
      console.log(`✅ Coleção ${collectionName} já estava vazia`);
    }
    
    return snapshot.size;
  } catch (error) {
    console.error(`❌ Erro ao limpar ${collectionName}:`, error.message);
    return 0;
  }
}

async function cleanDefaultDatabase() {
  console.log('🚀 Iniciando limpeza do banco DEFAULT...\n');
  
  const collections = ['users', 'alerts', 'routes', 'passengers', 'vehicles', 'drivers', 'companies'];
  let totalRemoved = 0;
  
  for (const collectionName of collections) {
    const removed = await cleanCollection(collectionName);
    totalRemoved += removed;
  }
  
  console.log(`\n📈 Total de documentos removidos: ${totalRemoved}`);
  console.log('\n🎉 Limpeza do banco DEFAULT concluída com sucesso!');
  console.log('✅ Agora todos os dados estão apenas no banco golffox-main');
}

cleanDefaultDatabase()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro durante a limpeza:', error);
    process.exit(1);
  });