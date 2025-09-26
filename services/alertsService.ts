import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para alertas
export type AlertRow = Database['public']['Tables']['alerts']['Row']
export type AlertInsert = Database['public']['Tables']['alerts']['Insert']
export type AlertUpdate = Database['public']['Tables']['alerts']['Update']

export interface AlertWithDetails extends AlertRow {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
  route?: {
    id: string
    name: string
    driver_name?: string
    vehicle_plate?: string
  }
  vehicle?: {
    id: string
    plate: string
    model: string
  }
  driver?: {
    id: string
    name: string
    cpf: string
  }
}

export interface AlertFilters {
  type?: 'Crítico' | 'Atenção' | 'Informativo'
  user_id?: string
  route_id?: string
  vehicle_id?: string
  date_from?: string
  date_to?: string
  is_read?: boolean
}

export class AlertsService extends BaseCrudService<
  AlertRow,
  AlertInsert,
  AlertUpdate,
  'alerts'
> {
  constructor() {
    super('alerts')
  }

  /**
   * Busca alertas com detalhes relacionados
   */
  async findAllWithDetails(): Promise<CrudListResponse<AlertWithDetails>> {
    try {
      const { data: alerts, error } = await this.client
        .from('alerts')
        .select(`
          *,
          user:users!alerts_user_id_fkey(id, name, email, role),
          route:routes!alerts_route_id_fkey(
            id, 
            name,
            driver:drivers!routes_driver_id_fkey(name),
            vehicle:vehicles!routes_vehicle_id_fkey(plate)
          ),
          vehicle:vehicles!alerts_vehicle_id_fkey(id, plate, model),
          driver:drivers!alerts_driver_id_fkey(id, name, cpf)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      const alertsWithDetails: AlertWithDetails[] = (alerts || []).map(alert => ({
        ...alert,
        user: alert.user || undefined,
        route: alert.route ? {
          ...alert.route,
          driver_name: alert.route.driver?.name,
          vehicle_plate: alert.route.vehicle?.plate,
        } : undefined,
        vehicle: alert.vehicle || undefined,
        driver: alert.driver || undefined,
      }))

      return { data: alertsWithDetails, error: null, count: alertsWithDetails.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar alertas com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca alertas não lidos
   */
  async findUnread(): Promise<CrudListResponse<AlertRow>> {
    return this.findAll({
      filters: { is_read: false },
      sort: { column: 'created_at', ascending: false }
    })
  }

  /**
   * Busca alertas críticos
   */
  async findCritical(): Promise<CrudListResponse<AlertRow>> {
    return this.findAll({
      filters: { type: 'Crítico' },
      sort: { column: 'created_at', ascending: false }
    })
  }

  /**
   * Busca alertas por usuário
   */
  async findByUser(userId: string): Promise<CrudListResponse<AlertRow>> {
    return this.findAll({
      filters: { user_id: userId },
      sort: { column: 'created_at', ascending: false }
    })
  }

  /**
   * Busca alertas por rota
   */
  async findByRoute(routeId: string): Promise<CrudListResponse<AlertRow>> {
    return this.findAll({
      filters: { route_id: routeId },
      sort: { column: 'created_at', ascending: false }
    })
  }

  /**
   * Busca alertas por veículo
   */
  async findByVehicle(vehicleId: string): Promise<CrudListResponse<AlertRow>> {
    return this.findAll({
      filters: { vehicle_id: vehicleId },
      sort: { column: 'created_at', ascending: false }
    })
  }



  /**
   * Busca alertas recentes (últimas 24 horas)
   */
  async findRecent(): Promise<CrudListResponse<AlertRow>> {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    try {
      const { data, error } = await this.client
        .from('alerts')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar alertas recentes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Cria um novo alerta
   */
  async create(data: AlertInsert): Promise<CrudResponse<AlertRow>> {
    // Define timestamp se não fornecido
    if (!data.timestamp) {
      data.timestamp = new Date().toISOString()
    }

    // Define is_read como false se não fornecido
    if (data.is_read === undefined) {
      data.is_read = false
    }

    return super.create(data)
  }

  /**
   * Marca um alerta como lido
   */
  async markAsRead(alertId: string): Promise<CrudResponse<AlertRow>> {
    const updateData: AlertUpdate = {
      is_read: true
    }

    return this.update(alertId, updateData)
  }

  /**
   * Marca um alerta como não lido
   */
  async markAsUnread(alertId: string): Promise<CrudResponse<AlertRow>> {
    const updateData: AlertUpdate = {
      is_read: false
    }

    return this.update(alertId, updateData)
  }

  /**
   * Cria alerta de emergência
   */
  async createEmergencyAlert(data: {
    user_id: string
    description: string
    location?: string
    route_id?: string
    vehicle_id?: string
  }): Promise<CrudResponse<AlertRow>> {
    return this.create({
      type: 'Crítico',
      title: 'Emergência',
      message: data.description,
      user_id: data.user_id,
      route_id: data.route_id,
      vehicle_id: data.vehicle_id,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Cria alerta de atraso
   */
  async createDelayAlert(data: {
    user_id: string
    route_id: string
    estimated_delay: number
    reason?: string
  }): Promise<CrudResponse<AlertRow>> {
    return this.create({
      user_id: data.user_id,
      route_id: data.route_id,
      type: 'Atenção',
      title: 'Atraso na Rota',
      message: `Atraso de ${data.estimated_delay} minutos${data.reason ? `: ${data.reason}` : ''}`,
      timestamp: new Date().toISOString(),
      is_read: false
    })
  }

  /**
   * Cria alerta de quebra de veículo
   */
  async createBreakdownAlert(data: {
    user_id: string
    vehicle_id: string
    route_id?: string
    description: string
    location?: string
  }): Promise<CrudResponse<AlertRow>> {
    return this.create({
      type: 'Crítico',
      title: 'Quebra de Veículo',
      message: data.description,
      user_id: data.user_id,
      vehicle_id: data.vehicle_id,
      route_id: data.route_id,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Busca alertas com filtros específicos
   */
  async findWithFilters(filters: AlertFilters): Promise<CrudListResponse<AlertRow>> {
    let query = this.client.from('alerts').select('*')

    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters.route_id) {
      query = query.eq('route_id', filters.route_id)
    }
    if (filters.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id)
    }
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    try {
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar alertas com filtros: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Obtém estatísticas dos alertas
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    unread: number
    read: number
    byType: { [key: string]: number }
    recent24h: number
    critical: number
  }>> {
    try {
      // Busca todos os alertas para calcular estatísticas
      const allAlerts = await this.findAll()
      
      if (allAlerts.error) {
        return { data: null, error: allAlerts.error }
      }

      const alerts = allAlerts.data

      // Estatísticas básicas
      const total = alerts.length
      const unread = alerts.filter(alert => !alert.is_read).length
      const read = alerts.filter(alert => alert.is_read).length

      // Estatísticas por tipo
      const byType = alerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      // Alertas críticos
      const critical = alerts.filter(alert => alert.type === 'Crítico').length

      // Alertas recentes (últimas 24 horas)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const recent24h = alerts.filter(alert => 
        new Date(alert.created_at) >= yesterday
      ).length

      return {
        data: {
          total,
          unread,
          read,
          byType,
          recent24h,
          critical
        },
        error: null
      }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao obter estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }
}

// Instância singleton
export const alertsService = new AlertsService()