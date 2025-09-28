import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import cors from 'cors'
import express, { Request, Response, NextFunction } from 'express'

// Inicializar Firebase Admin
admin.initializeApp()

// Configurar CORS
const corsHandler = cors({ origin: true })

// Importar módulos de funções
import { authFunctions } from './auth'
import { userFunctions } from './users'
import { companyFunctions } from './companies'
import { driverFunctions } from './drivers'
import { vehicleFunctions } from './vehicles'
import { routeFunctions } from './routes'
import { alertFunctions } from './alerts'
import { notificationFunctions } from './notifications'
import { checkinFunctions } from './checkin'

// Configuração regional
const region = 'us-central1'

// Funções de autenticação
export const createUser = functions.https.onCall(authFunctions.createUser)
export const updateUserRole = functions.https.onCall(authFunctions.updateUserRole)
export const deleteUser = functions.https.onCall(authFunctions.deleteUser)

// Funções de usuários
export const getUserProfile = functions.https.onCall(userFunctions.getUserProfile)
export const updateUserProfile = functions.https.onCall(userFunctions.updateUserProfile)

// Funções de empresas
export const createCompany = functions.https.onCall(companyFunctions.createCompany)
export const updateCompany = functions.https.onCall(companyFunctions.updateCompany)
export const getCompanyUsers = functions.https.onCall(companyFunctions.getCompanyUsers)

// Funções de motoristas
export const createDriver = functions.https.onCall(driverFunctions.createDriver)
export const updateDriverStatus = functions.https.onCall(driverFunctions.updateDriverStatus)
export const getDriverPerformance = functions.https.onCall(driverFunctions.getDriverPerformance)

// Funções de veículos
export const createVehicle = functions.https.onCall(vehicleFunctions.createVehicle)
export const updateVehicleLocation = functions.https.onCall(vehicleFunctions.updateVehicleLocation)
export const getVehicleHistory = functions.https.onCall(vehicleFunctions.getVehicleHistory)

// Funções de rotas
export const createRoute = functions.https.onCall(routeFunctions.createRoute)
export const updateRouteStatus = functions.https.onCall(routeFunctions.updateRouteStatus)
export const getRoutePassengers = functions.https.onCall(routeFunctions.getRoutePassengers)

// Funções de alertas
export const createAlert = functions.https.onCall(alertFunctions.createAlert)
export const updateAlertStatus = functions.https.onCall(alertFunctions.updateAlertStatus)
export const getAlerts = functions.https.onCall(alertFunctions.getAlerts)

// Funções de notificações
export const sendNotification = functions.https.onCall(notificationFunctions.sendNotification)
export const updateFCMToken = functions.https.onCall(notificationFunctions.updateFCMToken)
export const markNotificationsRead = functions.https.onCall(notificationFunctions.markNotificationsRead)
export const getNotifications = functions.https.onCall(notificationFunctions.getNotifications)
export const cleanupOldNotifications = functions.https.onCall(notificationFunctions.cleanupOldNotifications)

// Funções de check-in
export const processCheckin = functions.https.onCall(checkinFunctions.processCheckin)
export const validateCheckin = functions.https.onCall(checkinFunctions.validateCheckin)
export const getCheckinHistory = functions.https.onCall(checkinFunctions.getCheckinHistory)

// ===== TRIGGERS AUTOMÁTICOS =====

// Trigger quando usuário é criado
export const onUserCreated = functions
  .region(region)
  .auth
  .user()
  .onCreate(async (user) => {
    console.log('Usuário criado:', user.uid)
    
    // Criar documento do usuário no Firestore
    const userDoc = {
      email: user.email,
      name: user.displayName || '',
      role: 'driver', // role padrão
      is_active: true,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .set(userDoc)
  })

// Trigger quando usuário é deletado
export const onUserDeleted = functions
  .region(region)
  .auth
  .user()
  .onDelete(async (user) => {
    console.log('Usuário deletado:', user.uid)
    
    // Deletar documento do usuário no Firestore
    await admin.firestore()
      .collection('users')
      .doc(user.uid)
      .delete()
  })

// Trigger para alertas críticos
export const onCriticalAlert = functions
  .region(region)
  .firestore
  .document('companies/{companyId}/alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data()
    
    if (alert.severity === 'critical') {
      // Enviar notificação imediata
      const { companyId } = context.params
      
      // Buscar usuários da empresa para notificar
      const usersSnapshot = await admin.firestore()
        .collection(`companies/${companyId}/users`)
        .where('role', 'in', ['admin', 'manager'])
        .where('is_active', '==', true)
        .get()
      
      const notifications = usersSnapshot.docs.map(doc => ({
        topic: `company_${companyId}_alerts`,
        notification: {
          title: '🚨 Alerta Crítico',
          body: alert.message,
        },
        data: {
          type: 'critical_alert',
          alertId: snap.id,
          companyId,
          severity: alert.severity,
        },
      }))
      
      // Enviar notificações
      for (const notification of notifications) {
        try {
          await admin.messaging().send(notification)
        } catch (error) {
          console.error('Erro ao enviar notificação:', error)
        }
      }
    }
  })

// Trigger para atualização de localização de veículo
export const onVehicleLocationUpdate = functions
  .region(region)
  .firestore
  .document('companies/{companyId}/vehicles/{vehicleId}/locations/{locationId}')
  .onCreate(async (snap, context) => {
    const location = snap.data()
    const { companyId, vehicleId } = context.params
    
    // Atualizar última localização conhecida do veículo
    await admin.firestore()
      .collection(`companies/${companyId}/vehicles`)
      .doc(vehicleId)
      .update({
        last_location: {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
        },
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })
  })

// ===== FUNÇÕES HTTP EXPRESS =====

// API REST para integração externa
const app = express()
app.use(corsHandler)

// Middleware de autenticação
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const decodedToken = await admin.auth().verifyIdToken(token)
      ;(req as any).user = decodedToken
    }
    next()
  } catch (error) {
    next()
  }
})

// Rotas da API
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/companies/:companyId/vehicles', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params
    
    // Verificar permissão
    const user = (req as any).user
    if (!user || user.company_id !== companyId) {
      return res.status(403).json({ error: 'Acesso negado' })
    }
    
    const snapshot = await admin.firestore()
      .collection(`companies/${companyId}/vehicles`)
      .get()
    
    const vehicles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return res.json(vehicles)
  } catch (error) {
    console.error('Erro ao buscar veículos:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export const api = functions
  .region(region)
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .https
  .onRequest(app)

// ===== FUNÇÕES AGENDADAS =====

// Limpeza de dados antigos (executa diariamente às 2h)
export const cleanupOldData = functions
  .region(region)
  .pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Iniciando limpeza de dados antigos...')
    
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // Limpar localizações antigas de veículos
    const companiesSnapshot = await admin.firestore()
      .collection('companies')
      .get()
    
    for (const companyDoc of companiesSnapshot.docs) {
      const vehiclesSnapshot = await admin.firestore()
        .collection(`companies/${companyDoc.id}/vehicles`)
        .get()
      
      for (const vehicleDoc of vehiclesSnapshot.docs) {
        const oldLocationsSnapshot = await admin.firestore()
          .collection(`companies/${companyDoc.id}/vehicles/${vehicleDoc.id}/locations`)
          .where('created_at', '<', thirtyDaysAgo)
          .get()
        
        const batch = admin.firestore().batch()
        oldLocationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref)
        })
        
        if (oldLocationsSnapshot.docs.length > 0) {
          await batch.commit()
          console.log(`Removidas ${oldLocationsSnapshot.docs.length} localizações antigas do veículo ${vehicleDoc.id}`)
        }
      }
    }
    
    console.log('Limpeza de dados concluída')
  })

// Relatório diário de performance (executa diariamente às 6h)
export const generateDailyReport = functions
  .region(region)
  .pubsub
  .schedule('0 6 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    console.log('Gerando relatório diário de performance...')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Processar cada empresa
    const companiesSnapshot = await admin.firestore()
      .collection('companies')
      .get()
    
    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id
      
      // Buscar rotas do dia anterior
      const routesSnapshot = await admin.firestore()
        .collection(`companies/${companyId}/routes`)
        .where('start_time', '>=', yesterday)
        .where('start_time', '<', today)
        .get()
      
      // Calcular métricas
      const totalRoutes = routesSnapshot.docs.length
      const completedRoutes = routesSnapshot.docs.filter(doc => 
        doc.data().status === 'completed'
      ).length
      
      // Salvar relatório
      await admin.firestore()
        .collection(`companies/${companyId}/reports`)
        .add({
          type: 'daily_performance',
          date: yesterday,
          metrics: {
            total_routes: totalRoutes,
            completed_routes: completedRoutes,
            completion_rate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
          },
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        })
    }
    
    console.log('Relatório diário gerado para todas as empresas')
  })