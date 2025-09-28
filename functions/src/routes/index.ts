import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { RouteStatus, PassengerStatus } from '../types'

interface CreateRouteData {
  companyId: string
  name: string
  vehicleId: string
  driverId: string
  startTime: Date
  endTime: Date
  waypoints: Array<{
    latitude: number
    longitude: number
    address?: string
    order: number
  }>
  passengers: Array<{
    passengerId: string
    waypointIndex: number
    type: 'pickup' | 'dropoff'
  }>
}

interface UpdateRouteStatusData {
  routeId: string
  companyId: string
  status: RouteStatus
  actualStartTime?: Date
  actualEndTime?: Date
  notes?: string
}

interface GetRoutePassengersData {
  routeId: string
  companyId: string
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

// Verificar se é motorista da rota
async function isRouteDriver(context: CallableContext, companyId: string, routeId: string): Promise<boolean> {
  if (!context.auth) {
    return false
  }

  const routeDoc = await admin.firestore()
    .collection(`companies/${companyId}/routes`)
    .doc(routeId)
    .get()

  if (!routeDoc.exists) {
    return false
  }

  const routeData = routeDoc.data()
  return routeData?.driver_id === context.auth.uid
}

// Calcular distância entre dois pontos (fórmula de Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const routeFunctions = {
  // Criar rota
  createRoute: async (data: CreateRouteData, context: CallableContext) => {
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
      if (!data.name || !data.vehicleId || !data.driverId || !data.startTime || !data.endTime || !data.waypoints || !data.passengers) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

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

      // Verificar se motorista existe
      const driverDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(data.driverId)
        .get()

      if (!driverDoc.exists) {
        throw new Error('Motorista não encontrado')
      }

      const driverData = driverDoc.data()
      if (driverData?.status !== 'active') {
        throw new Error('Motorista não está disponível')
      }

      // Verificar conflitos de horário para veículo e motorista
      const startTime = new Date(data.startTime)
      const endTime = new Date(data.endTime)

      const conflictingRoutesSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .where('status', 'in', ['scheduled', 'in_progress'])
        .get()

      for (const doc of conflictingRoutesSnapshot.docs) {
        const route = doc.data()
        const routeStart = route.start_time.toDate()
        const routeEnd = route.end_time.toDate()

        // Verificar conflito de veículo ou motorista
        if (route.vehicle_id === data.vehicleId || route.driver_id === data.driverId) {
          if (
            (startTime >= routeStart && startTime < routeEnd) ||
            (endTime > routeStart && endTime <= routeEnd) ||
            (startTime <= routeStart && endTime >= routeEnd)
          ) {
            throw new Error('Conflito de horário detectado para veículo ou motorista')
          }
        }
      }

      // Calcular distância total da rota
      let totalDistance = 0
      for (let i = 0; i < data.waypoints.length - 1; i++) {
        const current = data.waypoints[i]
        const next = data.waypoints[i + 1]
        totalDistance += calculateDistance(current.latitude, current.longitude, next.latitude, next.longitude)
      }

      // Criar rota
      const routeId = admin.firestore().collection('temp').doc().id
      const routeData = {
        id: routeId,
        company_id: data.companyId,
        name: data.name,
        vehicle_id: data.vehicleId,
        driver_id: data.driverId,
        status: 'scheduled' as RouteStatus,
        start_time: admin.firestore.Timestamp.fromDate(startTime),
        end_time: admin.firestore.Timestamp.fromDate(endTime),
        estimated_duration: Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60)), // em minutos
        total_distance: Math.round(totalDistance * 100) / 100, // arredondar para 2 casas decimais
        waypoints: data.waypoints.map(wp => ({
          latitude: wp.latitude,
          longitude: wp.longitude,
          address: wp.address || '',
          order: wp.order,
        })),
        passenger_count: data.passengers.length,
        created_by: context.auth.uid,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(routeId)
        .set(routeData)

      // Criar registros de passageiros da rota
      const batch = admin.firestore().batch()

      for (const passenger of data.passengers) {
        const passengerRouteId = admin.firestore().collection('temp').doc().id
        const passengerRouteData = {
          id: passengerRouteId,
          company_id: data.companyId,
          route_id: routeId,
          passenger_id: passenger.passengerId,
          waypoint_index: passenger.waypointIndex,
          type: passenger.type,
          status: 'pending' as PassengerStatus,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }

        batch.set(
          admin.firestore()
            .collection(`companies/${data.companyId}/routes/${routeId}/passengers`)
            .doc(passengerRouteId),
          passengerRouteData
        )
      }

      await batch.commit()

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'route_created',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'route',
            id: routeId,
          },
          details: {
            name: data.name,
            vehicle_id: data.vehicleId,
            driver_id: data.driverId,
            passenger_count: data.passengers.length,
            total_distance: totalDistance,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        routeId,
        totalDistance: Math.round(totalDistance * 100) / 100,
        message: 'Rota criada com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar rota:', error)
      throw new Error(`Erro ao criar rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar status da rota
  updateRouteStatus: async (data: UpdateRouteStatusData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é motorista da rota ou tem permissão administrativa
      const isDriver = await isRouteDriver(context, data.companyId, data.routeId)
      const hasAdminPermission = await verifyPermission(context, data.companyId)

      if (!isDriver && !hasAdminPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Verificar se rota existe
      const routeDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(data.routeId)
        .get()

      if (!routeDoc.exists) {
        throw new Error('Rota não encontrada')
      }

      const routeData = routeDoc.data()
      const currentStatus = routeData?.status

      // Validar transições de status
      const validTransitions: Record<string, string[]> = {
        scheduled: ['in_progress', 'cancelled'],
        in_progress: ['completed', 'cancelled'],
        completed: [], // Não pode sair do status completed
        cancelled: ['scheduled'], // Pode reagendar uma rota cancelada
      }

      if (!validTransitions[currentStatus]?.includes(data.status)) {
        throw new Error(`Transição de status inválida: ${currentStatus} -> ${data.status}`)
      }

      // Preparar dados de atualização
      const updateData: any = {
        status: data.status,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      if (data.notes) {
        updateData.notes = data.notes
      }

      // Adicionar timestamps específicos baseados no status
      if (data.status === 'in_progress' && data.actualStartTime) {
        updateData.actual_start_time = admin.firestore.Timestamp.fromDate(new Date(data.actualStartTime))
      }

      if (data.status === 'completed' && data.actualEndTime) {
        updateData.actual_end_time = admin.firestore.Timestamp.fromDate(new Date(data.actualEndTime))
        
        // Calcular duração real
        const startTime = updateData.actual_start_time || routeData?.start_time
        if (startTime) {
          const duration = Math.ceil((new Date(data.actualEndTime).getTime() - startTime.toDate().getTime()) / (1000 * 60))
          updateData.actual_duration = duration
        }
      }

      // Atualizar rota
      await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(data.routeId)
        .update(updateData)

      // Se a rota foi cancelada, atualizar status dos passageiros
      if (data.status === 'cancelled') {
        const passengersSnapshot = await admin.firestore()
          .collection(`companies/${data.companyId}/routes/${data.routeId}/passengers`)
          .get()

        const batch = admin.firestore().batch()
        passengersSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'cancelled',
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          })
        })
        await batch.commit()
      }

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'route_status_updated',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'route',
            id: data.routeId,
          },
          details: {
            previous_status: currentStatus,
            new_status: data.status,
            notes: data.notes,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: data.status,
        message: 'Status da rota atualizado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar status da rota:', error)
      throw new Error(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar passageiros da rota
  getRoutePassengers: async (data: GetRoutePassengersData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é motorista da rota ou tem permissão administrativa
      const isDriver = await isRouteDriver(context, data.companyId, data.routeId)
      const hasAdminPermission = await verifyPermission(context, data.companyId)

      if (!isDriver && !hasAdminPermission) {
        throw new Error('Permissão insuficiente')
      }

      // Verificar se rota existe
      const routeDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/routes`)
        .doc(data.routeId)
        .get()

      if (!routeDoc.exists) {
        throw new Error('Rota não encontrada')
      }

      const routeData = routeDoc.data()

      // Buscar passageiros da rota
      const passengersSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/routes/${data.routeId}/passengers`)
        .orderBy('waypoint_index')
        .get()

      const passengers = []

      for (const doc of passengersSnapshot.docs) {
        const passengerRoute = doc.data()

        // Buscar dados do passageiro
        const passengerDoc = await admin.firestore()
          .collection(`companies/${data.companyId}/passengers`)
          .doc(passengerRoute.passenger_id)
          .get()

        if (passengerDoc.exists) {
          const passengerData = passengerDoc.data()
          
          passengers.push({
            id: doc.id,
            passenger_id: passengerRoute.passenger_id,
            name: passengerData?.name,
            phone: passengerData?.phone,
            waypoint_index: passengerRoute.waypoint_index,
            type: passengerRoute.type,
            status: passengerRoute.status,
            checkin_time: passengerRoute.checkin_time?.toDate()?.toISOString(),
            checkout_time: passengerRoute.checkout_time?.toDate()?.toISOString(),
            notes: passengerRoute.notes,
            created_at: passengerRoute.created_at?.toDate()?.toISOString(),
            updated_at: passengerRoute.updated_at?.toDate()?.toISOString(),
          })
        }
      }

      // Buscar dados do veículo e motorista
      const vehicleDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/vehicles`)
        .doc(routeData?.vehicle_id)
        .get()

      const driverDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/drivers`)
        .doc(routeData?.driver_id)
        .get()

      const vehicleData = vehicleDoc.exists ? vehicleDoc.data() : null
      const driverData = driverDoc.exists ? driverDoc.data() : null

      return {
        success: true,
        route: {
          id: data.routeId,
          name: routeData?.name,
          status: routeData?.status,
          start_time: routeData?.start_time?.toDate()?.toISOString(),
          end_time: routeData?.end_time?.toDate()?.toISOString(),
          actual_start_time: routeData?.actual_start_time?.toDate()?.toISOString(),
          actual_end_time: routeData?.actual_end_time?.toDate()?.toISOString(),
          total_distance: routeData?.total_distance,
          estimated_duration: routeData?.estimated_duration,
          actual_duration: routeData?.actual_duration,
          waypoints: routeData?.waypoints,
          vehicle: vehicleData ? {
            id: routeData?.vehicle_id,
            plate: vehicleData.plate,
            model: vehicleData.model,
            brand: vehicleData.brand,
          } : null,
          driver: driverData ? {
            id: routeData?.driver_id,
            name: driverData.name,
            phone: driverData.phone,
          } : null,
        },
        passengers,
        summary: {
          total_passengers: passengers.length,
          pending: passengers.filter(p => p.status === 'pending').length,
          checked_in: passengers.filter(p => p.status === 'checked_in').length,
          checked_out: passengers.filter(p => p.status === 'checked_out').length,
          absent: passengers.filter(p => p.status === 'absent').length,
        },
      }
    } catch (error) {
      console.error('Erro ao buscar passageiros da rota:', error)
      throw new Error(`Erro ao buscar passageiros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}