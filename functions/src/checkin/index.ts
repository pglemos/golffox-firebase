import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'

interface CheckinData {
  routeId: string
  passengerId: string
  location: {
    latitude: number
    longitude: number
  }
  timestamp: Date
  type: 'pickup' | 'dropoff'
  companyId: string
}

interface ValidateCheckinData {
  routeId: string
  passengerId: string
  companyId: string
}

interface GetCheckinHistoryData {
  routeId?: string
  passengerId?: string
  companyId: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

// Calcular distância entre dois pontos (em metros)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

// Verificar se checkin é duplicado
async function checkDuplicateCheckin(
  companyId: string,
  routeId: string,
  passengerId: string,
  type: 'pickup' | 'dropoff',
  timestamp: Date
): Promise<boolean> {
  // Verificar checkins nos últimos 5 minutos
  const fiveMinutesAgo = new Date(timestamp.getTime() - 5 * 60 * 1000)
  
  const duplicateSnapshot = await admin.firestore()
    .collection(`companies/${companyId}/checkins`)
    .where('route_id', '==', routeId)
    .where('passenger_id', '==', passengerId)
    .where('type', '==', type)
    .where('timestamp', '>=', fiveMinutesAgo)
    .where('timestamp', '<=', timestamp)
    .get()

  return !duplicateSnapshot.empty
}

// Validar localização do checkin
async function validateCheckinLocation(
  companyId: string,
  routeId: string,
  passengerId: string,
  location: { latitude: number, longitude: number },
  type: 'pickup' | 'dropoff'
): Promise<{ valid: boolean, message?: string }> {
  try {
    // Buscar dados da rota
    const routeDoc = await admin.firestore()
      .collection(`companies/${companyId}/routes`)
      .doc(routeId)
      .get()

    if (!routeDoc.exists) {
      return { valid: false, message: 'Rota não encontrada' }
    }

    // Buscar dados do passageiro na rota
    const passengerSnapshot = await admin.firestore()
      .collection(`companies/${companyId}/routes/${routeId}/passengers`)
      .where('passenger_id', '==', passengerId)
      .get()

    if (passengerSnapshot.empty) {
      return { valid: false, message: 'Passageiro não encontrado na rota' }
    }

    const passengerData = passengerSnapshot.docs[0].data()
    
    // Determinar localização esperada
    let expectedLocation: { latitude: number, longitude: number }
    
    if (type === 'pickup') {
      expectedLocation = passengerData.pickup_location
    } else {
      expectedLocation = passengerData.dropoff_location
    }

    // Calcular distância
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      expectedLocation.latitude,
      expectedLocation.longitude
    )

    // Tolerância de 100 metros
    const tolerance = 100
    
    if (distance > tolerance) {
      return {
        valid: false,
        message: `Localização muito distante do ponto esperado (${Math.round(distance)}m de distância)`
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Erro ao validar localização:', error)
    return { valid: false, message: 'Erro interno na validação' }
  }
}

// Verificar permissão do usuário
async function verifyUserPermission(context: CallableContext, companyId: string): Promise<boolean> {
  if (!context.auth) {
    return false
  }

  const userDoc = await admin.firestore()
    .collection(`companies/${companyId}/users`)
    .doc(context.auth.uid)
    .get()

  if (!userDoc.exists) {
    return false
  }

  const userData = userDoc.data()
  return userData?.role === 'driver' || userData?.role === 'admin' || userData?.role === 'manager'
}

export const checkinFunctions = {
  // Processar checkin com validação e deduplicação
  processCheckin: async (data: CheckinData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyUserPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados obrigatórios
      if (!data.routeId || !data.passengerId || !data.location || !data.type || !data.companyId) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Validar coordenadas
      if (
        typeof data.location.latitude !== 'number' ||
        typeof data.location.longitude !== 'number' ||
        data.location.latitude < -90 || data.location.latitude > 90 ||
        data.location.longitude < -180 || data.location.longitude > 180
      ) {
        throw new Error('Coordenadas inválidas')
      }

      const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()

      // 1. Verificar duplicação
      const isDuplicate = await checkDuplicateCheckin(
        data.companyId,
        data.routeId,
        data.passengerId,
        data.type,
        timestamp
      )

      if (isDuplicate) {
        return {
          success: false,
          message: 'Checkin duplicado detectado',
          code: 'DUPLICATE_CHECKIN'
        }
      }

      // 2. Validar localização
      const locationValidation = await validateCheckinLocation(
        data.companyId,
        data.routeId,
        data.passengerId,
        data.location,
        data.type
      )

      if (!locationValidation.valid) {
        return {
          success: false,
          message: locationValidation.message,
          code: 'INVALID_LOCATION'
        }
      }

      // 3. Verificar se rota está ativa
      const routeDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(data.routeId)
        .get()

      if (!routeDoc.exists) {
        throw new Error('Rota não encontrada')
      }

      const routeData = routeDoc.data()
      if (routeData?.status !== 'in_progress') {
        return {
          success: false,
          message: 'Rota não está em andamento',
          code: 'ROUTE_NOT_ACTIVE'
        }
      }

      // 4. Verificar se passageiro já fez checkin do mesmo tipo
      const existingCheckinSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/checkins`)
        .where('route_id', '==', data.routeId)
        .where('passenger_id', '==', data.passengerId)
        .where('type', '==', data.type)
        .get()

      if (!existingCheckinSnapshot.empty) {
        return {
          success: false,
          message: `Passageiro já fez ${data.type} nesta rota`,
          code: 'ALREADY_CHECKED_IN'
        }
      }

      // 5. Criar checkin
      const checkinId = admin.firestore().collection('temp').doc().id
      const checkinData = {
        id: checkinId,
        route_id: data.routeId,
        passenger_id: data.passengerId,
        driver_id: context.auth.uid,
        type: data.type,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        timestamp: admin.firestore.Timestamp.fromDate(timestamp),
        status: 'confirmed',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/checkins`)
        .doc(checkinId)
        .set(checkinData)

      // 6. Atualizar status do passageiro na rota
      const passengerSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes/${data.routeId}/passengers`)
        .where('passenger_id', '==', data.passengerId)
        .get()

      if (!passengerSnapshot.empty) {
        const passengerDoc = passengerSnapshot.docs[0]
        const updateData: any = {
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }

        if (data.type === 'pickup') {
          updateData.pickup_time = admin.firestore.Timestamp.fromDate(timestamp)
          updateData.status = 'picked_up'
        } else {
          updateData.dropoff_time = admin.firestore.Timestamp.fromDate(timestamp)
          updateData.status = 'dropped_off'
        }

        await passengerDoc.ref.update(updateData)
      }

      // 7. Criar notificação para responsáveis
      const notificationData = {
        title: data.type === 'pickup' ? '🚌 Embarque Confirmado' : '🏠 Desembarque Confirmado',
        message: `${data.type === 'pickup' ? 'Embarque' : 'Desembarque'} realizado com sucesso`,
        type: 'checkin',
        data: {
          checkinId,
          routeId: data.routeId,
          passengerId: data.passengerId,
          checkinType: data.type,
        },
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/notifications`)
        .add(notificationData)

      // 8. Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'checkin_processed',
          performed_by: context.auth.uid,
          details: {
            checkinId,
            routeId: data.routeId,
            passengerId: data.passengerId,
            type: data.type,
            location: data.location,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        checkinId,
        message: `${data.type === 'pickup' ? 'Embarque' : 'Desembarque'} processado com sucesso`,
        timestamp: timestamp.toISOString(),
      }
    } catch (error) {
      console.error('Erro ao processar checkin:', error)
      throw new Error(`Erro ao processar checkin: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Validar checkin antes de processar
  validateCheckin: async (data: ValidateCheckinData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyUserPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados
      if (!data.routeId || !data.passengerId || !data.companyId) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se rota existe e está ativa
      const routeDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(data.routeId)
        .get()

      if (!routeDoc.exists) {
        return {
          valid: false,
          message: 'Rota não encontrada',
          code: 'ROUTE_NOT_FOUND'
        }
      }

      const routeData = routeDoc.data()
      if (routeData?.status !== 'in_progress') {
        return {
          valid: false,
          message: 'Rota não está em andamento',
          code: 'ROUTE_NOT_ACTIVE'
        }
      }

      // Verificar se passageiro está na rota
      const passengerSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes/${data.routeId}/passengers`)
        .where('passenger_id', '==', data.passengerId)
        .get()

      if (passengerSnapshot.empty) {
        return {
          valid: false,
          message: 'Passageiro não encontrado na rota',
          code: 'PASSENGER_NOT_IN_ROUTE'
        }
      }

      const passengerData = passengerSnapshot.docs[0].data()

      // Verificar checkins existentes
      const checkinsSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/checkins`)
        .where('route_id', '==', data.routeId)
        .where('passenger_id', '==', data.passengerId)
        .get()

      const existingCheckins = checkinsSnapshot.docs.map(doc => doc.data())
      const hasPickup = existingCheckins.some(checkin => checkin.type === 'pickup')
      const hasDropoff = existingCheckins.some(checkin => checkin.type === 'dropoff')

      return {
        valid: true,
        passenger: {
          id: data.passengerId,
          name: passengerData.passenger_name,
          status: passengerData.status,
          pickup_location: passengerData.pickup_location,
          dropoff_location: passengerData.dropoff_location,
        },
        checkins: {
          pickup: hasPickup,
          dropoff: hasDropoff,
        },
        next_action: !hasPickup ? 'pickup' : (!hasDropoff ? 'dropoff' : 'completed'),
      }
    } catch (error) {
      console.error('Erro ao validar checkin:', error)
      throw new Error(`Erro ao validar checkin: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar histórico de checkins
  getCheckinHistory: async (data: GetCheckinHistoryData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyUserPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Construir query
      let query: any = admin.firestore()
        .collection(`companies/${data.companyId}/checkins`)

      if (data.routeId) {
        query = query.where('route_id', '==', data.routeId)
      }

      if (data.passengerId) {
        query = query.where('passenger_id', '==', data.passengerId)
      }

      if (data.startDate) {
        query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(data.startDate))
      }

      if (data.endDate) {
        query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(data.endDate))
      }

      query = query.orderBy('timestamp', 'desc')

      if (data.limit) {
        query = query.limit(data.limit)
      }

      const snapshot = await query.get()

      const checkins = await Promise.all(
        snapshot.docs.map(async (doc: any) => {
          const checkinData = doc.data()
          
          // Buscar dados do passageiro
          const passengerDoc = await admin.firestore()
            .collection(`companies/${data.companyId}/passengers`)
            .doc(checkinData.passenger_id)
            .get()

          // Buscar dados da rota
          const routeDoc = await admin.firestore()
            .collection(`companies/${data.companyId}/routes`)
            .doc(checkinData.route_id)
            .get()

          return {
            id: doc.id,
            ...checkinData,
            timestamp: checkinData.timestamp.toDate().toISOString(),
            passenger_name: passengerDoc.exists ? passengerDoc.data()?.name : 'Desconhecido',
            route_name: routeDoc.exists ? routeDoc.data()?.name : 'Rota Desconhecida',
          }
        })
      )

      return {
        success: true,
        checkins,
        total: checkins.length,
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de checkins:', error)
      throw new Error(`Erro ao buscar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}