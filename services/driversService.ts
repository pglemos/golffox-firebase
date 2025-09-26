import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para motoristas
export type DriverRow = Database['public']['Tables']['drivers']['Row']
export type DriverInsert = Database['public']['Tables']['drivers']['Insert']
export type DriverUpdate = Database['public']['Tables']['drivers']['Update']

export interface DriverWithVehicle extends DriverRow {
  vehicle?: {
    id: string
    plate: string
    model: string
    status: string
  }
  currentRoute?: {
    id: string
    name: string
    status: string
  }
  performance?: {
    punctuality: number
    totalRoutes: number
    completedRoutes: number
  }
}

export interface DriverFilters {
  name?: string
  cpf?: string
  email?: string
  status?: 'Ativo' | 'Em análise' | 'Inativo'
  linked_company?: string
  cnh_category?: 'D' | 'E'
  contract_type?: 'CLT' | 'terceirizado' | 'autônomo'
  availability?: string
}

export class DriversService extends BaseCrudService<
  DriverRow,
  DriverInsert,
  DriverUpdate,
  'drivers'
> {
  constructor() {
    super('drivers')
  }

  /**
   * Busca motoristas com veículos e rotas
   */
  async findAllWithDetails(): Promise<CrudListResponse<DriverWithVehicle>> {
    try {
      const { data: drivers, error } = await this.client
        .from('drivers')
        .select(`
          *,
          vehicle:vehicles!drivers_id_fkey(id, plate, model, status),
          current_route:routes!routes_driver_id_fkey(id, name, status),
          performance:driver_performance(punctuality, total_routes, completed_routes)
        `)

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      const driversWithDetails: DriverWithVehicle[] = (drivers || []).map(driver => ({
        ...driver,
        vehicle: driver.vehicle || undefined,
        currentRoute: driver.current_route || undefined,
        performance: driver.performance?.[0] || undefined,
      }))

      return { data: driversWithDetails, error: null, count: driversWithDetails.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar motoristas com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca motorista por CPF
   */
  async findByCpf(cpf: string): Promise<CrudResponse<DriverRow>> {
    try {
      const { data, error } = await this.client
        .from('drivers')
        .select('*')
        .eq('cpf', cpf)
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao buscar motorista por CPF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Busca motoristas ativos
   */
  async findActive(): Promise<CrudListResponse<DriverRow>> {
    return this.findAll({
      filters: { status: 'Ativo' },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca motoristas por empresa
   */
  async findByCompany(companyName: string): Promise<CrudListResponse<DriverRow>> {
    return this.findAll({
      filters: { linked_company: companyName },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca motoristas disponíveis (sem rota ativa)
   */
  async findAvailable(): Promise<CrudListResponse<DriverRow>> {
    try {
      const { data, error } = await this.client
        .from('drivers')
        .select('*')
        .eq('status', 'Ativo')
        .is('assigned_routes', null)
        .order('name')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar motoristas disponíveis: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Valida CPF
   */
  private validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '')
    
    if (cleanCpf.length !== 11) return false
    if (/^(\d)\1+$/.test(cleanCpf)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i)
    }
    
    let digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    if (parseInt(cleanCpf[9]) !== digit) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i)
    }
    
    digit = 11 - (sum % 11)
    if (digit >= 10) digit = 0
    return parseInt(cleanCpf[10]) === digit
  }

  /**
   * Valida CNH
   */
  private validateCnh(cnh: string): boolean {
    const cleanCnh = cnh.replace(/\D/g, '')
    return cleanCnh.length === 11
  }

  /**
   * Verifica se a CNH está vencida
   */
  private isCnhExpired(validity: string): boolean {
    const validityDate = new Date(validity)
    const today = new Date()
    return validityDate < today
  }

  /**
   * Cria um novo motorista com validação
   */
  async create(data: DriverInsert): Promise<CrudResponse<DriverRow>> {
    // Valida CPF
    if (!this.validateCpf(data.cpf)) {
      return { data: null, error: 'CPF inválido' }
    }

    // Valida CNH
    if (!this.validateCnh(data.cnh)) {
      return { data: null, error: 'CNH inválida' }
    }

    // Verifica se CNH está vencida
    if (this.isCnhExpired(data.cnh_validity)) {
      return { data: null, error: 'CNH vencida' }
    }

    // Verifica se CPF já existe
    const existingDriver = await this.findByCpf(data.cpf)
    if (existingDriver.data) {
      return { data: null, error: 'CPF já cadastrado' }
    }

    return super.create(data)
  }

  /**
   * Atualiza motorista com validação
   */
  async update(id: string, data: DriverUpdate): Promise<CrudResponse<DriverRow>> {
    // Se está atualizando CPF, valida
    if (data.cpf && !this.validateCpf(data.cpf)) {
      return { data: null, error: 'CPF inválido' }
    }

    // Se está atualizando CNH, valida
    if (data.cnh && !this.validateCnh(data.cnh)) {
      return { data: null, error: 'CNH inválida' }
    }

    // Se está atualizando validade da CNH, verifica se não está vencida
    if (data.cnh_validity && this.isCnhExpired(data.cnh_validity)) {
      return { data: null, error: 'CNH vencida' }
    }

    // Se está atualizando CPF, verifica se já existe
    if (data.cpf) {
      const existingDriver = await this.findByCpf(data.cpf)
      if (existingDriver.data && existingDriver.data.id !== id) {
        return { data: null, error: 'CPF já cadastrado por outro motorista' }
      }
    }

    return super.update(id, data)
  }

  /**
   * Atribui rota ao motorista
   */
  async assignRoute(driverId: string, routeId: string): Promise<CrudResponse<DriverRow>> {
    const driver = await this.findById(driverId)
    if (!driver.data) {
      return { data: null, error: 'Motorista não encontrado' }
    }

    const currentRoutes = driver.data.assigned_routes || []
    if (currentRoutes.includes(routeId)) {
      return { data: null, error: 'Rota já atribuída ao motorista' }
    }

    return this.update(driverId, {
      assigned_routes: [...currentRoutes, routeId]
    })
  }

  /**
   * Remove rota do motorista
   */
  async unassignRoute(driverId: string, routeId: string): Promise<CrudResponse<DriverRow>> {
    const driver = await this.findById(driverId)
    if (!driver.data) {
      return { data: null, error: 'Motorista não encontrado' }
    }

    const currentRoutes = driver.data.assigned_routes || []
    const updatedRoutes = currentRoutes.filter(id => id !== routeId)

    return this.update(driverId, {
      assigned_routes: updatedRoutes
    })
  }

  /**
   * Busca motoristas com filtros específicos
   */
  async findWithFilters(filters: DriverFilters): Promise<CrudListResponse<DriverRow>> {
    const searchFilters: any = {}

    if (filters.name) {
      searchFilters.name = `%${filters.name}%`
    }
    if (filters.cpf) {
      searchFilters.cpf = filters.cpf
    }
    if (filters.email) {
      searchFilters.email = `%${filters.email}%`
    }
    if (filters.status) {
      searchFilters.status = filters.status
    }
    if (filters.linked_company) {
      searchFilters.linked_company = filters.linked_company
    }
    if (filters.cnh_category) {
      searchFilters.cnh_category = filters.cnh_category
    }
    if (filters.contract_type) {
      searchFilters.contract_type = filters.contract_type
    }
    if (filters.availability) {
      searchFilters.availability = filters.availability
    }

    return this.findAll({
      filters: searchFilters,
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Obtém estatísticas dos motoristas
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    active: number
    inactive: number
    inAnalysis: number
    withExpiredCnh: number
    available: number
    byContractType: { [key: string]: number }
    byCnhCategory: { [key: string]: number }
  }>> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        inAnalysisResult,
        availableResult
      ] = await Promise.all([
        this.count(),
        this.count({ status: 'Ativo' }),
        this.count({ status: 'Inativo' }),
        this.count({ status: 'Em análise' }),
        this.findAvailable()
      ])

      // Busca todos os motoristas para calcular estatísticas detalhadas
      const allDrivers = await this.findAll()
      
      if (allDrivers.error) {
        return { data: null, error: allDrivers.error }
      }

      const drivers = allDrivers.data
      const today = new Date()

      const withExpiredCnh = drivers.filter(driver => 
        new Date(driver.cnh_validity) < today
      ).length

      const byContractType = drivers.reduce((acc, driver) => {
        acc[driver.contract_type] = (acc[driver.contract_type] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const byCnhCategory = drivers.reduce((acc, driver) => {
        acc[driver.cnh_category] = (acc[driver.cnh_category] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      return {
        data: {
          total: totalResult.data || 0,
          active: activeResult.data || 0,
          inactive: inactiveResult.data || 0,
          inAnalysis: inAnalysisResult.data || 0,
          withExpiredCnh,
          available: availableResult.count || 0,
          byContractType,
          byCnhCategory,
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
export const driversService = new DriversService()