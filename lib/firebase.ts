import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions'

// Configuração Firebase com fallback para produção
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyABa2KHvh8r805Z0fqSwEWO_CsNC_YmIrg',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'golffox-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'golffox-app',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'golffox-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1091040438113',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1091040438113:web:128fa17a81e547fb890720',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-1ZH2SZNKR1',
}

// Validação básica - verificar se pelo menos o projectId está definido
if (!firebaseConfig.projectId) {
  throw new Error('Firebase projectId é obrigatório')
}

// Inicializar Firebase App (evita múltiplas inicializações)
let app: FirebaseApp
if (!getApps().length) {
  app = initializeApp(firebaseConfig)
} else {
  app = getApps()[0]
}

// Exportar app para uso em outros módulos
export { app }

// Inicializar serviços Firebase
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app, 'golffox-main')
export const storage: FirebaseStorage = getStorage(app)
export const functions: Functions = getFunctions(app)

// Configurar emuladores em desenvolvimento
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true'
  
  if (useEmulators) {
    try {
      // Auth Emulator
      if (!(auth as any)._config?.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      }
      
      // Firestore Emulator
      if (!(db as any)._delegate?._databaseId?.projectId?.includes('demo-')) {
        connectFirestoreEmulator(db, 'localhost', 8080)
      }
      
      // Storage Emulator
      if (!(storage as any)._delegate?._host?.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199)
      }
      
      // Functions Emulator
      if (!(functions as any)._delegate?._url?.includes('localhost')) {
        connectFunctionsEmulator(functions, 'localhost', 5001)
      }
      
      console.log('🔧 Firebase Emulators conectados')
    } catch (error) {
      console.warn('⚠️ Erro ao conectar emuladores Firebase:', error)
    }
  }
}

// Função para verificar se estamos no servidor
export const isServer = typeof window === 'undefined'

// Função para obter o contexto do usuário atual
export const getCurrentUserContext = async () => {
  if (isServer) return null
  
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// Configurações de segurança
export const securityConfig = {
  // Timeout para operações
  timeout: 30000,
  
  // Headers de segurança
  headers: {
    'X-Client-Info': 'golffox-management-panel',
    'X-Client-Version': '2.0.0',
  },
  
  // Configurações de retry
  retry: {
    maxAttempts: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
  }
}

export default app