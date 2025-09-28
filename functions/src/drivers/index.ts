import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { DriverStatus, CnhCategory, ContractType } from '../types'

interface CreateDriverData {
  userId: string
  companyId: string
  licenseNumber: string
  licenseCategory: CnhCategory
  licenseExpiresAt: Date
  contractType: ContractType
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

interface UpdateDriverStatusData {
  driverId: string
  companyId: string
  status: DriverStatus
  vehicleId?: string
}

interface GetDriverPerformanceData {
  driverId: string
  companyId: string
  startDate?: Date
  endDate?: Date
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

export const driverFunctions = {
  // Criar motorista
  createDriver: async (data: CreateDriverData, context: CallableContext) => {
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
      if (!data.userId || !data.companyId || !data.licenseNumber || !data.licenseCategory || !data.licenseExpiresAt || !data.contractType) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Verificar se usuário existe e é da empresa
      const userDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .get()

      if (!userDoc.exists) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar se já existe motorista para este usuário
      const existingDriverSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .where('user_id', '==', data.userId)
        .get()

      if (!existingDriverSnapshot.empty) {
        throw new Error('Usuário já é motorista')
      }

      // Verificar se CNH já está cadastrada
      const existingLicenseSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .where('license_number', '==', data.licenseNumber)
        .get()

      if (!existingLicenseSnapshot.empty) {
        throw new Error('Número da CNH já cadastrado')
      }

      // Criar motorista
      const driverId = admin.firestore().collection('temp').doc().id
      const driverData = {
        id: driverId,
        user_id: data.userId,
        company_id: data.companyId,
        license_number: data.licenseNumber,
        license_category: data.licenseCategory,
        license_expires_at: admin.firestore.Timestamp.fromDate(data.licenseExpiresAt),
        contract_type: data.contractType,
        status: 'available' as DriverStatus,
        performance_score: 100,
        total_routes: 0,
        total_distance: 0,
        rating: 5.0,
        emergency_contact: data.emergencyContact,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(driverId)
        .set(driverData)

      // Atualizar role do usuário para driver
      await admin.firestore()
        .collection(`companies/${data.companyId}/users`)
        .doc(data.userId)
        .update({
          role: 'driver',
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        })

      // Atualizar claims customizados
      await admin.auth().setCustomUserClaims(data.userId, {
        role: 'driver',
        companyId: data.companyId,
      })

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'driver_created',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'driver',
            id: driverId,
          },
          details: {
            user_id: data.userId,
            license_number: data.licenseNumber,
            license_category: data.licenseCategory,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        driverId,
        message: 'Motorista criado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar motorista:', error)
      throw new Error(`Erro ao criar motorista: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar status do motorista
  updateDriverStatus: async (data: UpdateDriverStatusData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é o próprio motorista ou tem permissão administrativa
      const driverDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(data.driverId)
        .get()

      if (!driverDoc.exists) {
        throw new Error('Motorista não encontrado')
      }

      const driverData = driverDoc.data()
      const isOwnDriver = driverData?.user_id === context.auth.uid
      const hasAdminPermission = await verifyPermission(context, data.companyId)

      if (!isOwnDriver && !hasAdminPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Preparar dados para atualização
      const updateData: any = {
        status: data.status,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Se está ficando disponível, remover veículo
      if (data.status === 'available') {
        updateData.vehicle_id = admin.firestore.FieldValue.delete()
      }

      // Se está ficando ocupado e tem veículo, associar
      if (data.status === 'busy' && data.vehicleId) {
        // Verificar se veículo existe e está disponível
        const vehicleDoc = await admin.firestore()
          .collection(`companies/${data.companyId}/vehicles`)
          .doc(data.vehicleId)
          .get()

        if (!vehicleDoc.exists) {
          throw new Error('Veículo não encontrado')
        }

        const vehicleData = vehicleDoc.data()
        if (vehicleData?.status !== 'active') {
          throw new Error('Veículo não está disponível')
        }

        updateData.vehicle_id = data.vehicleId

        // Atualizar veículo com o motorista
        await admin.firestore()
          .collection(`companies/${data.companyId}/vehicles`)
          .doc(data.vehicleId)
          .update({
            driver_id: data.driverId,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
      }

      // Atualizar motorista
      await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(data.driverId)
        .update(updateData)

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'driver_status_updated',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'driver',
            id: data.driverId,
          },
          details: {
            old_status: driverData?.status,
            new_status: data.status,
            vehicle_id: data.vehicleId,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        message: 'Status do motorista atualizado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar status do motorista:', error)
      throw new Error(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar performance do motorista
  getDriverPerformance: async (data: GetDriverPerformanceData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é o próprio motorista ou tem permissão administrativa
      const driverDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(data.driverId)
        .get()

      if (!driverDoc.exists) {
        throw new Error('Motorista não encontrado')
      }

      const driverData = driverDoc.data()
      const isOwnDriver = driverData?.user_id === context.auth.uid
      const hasAdminPermission = await verifyPermission(context, data.companyId)

      if (!isOwnDriver && !hasAdminPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Definir período
      const endDate = data.endDate || new Date()
      const startDate = data.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 dias atrás

      // Buscar rotas do motorista no período
      const routesSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .where('driver_id', '==', data.driverId)
        .where('start_time', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .get()

      // Calcular métricas
      let totalRoutes = 0
      let completedRoutes = 0
      let cancelledRoutes = 0
      let totalDistance = 0
      let totalDuration = 0
      let onTimeCount = 0
      let ratingSum = 0
      let ratingCount = 0

      for (const routeDoc of routesSnapshot.docs) {
        const route = routeDoc.data()
        totalRoutes++

        if (route.status === 'completed') {
          completedRoutes++
          
          if (route.total_distance) {
            totalDistance += route.total_distance
          }
          
          if (route.actual_duration) {
            totalDuration += route.actual_duration
          }

          // Verificar se foi pontual (dentro de 15 minutos do estimado)
          if (route.estimated_duration && route.actual_duration) {
            const delay = route.actual_duration - route.estimated_duration
            if (delay <= 15 * 60) { // 15 minutos em segundos
              onTimeCount++
            }
          }
        } else if (route.status === 'cancelled') {
          cancelledRoutes++
        }
      }

      // Buscar performance histórica
      const performanceSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/driver_performance`)
        .where('driver_id', '==', data.driverId)
        .where('period.start_date', '>=', admin.firestore.Timestamp.fromDate(startDate))
        .where('period.end_date', '<=', admin.firestore.Timestamp.fromDate(endDate))
        .orderBy('period.start_date', 'desc')
        .get()

      const performanceHistory = performanceSnapshot.docs.map(doc => {
        const perf = doc.data()
        return {
          id: doc.id,
          ...perf,
          period: {
            start_date: perf.period.start_date.toDate().toISOString(),
            end_date: perf.period.end_date.toDate().toISOString(),
          },
        }
      })

      // Calcular métricas atuais
      const metrics = {
        total_routes: totalRoutes,
        completed_routes: completedRoutes,
        cancelled_routes: cancelledRoutes,
        total_distance: totalDistance,
        total_duration: totalDuration,
        average_rating: ratingCount > 0 ? ratingSum / ratingCount : driverData?.rating || 5.0,
        on_time_percentage: completedRoutes > 0 ? (onTimeCount / completedRoutes) * 100 : 100,
        completion_rate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 100,
      }

      return {
        success: true,
        driver: {
          id: data.driverId,
          name: driverData?.name,
          license_number: driverData?.license_number,
          performance_score: driverData?.performance_score,
          total_routes: driverData?.total_routes,
          total_distance: driverData?.total_distance,
          rating: driverData?.rating,
        },
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        },
        metrics,
        performance_history: performanceHistory,
      }
    } catch (error) {
      console.error('Erro ao buscar performance do motorista:', error)
      throw new Error(`Erro ao buscar performance: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}