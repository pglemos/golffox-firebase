import * as admin from 'firebase-admin'
import { CallableContext } from 'firebase-functions/v1/https'
import { AlertType, AlertSeverity, AlertStatus } from '../types'

interface CreateAlertData {
  companyId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  entityType?: 'vehicle' | 'driver' | 'route' | 'passenger'
  entityId?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  metadata?: Record<string, any>
}

interface UpdateAlertStatusData {
  alertId: string
  companyId: string
  status: AlertStatus
  resolution?: string
  resolvedBy?: string
}

interface GetAlertsData {
  companyId: string
  status?: AlertStatus[]
  severity?: AlertSeverity[]
  type?: AlertType[]
  entityType?: string
  entityId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
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

// Enviar notificação para usuários relevantes
async function sendAlertNotification(companyId: string, alertData: any) {
  try {
    // Buscar usuários que devem receber notificações de alerta
    const usersSnapshot = await admin.firestore()
      .collection(`companies/${companyId}/users`)
      .where('role', 'in', ['admin', 'manager'])
      .where('notification_preferences.alerts', '==', true)
      .get()

    const notifications = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      
      // Criar notificação no Firestore
      const notificationData = {
        id: admin.firestore().collection('temp').doc().id,
        company_id: companyId,
        user_id: userDoc.id,
        type: 'alert',
        title: `Novo Alerta: ${alertData.title}`,
        message: alertData.description,
        data: {
          alert_id: alertData.id,
          alert_type: alertData.type,
          alert_severity: alertData.severity,
          entity_type: alertData.entity_type,
          entity_id: alertData.entity_id,
        },
        read: false,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      notifications.push(
        admin.firestore()
          .collection(`companies/${companyId}/notifications`)
          .add(notificationData)
      )

      // Enviar push notification se o usuário tiver FCM token
      if (userData.fcm_token) {
        const message = {
          token: userData.fcm_token,
          notification: {
            title: `Novo Alerta: ${alertData.title}`,
            body: alertData.description,
          },
          data: {
            type: 'alert',
            alert_id: alertData.id,
            alert_severity: alertData.severity,
            company_id: companyId,
          },
          android: {
            priority: (alertData.severity === 'critical' ? 'high' : 'normal') as 'high' | 'normal',
            notification: {
              sound: alertData.severity === 'critical' ? 'alert_critical' : 'default',
              priority: (alertData.severity === 'critical' ? 'high' : 'default') as 'high' | 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: alertData.severity === 'critical' ? 'alert_critical.wav' : 'default',
                badge: 1,
              },
            },
          },
        }

        notifications.push(admin.messaging().send(message))
      }
    }

    await Promise.all(notifications)
  } catch (error) {
    console.error('Erro ao enviar notificações de alerta:', error)
  }
}

export const alertFunctions = {
  // Criar alerta
  createAlert: async (data: CreateAlertData, context: CallableContext) => {
    try {
      // Verificar autenticação
      if (!context.auth) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar permissão (motoristas também podem criar alguns tipos de alerta)
      const hasAdminPermission = await verifyPermission(context, data.companyId)
      
      // Verificar se é motorista da empresa
      let isDriverInCompany = false
      if (!hasAdminPermission) {
        const driverSnapshot = await admin.firestore()
          .collection(`companies/${data.companyId}/drivers`)
          .where('user_id', '==', context.auth.uid)
          .get()

        isDriverInCompany = !driverSnapshot.empty
      }

      // Motoristas só podem criar alertas específicos
      if (!hasAdminPermission && isDriverInCompany) {
        const allowedTypesForDrivers = ['vehicle_breakdown', 'emergency', 'passenger_issue', 'route_delay']
        if (!allowedTypesForDrivers.includes(data.type)) {
          throw new Error('Tipo de alerta não permitido para motoristas')
        }
      } else if (!hasAdminPermission && !isDriverInCompany) {
        throw new Error('Permissão insuficiente')
      }

      // Validar dados obrigatórios
      if (!data.type || !data.severity || !data.title || !data.description) {
        throw new Error('Dados obrigatórios não fornecidos')
      }

      // Validar entidade se fornecida
      if (data.entityType && data.entityId) {
        let entityExists = false
        
        switch (data.entityType) {
          case 'vehicle':
            const vehicleDoc = await admin.firestore()
              .collection(`companies/${data.companyId}/vehicles`)
              .doc(data.entityId)
              .get()
            entityExists = vehicleDoc.exists
            break
          case 'driver':
            const driverDoc = await admin.firestore()
              .collection(`companies/${data.companyId}/drivers`)
              .doc(data.entityId)
              .get()
            entityExists = driverDoc.exists
            break
          case 'route':
            const routeDoc = await admin.firestore()
              .collection(`companies/${data.companyId}/routes`)
              .doc(data.entityId)
              .get()
            entityExists = routeDoc.exists
            break
          case 'passenger':
            const passengerDoc = await admin.firestore()
              .collection(`companies/${data.companyId}/passengers`)
              .doc(data.entityId)
              .get()
            entityExists = passengerDoc.exists
            break
        }

        if (!entityExists) {
          throw new Error(`${data.entityType} não encontrado`)
        }
      }

      // Verificar se já existe alerta similar ativo (evitar duplicatas)
      const existingAlertsSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)
        .where('type', '==', data.type)
        .where('status', 'in', ['active', 'acknowledged'])
        .where('entity_type', '==', data.entityType || null)
        .where('entity_id', '==', data.entityId || null)
        .get()

      if (!existingAlertsSnapshot.empty) {
        // Para alertas críticos, permitir duplicatas
        if (data.severity !== 'critical') {
          throw new Error('Já existe um alerta similar ativo para esta entidade')
        }
      }

      // Criar alerta
      const alertId = admin.firestore().collection('temp').doc().id
      const alertData = {
        id: alertId,
        company_id: data.companyId,
        type: data.type,
        severity: data.severity,
        status: 'active' as AlertStatus,
        title: data.title,
        description: data.description,
        entity_type: data.entityType || null,
        entity_id: data.entityId || null,
        location: data.location ? {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address || '',
        } : null,
        metadata: data.metadata || {},
        created_by: context.auth.uid,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      await admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)
        .doc(alertId)
        .set(alertData)

      // Enviar notificações
      await sendAlertNotification(data.companyId, alertData)

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'alert_created',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'alert',
            id: alertId,
          },
          details: {
            alert_type: data.type,
            severity: data.severity,
            title: data.title,
            entity_type: data.entityType,
            entity_id: data.entityId,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        alertId,
        message: 'Alerta criado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao criar alerta:', error)
      throw new Error(`Erro ao criar alerta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Atualizar status do alerta
  updateAlertStatus: async (data: UpdateAlertStatusData, context: CallableContext) => {
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

      // Verificar se alerta existe
      const alertDoc = await admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)
        .doc(data.alertId)
        .get()

      if (!alertDoc.exists) {
        throw new Error('Alerta não encontrado')
      }

      const alertData = alertDoc.data()
      const currentStatus = alertData?.status

      // Validar transições de status
      const validTransitions: Record<string, string[]> = {
        active: ['acknowledged', 'resolved', 'dismissed'],
        acknowledged: ['resolved', 'dismissed'],
        resolved: [], // Não pode sair do status resolved
        dismissed: [], // Não pode sair do status dismissed
      }

      if (!validTransitions[currentStatus]?.includes(data.status)) {
        throw new Error(`Transição de status inválida: ${currentStatus} -> ${data.status}`)
      }

      // Preparar dados de atualização
      const updateData: any = {
        status: data.status,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      if (data.status === 'acknowledged') {
        updateData.acknowledged_by = context.auth.uid
        updateData.acknowledged_at = admin.firestore.FieldValue.serverTimestamp()
      }

      if (data.status === 'resolved') {
        updateData.resolved_by = data.resolvedBy || context.auth.uid
        updateData.resolved_at = admin.firestore.FieldValue.serverTimestamp()
        if (data.resolution) {
          updateData.resolution = data.resolution
        }
      }

      if (data.status === 'dismissed') {
        updateData.dismissed_by = context.auth.uid
        updateData.dismissed_at = admin.firestore.FieldValue.serverTimestamp()
        if (data.resolution) {
          updateData.dismissal_reason = data.resolution
        }
      }

      // Atualizar alerta
      await admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)
        .doc(data.alertId)
        .update(updateData)

      // Log da ação
      await admin.firestore()
        .collection(`companies/${data.companyId}/audit_logs`)
        .add({
          action: 'alert_status_updated',
          performed_by: context.auth.uid,
          target_entity: {
            type: 'alert',
            id: data.alertId,
          },
          details: {
            previous_status: currentStatus,
            new_status: data.status,
            resolution: data.resolution,
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        })

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: data.status,
        message: 'Status do alerta atualizado com sucesso',
      }
    } catch (error) {
      console.error('Erro ao atualizar status do alerta:', error)
      throw new Error(`Erro ao atualizar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },

  // Buscar alertas
  getAlerts: async (data: GetAlertsData, context: CallableContext) => {
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

      // Construir query
      let query: any = admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)

      // Aplicar filtros
      if (data.status && data.status.length > 0) {
        query = query.where('status', 'in', data.status)
      }

      if (data.severity && data.severity.length > 0) {
        query = query.where('severity', 'in', data.severity)
      }

      if (data.type && data.type.length > 0) {
        query = query.where('type', 'in', data.type)
      }

      if (data.entityType) {
        query = query.where('entity_type', '==', data.entityType)
      }

      if (data.entityId) {
        query = query.where('entity_id', '==', data.entityId)
      }

      if (data.startDate) {
        query = query.where('created_at', '>=', admin.firestore.Timestamp.fromDate(data.startDate))
      }

      if (data.endDate) {
        query = query.where('created_at', '<=', admin.firestore.Timestamp.fromDate(data.endDate))
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.orderBy('created_at', 'desc')

      // Aplicar paginação
      if (data.offset) {
        query = query.offset(data.offset)
      }

      if (data.limit) {
        query = query.limit(data.limit)
      } else {
        query = query.limit(50) // Limite padrão
      }

      const alertsSnapshot = await query.get()

      const alerts = alertsSnapshot.docs.map((doc: any) => {
        const alert = doc.data()
        return {
          id: doc.id,
          ...alert,
          created_at: alert.created_at?.toDate()?.toISOString(),
          updated_at: alert.updated_at?.toDate()?.toISOString(),
          acknowledged_at: alert.acknowledged_at?.toDate()?.toISOString(),
          resolved_at: alert.resolved_at?.toDate()?.toISOString(),
          dismissed_at: alert.dismissed_at?.toDate()?.toISOString(),
        }
      })

      // Buscar estatísticas dos alertas
      const statsSnapshot = await admin.firestore()
        .collection(`companies/${data.companyId}/alerts`)
        .get()

      const stats = {
        total: statsSnapshot.size,
        active: 0,
        acknowledged: 0,
        resolved: 0,
        dismissed: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }

      statsSnapshot.docs.forEach(doc => {
        const alert = doc.data()
        if (alert.status && stats.hasOwnProperty(alert.status)) {
          (stats as any)[alert.status]++
        }
        if (alert.severity && stats.hasOwnProperty(alert.severity)) {
          (stats as any)[alert.severity]++
        }
      })

      return {
        success: true,
        alerts,
        pagination: {
          total: stats.total,
          limit: data.limit || 50,
          offset: data.offset || 0,
          has_more: alerts.length === (data.limit || 50),
        },
        statistics: stats,
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error)
      throw new Error(`Erro ao buscar alertas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  },
}