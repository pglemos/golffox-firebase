import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

// Configuração do Firebase Admin
const adminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
}

// Validação das variáveis obrigatórias para Admin
const requiredAdminEnvVars = [
  'FIREBASE_ADMIN_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY'
]

for (const envVar of requiredAdminEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ ${envVar} não configurado - algumas funcionalidades admin podem não funcionar`)
  }
}

// Inicializar Firebase Admin (evita múltiplas inicializações)
let adminApp: App | null = null

try {
  // Só inicializa se todas as variáveis necessárias estão presentes
  if (adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: adminConfig.projectId,
          clientEmail: adminConfig.clientEmail,
          privateKey: adminConfig.privateKey,
        }),
        projectId: adminConfig.projectId,
        storageBucket: adminConfig.storageBucket,
      }, 'admin')
    } else {
      adminApp = getApps().find(app => app.name === 'admin') || getApps()[0]
    }
  } else {
    console.warn('⚠️ Firebase Admin não inicializado - variáveis de ambiente ausentes')
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase Admin:', error)
  // Não lança erro durante build
  adminApp = null
}

// Inicializar serviços Admin
export const adminAuth: Auth | null = adminApp ? getAuth(adminApp) : null
export const adminDb: Firestore | null = adminApp ? getFirestore(adminApp) : null
export const adminStorage: Storage | null = adminApp ? getStorage(adminApp) : null

// Função para verificar se o Admin está configurado corretamente
export const isAdminConfigured = (): boolean => {
  return !!(adminConfig.projectId && adminConfig.clientEmail && adminConfig.privateKey)
}

// Função para criar token customizado
export const createCustomToken = async (uid: string, claims?: object): Promise<string> => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    return await adminAuth.createCustomToken(uid, claims)
  } catch (error) {
    console.error('❌ Erro ao criar token customizado:', error)
    throw new Error('Falha ao criar token de autenticação')
  }
}

// Função para verificar token
export const verifyIdToken = async (idToken: string) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    return await adminAuth.verifyIdToken(idToken)
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error)
    throw new Error('Token inválido')
  }
}

// Função para obter usuário por ID
export const getUserById = async (uid: string) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    return await adminAuth.getUser(uid)
  } catch (error) {
    console.error('❌ Erro ao obter usuário:', error)
    throw new Error('Usuário não encontrado')
  }
}

// Função para criar usuário
export const createUser = async (userData: {
  email: string
  password: string
  displayName?: string
  disabled?: boolean
}) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    return await adminAuth.createUser(userData)
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error)
    throw new Error('Falha ao criar usuário')
  }
}

// Função para atualizar usuário
export const updateUser = async (uid: string, userData: {
  email?: string
  displayName?: string
  disabled?: boolean
}) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    return await adminAuth.updateUser(uid, userData)
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error)
    throw new Error('Falha ao atualizar usuário')
  }
}

// Função para deletar usuário
export const deleteUser = async (uid: string) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    await adminAuth.deleteUser(uid)
    return true
  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error)
    throw new Error('Falha ao deletar usuário')
  }
}

// Função para definir claims customizados
export const setCustomUserClaims = async (uid: string, claims: object) => {
  if (!isAdminConfigured()) {
    throw new Error('Firebase Admin não está configurado corretamente')
  }
  
  try {
    await adminAuth.setCustomUserClaims(uid, claims)
    return true
  } catch (error) {
    console.error('❌ Erro ao definir claims:', error)
    throw new Error('Falha ao definir permissões do usuário')
  }
}

// Configurações de segurança para Admin
export const adminSecurityConfig = {
  // Timeout para operações admin
  timeout: 60000,
  
  // Configurações de batch
  batchSize: 500,
  
  // Rate limiting
  rateLimit: {
    maxRequests: 1000,
    windowMs: 60000, // 1 minuto
  }
}

export default adminApp