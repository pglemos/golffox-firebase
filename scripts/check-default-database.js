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

async function checkDefaultDatabase() {
  console.log('🔍 Verificando dados no banco DEFAULT...\n');
  
  const collections = ['users', 'companies', 'drivers', 'vehicles', 'passengers', 'routes', 'alerts'];
  let totalDocuments = 0;
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const count = snapshot.size;
      totalDocuments += count;
      
      if (count > 0) {
        console.log(`📊 ${collectionName}: ${count} documentos`);
      } else {
        console.log(`✅ ${collectionName}: vazio`);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar ${collectionName}:`, error.message);
    }
  }
  
  console.log(`\n📈 Total de documentos no banco DEFAULT: ${totalDocuments}`);
  
  if (totalDocuments > 0) {
    console.log('\n⚠️  ATENÇÃO: Há dados no banco DEFAULT que podem precisar ser limpos.');
    console.log('💡 Execute o script clean-default-database.js se necessário.');
  } else {
    console.log('\n✅ Banco DEFAULT está vazio - nenhuma limpeza necessária.');
  }
}

checkDefaultDatabase()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro durante a verificação:', error);
    process.exit(1);
  });