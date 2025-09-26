import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para rotas
export type RouteRow = Database['public']['Tables']['routes']['Row']
export type RouteInsert = Database['public']['Tables']['routes']['Insert']
export type RouteUpdate = Database['public']['Tables']['routes']['Update']

export interface RouteWithDetails extends RouteRow {
  driver?: {
    id: string
    name: string
    cpf: string
    status: string
  }
  vehicle?: {
    id: string
    plate: string
    model: string
    capacity: number
  }
  passengers?: Array<{
    id: string
    name: string
    cpf: string
    pickup_order: number
    pickup_location: string
    dropoff_location: string
  }>
  company?: {
    id: string
    name: string
  }
  stats?: {
    totalPassengers: number
    completedTrips: number
    averageRating: number
    onTimePercentage: number
  }
}

export interface RouteFilters {
  name?: string
  status?: 'Ativa' | 'Inativa' | 'Em andamento' | 'Concluída'
  driver_id?: string
  vehicle_id?: string
  company_id?: string
  pickup_time?: string
  route_type?: 'ida' | 'volta' | 'circular'
  days_of_week?: string[]
}

export class RoutesService extends BaseCrudService<
  RouteRow,
  RouteInsert,
  RouteUpdate,
  'routes'
> {
  constructor() {
    super('routes')
  }

  /**
   * Busca rotas com todos os detalhes
   */
  async findAllWithDetails(): Promise<CrudListResponse<RouteWithDetails>> {
    try {
      const { data: routes, error } = await this.client
        .from('routes')
        .select(`
          *,
          driver:drivers!routes_driver_id_fkey(id, name, cpf, status),
          vehicle:vehicles!routes_vehicle_id_fkey(id, plate, model, capacity),
          company:companies!routes_company_id_fkey(id, name),
          passengers:route_passengers!route_passengers_route_id_fkey(
            pickup_order,
            pickup_location,
            dropoff_location,
            passenger:passengers!route_passengers_passenger_id_fkey(id, name, cpf)
          )
        `)
        .order('name')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      const routesWithDetails: RouteWithDetails[] = (routes || []).map(route => ({
        ...route,
        driver: route.driver || undefined,
        vehicle: route.vehicle || undefined,
        company: route.company || undefined,
        passengers: route.passengers?.map((rp: any) => ({
          ...rp.passenger,
          pickup_order: rp.pickup_order,
          pickup_location: rp.pickup_location,
          dropoff_location: rp.dropoff_location,
        })) || [],
      }))

      return { data: routesWithDetails, error: null, count: routesWithDetails.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar rotas com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca rotas ativas
   */
  async findActive(): Promise<CrudListResponse<RouteRow>> {
    return this.findAll({
      filters: { status: 'Ativa' },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca rotas em andamento
   */
  async findInProgress(): Promise<CrudListResponse<RouteRow>> {
    return this.findAll({
      filters: { status: 'Em andamento' },
      sort: { column: 'pickup_time', ascending: true }
    })
  }

  /**
   * Busca rotas por motorista
   */
  async findByDriver(driverId: string): Promise<CrudListResponse<RouteRow>> {
    return this.findAll({
      filters: { driver_id: driverId },
      sort: { column: 'pickup_time', ascending: true }
    })
  }

  /**
   * Busca rotas por veículo
   */
  async findByVehicle(vehicleId: string): Promise<CrudListResponse<RouteRow>> {
    return this.findAll({
      filters: { vehicle_id: vehicleId },
      sort: { column: 'pickup_time', ascending: true }
    })
  }

  /**
   * Busca rotas por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<RouteRow>> {
    return this.findAll({
      filters: { company_id: companyId },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca rotas do dia
   */
  async findTodayRoutes(): Promise<CrudListResponse<RouteRow>> {
    const today = new Date().toISOString().split('T')[0]
    const dayOfWeek = new Date().toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase()

    try {
      const { data, error } = await this.client
        .from('routes')
        .select('*')
        .eq('status', 'Ativa')
        .contains('days_of_week', [dayOfWeek])
        .order('pickup_time')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar rotas do dia: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Valida horário da rota
   */
  private validateTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  /**
   * Valida dias da semana
   */
  private validateDaysOfWeek(days: string[]): boolean {
    const validDays = ['segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado', 'domingo']
    return days.every(day => validDays.includes(day.toLowerCase()))
  }

  /**
   * Cria uma nova rota com validação
   */
  async create(data: RouteInsert): Promise<CrudResponse<RouteRow>> {

    // Verifica se motorista está disponível
    if (data.driver_id) {
      const driverRoutes = await this.findByDriver(data.driver_id)
      const conflictingRoutes = driverRoutes.data.filter(route => 
        route.status === 'No Horário' && 
        route.scheduled_start === data.scheduled_start
      )

      if (conflictingRoutes.length > 0) {
        return { data: null, error: 'Motorista já possui rota no mesmo horário' }
      }
    }

    // Verifica se veículo está disponível
    if (data.vehicle_id) {
      const vehicleRoutes = await this.findByVehicle(data.vehicle_id)
      const conflictingRoutes = vehicleRoutes.data.filter(route => 
        route.status === 'No Horário' && 
        route.scheduled_start === data.scheduled_start
      )

      if (conflictingRoutes.length > 0) {
        return { data: null, error: 'Veículo já possui rota no mesmo horário' }
      }
    }

    return super.create(data)
  }

  /**
   * Atualiza rota com validação
   */
  async update(id: string, data: RouteUpdate): Promise<CrudResponse<RouteRow>> {
    return super.update(id, data)
  }

  /**
   * Inicia uma rota
   */
  async startRoute(routeId: string): Promise<CrudResponse<RouteRow>> {
    const route = await this.findById(routeId)
    if (!route.data) {
      return { data: null, error: 'Rota não encontrada' }
    }

    if (route.data.status !== 'No Horário') {
      return { data: null, error: 'Apenas rotas no horário podem ser iniciadas' }
    }

    return this.update(routeId, {
      status: 'No Horário',
      actual_start: new Date().toISOString()
    })
  }

  /**
   * Finaliza uma rota
   */
  async finishRoute(routeId: string): Promise<CrudResponse<RouteRow>> {
    const route = await this.findById(routeId)
    if (!route.data) {
      return { data: null, error: 'Rota não encontrada' }
    }

    if (route.data.status !== 'No Horário') {
      return { data: null, error: 'Apenas rotas no horário podem ser finalizadas' }
    }

    return this.update(routeId, {
      status: 'No Horário'
    })
  }

  /**
   * Cancela uma rota
   */
  async cancelRoute(routeId: string, reason?: string): Promise<CrudResponse<RouteRow>> {
    return this.update(routeId, {
      status: 'Com Problema'
    })
  }

  /**
   * Atribui motorista à rota
   */
  async assignDriver(routeId: string, driverId: string): Promise<CrudResponse<RouteRow>> {
    const route = await this.findById(routeId)
    if (!route.data) {
      return { data: null, error: 'Rota não encontrada' }
    }

    // Verifica conflitos de horário
    const driverRoutes = await this.findByDriver(driverId)
    const conflictingRoutes = driverRoutes.data.filter(r => 
      r.id !== routeId &&
      r.status === 'No Horário' && 
      r.scheduled_start === route.data!.scheduled_start
    )

    if (conflictingRoutes.length > 0) {
      return { data: null, error: 'Motorista já possui rota no mesmo horário' }
    }

    return this.update(routeId, { driver_id: driverId })
  }

  /**
   * Atribui veículo à rota
   */
  async assignVehicle(routeId: string, vehicleId: string): Promise<CrudResponse<RouteRow>> {
    const route = await this.findById(routeId)
    if (!route.data) {
      return { data: null, error: 'Rota não encontrada' }
    }

    // Verifica conflitos de horário
    const vehicleRoutes = await this.findByVehicle(vehicleId)
    const conflictingRoutes = vehicleRoutes.data.filter(r => 
      r.id !== routeId &&
      r.status === 'No Horário' && 
      r.scheduled_start === route.data!.scheduled_start
    )

    if (conflictingRoutes.length > 0) {
      return { data: null, error: 'Veículo já possui rota no mesmo horário' }
    }

    return this.update(routeId, { vehicle_id: vehicleId })
  }

  /**
   * Busca rotas com filtros específicos
   */
  async findWithFilters(filters: RouteFilters): Promise<CrudListResponse<RouteRow>> {
    const searchFilters: any = {}

    if (filters.name) {
      searchFilters.name = `%${filters.name}%`
    }
    if (filters.status) {
      searchFilters.status = filters.status
    }
    if (filters.driver_id) {
      searchFilters.driver_id = filters.driver_id
    }
    if (filters.vehicle_id) {
      searchFilters.vehicle_id = filters.vehicle_id
    }
    if (filters.company_id) {
      searchFilters.company_id = filters.company_id
    }
    if (filters.pickup_time) {
      searchFilters.pickup_time = filters.pickup_time
    }
    if (filters.route_type) {
      searchFilters.route_type = filters.route_type
    }

    return this.findAll({
      filters: searchFilters,
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Obtém estatísticas das rotas
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    active: number
    inactive: number
    inProgress: number
    completed: number
    byStatus: { [key: string]: number }
    averagePassengers: number
    totalPassengers: number
    routesWithDriver: number
    routesWithVehicle: number
    routesToday: number
  }>> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        inProgressResult,
        completedResult,
        todayResult
      ] = await Promise.all([
        this.count(),
        this.count({ status: 'Ativa' }),
        this.count({ status: 'Inativa' }),
        this.count({ status: 'Em andamento' }),
        this.count({ status: 'Concluída' }),
        this.findTodayRoutes()
      ])

      // Busca todas as rotas para calcular estatísticas detalhadas
      const allRoutes = await this.findAll()
      
      if (allRoutes.error) {
        return { data: null, error: allRoutes.error }
      }

      const routes = allRoutes.data

      // Estatísticas por tipo não disponível (campo route_type não existe)

      const byStatus = routes.reduce((acc, route) => {
        acc[route.status] = (acc[route.status] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const routesWithDriver = routes.filter(route => route.driver_id).length
      const routesWithVehicle = routes.filter(route => route.vehicle_id).length

      // Conta total de passageiros
      const { data: routePassengers } = await this.client
        .from('route_passengers')
        .select('route_id')

      const totalPassengers = routePassengers?.length || 0
      const averagePassengers = routes.length > 0 ? totalPassengers / routes.length : 0

      return {
        data: {
          total: totalResult.data || 0,
          active: activeResult.data || 0,
          inactive: inactiveResult.data || 0,
          inProgress: inProgressResult.data || 0,
          completed: completedResult.data || 0,
          byStatus,
          averagePassengers: Math.round(averagePassengers * 10) / 10,
          totalPassengers,
          routesWithDriver,
          routesWithVehicle,
          routesToday: todayResult.count || 0,
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
export const routesService = new RoutesService()