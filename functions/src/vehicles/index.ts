import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { VehicleStatus } from '../types'

interface CreateVehicleData {
  companyId: string
  plate: string
  model: string
  brand: string
  year: number
  color: string
  capacity: number
  documents: {
    registrationExpiresAt: Date
    insuranceExpiresAt: Date
  }
}

interface UpdateVehicleLocationData {
  vehicleId: string
  companyId: string
  location: {
    latitude: number
    longitude: number
    speed?: number
    heading?: number
    accuracy?: number
  }
  timestamp?: Date
}

interface GetVehicleHistoryData {
  vehicleId: string
  companyId: string
  startDate?: Date
  endDate?: Date
  limit?: number
}

// Verificar permissão
async function verifyPermission(context: CallableContext, companyId: string): Promise<boolean> {
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
  return ['admin', 'manager', 'super_admin'].includes(userData?.role)
}

export const vehicleFunctions = {
  // Criar veículo
  createVehicle: async (data: CreateVehicleData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados obrigatórios
      if (!data.plate || !data.model || !data.brand || !data.year || !data.color || !data.capacity || !data.documents) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se placa já existe
      const existingVehicleSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .where('plate', '==', data.plate.toUpperCase())
        .get()

      if (!existingVehicleSnapshot.empty) {
        throw new Error('Placa já cadastrada')
      }

      // Verificar limites da empresa
      const companyDoc = await admin.firestore()
        .collection('companies')
        .doc(data.companyId)
        .get()

      if (!companyDoc.exists) {
        throw new Error('Empresa não encontrada')
      }

      const companyData = companyDoc.data()
      const maxVehicles = companyData?.settings?.max_vehicles || 5

      const vehiclesSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .get()

      if (vehiclesSnapshot.size >= maxVehicles) {
        throw new Error(`Limite de ${maxVehicles} veículos atingido`)
      }

      // Criar veículo
      const vehicleId = admin.firestore().collection('temp').doc().id
      const vehicleData = {
        id: vehicleId,
        company_id: data.companyId,
        plate: data.plate.toUpperCase(),
        model: data.model,
        brand: data.brand,
        year: data.year,
        color: data.color,
        capacity: data.capacity,
        status: 'active' as VehicleStatus,
        documents: {
          registration_expires_at: admin.firestore.Timestamp.fromDate(data.documents.registrationExpiresAt),
          insurance_expires_at: admin.firestore.Timestamp.fromDate(data.documents.insuranceExpiresAt),
        },
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .doc(vehicleId)
        .set(vehicleData)

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'vehicle_created',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'vehicle',
            id: vehicleId,
          },
          details: {
            plate: data.plate,
            model: data.model,
            brand: data.brand,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        vehicleId,
        message: 'Veículo criado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar veículo:', error)
      throw new Error(`Erro ao criar veículo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar localização do veículo
  updateVehicleLocation: async (data: UpdateVehicleLocationData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se usuário é motorista do veículo ou tem permissão administrativa
      const vehicleDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .doc(data.vehicleId)
        .get()

      if (!vehicleDoc.exists) {
        throw new Error('Veículo não encontrado')
      }

      const vehicleData = vehicleDoc.data()
      const isVehicleDriver = vehicleData?.driver_id === context.auth.uid

      // Se não é o motorista do veículo, verificar se é motorista de algum veículo da empresa
      let isDriverInCompany = false
      if (!isVehicleDriver) {
        const driverSnapshot = await admin.firestore()
          .collection(`companies/${data.companyId}/drivers`)
          .where('user_id', '==', context.auth.uid)
          .get()

        isDriverInCompany = !driverSnapshot.empty
      }

      const hasAdminPermission = await verifyPermission(context, data.companyId)

      if (!isVehicleDriver && !isDriverInCompany && !hasAdminPermission) {
        throw new Error('Permissão insuficiente')
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

      // Criar registro de localização
      const locationId = admin.firestore().collection('temp').doc().id
      const locationData = {
        id: locationId,
        company_id: data.companyId,
        vehicle_id: data.vehicleId,
        driver_id: context.auth.uid,
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        speed: data.location.speed || 0,
        heading: data.location.heading || 0,
        accuracy: data.location.accuracy || 10,
        timestamp: admin.firestore.Timestamp.fromDate(timestamp),
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles/${data.vehicleId}/locations`)
        .doc(locationId)
        .set(locationData)

      // Atualizar última localização conhecida do veículo
      await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .doc(data.vehicleId)
        .update({
          last_location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            timestamp: admin.firestore.Timestamp.fromDate(timestamp),
          },
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        locationId,
        message: 'Localização atualizada com sucesso',
        timestamp: timestamp.toISOString(),
      }
    } catch (error) {
      console.error('Erro ao atualizar localização do veículo:', error)
      throw new Error(`Erro ao atualizar localização: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar histórico do veículo
  getVehicleHistory: async (data: GetVehicleHistoryData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão
      const hasPermission = await verifyPermission(context, data.companyId)
      if (!hasPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Verificar se veículo existe
      const vehicleDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .doc(data.vehicleId)
        .get()

      if (!vehicleDoc.exists) {
        throw new Error('Veículo não encontrado')
      }

      const vehicleData = vehicleDoc.data()

      // Definir período
      const endDate = data.endDate || new Date()
      const startDate = data.startDate || new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 dias atrás

      // Buscar localizações
      let locationsQuery = admin.firestore()
        .collection(`companies/${data.companyId}/vehicles/${data.vehicleId}/locations`)
        .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .orderBy('timestamp', 'desc')

      if (data.limit) {
        locationsQuery = locationsQuery.limit(data.limit)
      }

      const locationsSnapshot = await locationsQuery.get()

      const locations = locationsSnapshot.docs.map(doc => {
        const location = doc.data()
        return {
          id: doc.id,
          ...location,
          timestamp: location.timestamp.toDate().toISOString(),
          created_at: location.created_at?.toDate()?.toISOString(),
        }
      })

      // Buscar rotas do veículo no período
      const routesSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .where('vehicle_id', '==', data.vehicleId)
        .where('start_time', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .orderBy('start_time', 'desc')
        .get()

      const routes = routesSnapshot.docs.map(doc => {
        const route = doc.data()
        return {
          id: doc.id,
          name: route.name,
          status: route.status,
          start_time: route.start_time.toDate().toISOString(),
          end_time: route.end_time?.toDate()?.toISOString(),
          total_distance: route.total_distance,
          actual_duration: route.actual_duration,
          passenger_count: route.passenger_count,
        }
      })

      // Calcular estatísticas
      const totalDistance = routes.reduce((sum, route) => sum + (route.total_distance || 0), 0)
      const totalDuration = routes.reduce((sum, route) => sum + (route.actual_duration || 0), 0)
      const completedRoutes = routes.filter(route => route.status === 'completed').length

      return {
        success: true,
        vehicle: {
          id: data.vehicleId,
          plate: vehicleData?.plate,
          model: vehicleData?.model,
          brand: vehicleData?.brand,
          status: vehicleData?.status,
          last_location: vehicleData?.last_location ? {
            ...vehicleData.last_location,
            timestamp: vehicleData.last_location.timestamp.toDate().toISOString(),
          } : null,
        },
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        statistics: {
          total_routes: routes.length,
          completed_routes: completedRoutes,
          total_distance: totalDistance,
          total_duration: totalDuration,
          average_distance_per_route: routes.length > 0 ? totalDistance / routes.length : 0,
        },
        locations,
        routes,
      }
    } catch (error) {
      console.error('Erro ao buscar histórico do veículo:', error)
      throw new Error(`Erro ao buscar histórico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}