import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para passageiros
export type PassengerRow = Database['public']['Tables']['passengers']['Row']
export type PassengerInsert = Database['public']['Tables']['passengers']['Insert']
export type PassengerUpdate = Database['public']['Tables']['passengers']['Update']

export interface PassengerWithRoutes extends PassengerRow {
  routes?: Array<{
    id: string
    name: string
    status: string
    pickup_time: string
    pickup_location: string
    dropoff_location: string
  }>
  company?: {
    id: string
    name: string
    status: string
  }
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface PassengerFilters {
  name?: string
  cpf?: string
  email?: string
  status?: 'Ativo' | 'Inativo'
  company_id?: string
  address?: string
  special_needs?: boolean
  route_id?: string
}

export class PassengersService extends BaseCrudService<
  PassengerRow,
  PassengerInsert,
  PassengerUpdate,
  'passengers'
> {
  constructor() {
    super('passengers')
  }

  /**
   * Busca passageiros com rotas e empresa
   */
  async findAllWithDetails(): Promise<CrudListResponse<PassengerWithRoutes>> {
    try {
      const { data: passengers, error } = await this.client
        .from('passengers')
        .select(`
          *,
          company:companies!passengers_company_id_fkey(id, name, status),
          routes:route_passengers!route_passengers_passenger_id_fkey(
            route:routes!route_passengers_route_id_fkey(
              id, name, status, pickup_time, pickup_location, dropoff_location
            )
          )
        `)
        .order('name')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      const passengersWithDetails: PassengerWithRoutes[] = (passengers || []).map(passenger => ({
        ...passenger,
        company: passenger.company || undefined,
        routes: passenger.routes?.map((rp: any) => rp.route) || [],
        emergencyContact: passenger.emergency_contact ? {
          name: passenger.emergency_contact.name,
          phone: passenger.emergency_contact.phone,
          relationship: passenger.emergency_contact.relationship
        } : undefined,
      }))

      return { data: passengersWithDetails, error: null, count: passengersWithDetails.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar passageiros com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca passageiro por CPF
   */
  async findByCpf(cpf: string): Promise<CrudResponse<PassengerRow>> {
    try {
      const { data, error } = await this.client
        .from('passengers')
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
        error: `Erro ao buscar passageiro por CPF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Busca passageiros ativos
   */
  async findActive(): Promise<CrudListResponse<PassengerRow>> {
    return this.findAll({
      filters: { status: 'Ativo' },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca passageiros por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<PassengerRow>> {
    return this.findAll({
      filters: { company_id: companyId },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Busca passageiros por rota
   */
  async findByRoute(routeId: string): Promise<CrudListResponse<PassengerRow>> {
    try {
      const { data, error } = await this.client
        .from('passengers')
        .select(`
          *,
          route_passengers!route_passengers_passenger_id_fkey(route_id)
        `)
        .eq('route_passengers.route_id', routeId)
        .order('name')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar passageiros por rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca passageiros com necessidades especiais
   */
  async findWithSpecialNeeds(): Promise<CrudListResponse<PassengerRow>> {
    return this.findAll({
      filters: { special_needs: true },
      sort: { column: 'name', ascending: true }
    })
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
   * Valida email
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Valida telefone
   */
  private validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  }

  /**
   * Cria um novo passageiro com validação
   */
  async create(data: PassengerInsert): Promise<CrudResponse<PassengerRow>> {
    // Valida CPF
    if (!this.validateCpf(data.cpf)) {
      return { data: null, error: 'CPF inválido' }
    }

    // Valida email se fornecido
    if (data.email && !this.validateEmail(data.email)) {
      return { data: null, error: 'Email inválido' }
    }

    // Verifica se CPF já existe
    const existingPassenger = await this.findByCpf(data.cpf)
    if (existingPassenger.data) {
      return { data: null, error: 'CPF já cadastrado' }
    }

    return super.create(data)
  }

  /**
   * Atualiza passageiro com validação
   */
  async update(id: string, data: PassengerUpdate): Promise<CrudResponse<PassengerRow>> {
    // Se está atualizando CPF, valida
    if (data.cpf && !this.validateCpf(data.cpf)) {
      return { data: null, error: 'CPF inválido' }
    }

    // Se está atualizando email, valida
    if (data.email && !this.validateEmail(data.email)) {
      return { data: null, error: 'Email inválido' }
    }

    // Se está atualizando CPF, verifica se já existe
    if (data.cpf) {
      const existingPassenger = await this.findByCpf(data.cpf)
      if (existingPassenger.data && existingPassenger.data.id !== id) {
        return { data: null, error: 'CPF já cadastrado por outro passageiro' }
      }
    }

    return super.update(id, data)
  }

  /**
   * Atribui passageiro a uma rota
   */
  async assignToRoute(passengerId: string, routeId: string, pickupOrder?: number): Promise<CrudResponse<any>> {
    try {
      const { data, error } = await this.client
        .from('route_passengers')
        .insert({
          passenger_id: passengerId,
          route_id: routeId,
          pickup_order: pickupOrder || 1
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao atribuir passageiro à rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Remove passageiro de uma rota
   */
  async removeFromRoute(passengerId: string, routeId: string): Promise<CrudResponse<any>> {
    try {
      const { data, error } = await this.client
        .from('route_passengers')
        .delete()
        .eq('passenger_id', passengerId)
        .eq('route_id', routeId)
        .select()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao remover passageiro da rota: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Suspende passageiro (marca como Inativo)
   */
  async suspend(passengerId: string, reason?: string): Promise<CrudResponse<PassengerRow>> {
    return this.update(passengerId, {
      status: 'Inativo'
    })
  }

  /**
   * Reativa passageiro
   */
  async reactivate(passengerId: string): Promise<CrudResponse<PassengerRow>> {
    return this.update(passengerId, {
      status: 'Ativo'
    })
  }

  /**
   * Busca passageiros com filtros específicos
   */
  async findWithFilters(filters: PassengerFilters): Promise<CrudListResponse<PassengerRow>> {
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
    if (filters.company_id) {
      searchFilters.company_id = filters.company_id
    }
    if (filters.address) {
      searchFilters.address = `%${filters.address}%`
    }
    if (filters.special_needs !== undefined) {
      searchFilters.special_needs = filters.special_needs
    }

    return this.findAll({
      filters: searchFilters,
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Obtém estatísticas dos passageiros
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    active: number
    inactive: number
    withSpecialNeeds: number
    byCompany: { [key: string]: number }
    byStatus: { [key: string]: number }
    withRoutes: number
    withoutRoutes: number
  }>> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        specialNeedsResult
      ] = await Promise.all([
        this.count(),
        this.count({ status: 'Ativo' }),
        this.count({ status: 'Inativo' }),
        this.count({ special_needs: true })
      ])

      // Busca todos os passageiros para calcular estatísticas detalhadas
      const allPassengers = await this.findAll()
      
      if (allPassengers.error) {
        return { data: null, error: allPassengers.error }
      }

      const passengers = allPassengers.data

      // Busca empresas para estatísticas
      const { data: companies } = await this.client
        .from('companies')
        .select('id, name')

      const companyMap = companies?.reduce((acc, company) => {
        acc[company.id] = company.name
        return acc
      }, {} as { [key: string]: string }) || {}

      const byCompany = passengers.reduce((acc, passenger) => {
        const companyName = companyMap[passenger.company_id] || 'Sem empresa'
        acc[companyName] = (acc[companyName] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      const byStatus = passengers.reduce((acc, passenger) => {
        acc[passenger.status] = (acc[passenger.status] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      // Conta passageiros com e sem rotas
      const { data: routePassengers } = await this.client
        .from('route_passengers')
        .select('passenger_id')

      const passengersWithRoutes = new Set(routePassengers?.map(rp => rp.passenger_id) || [])
      const withRoutes = passengersWithRoutes.size
      const withoutRoutes = passengers.length - withRoutes

      return {
        data: {
          total: totalResult.data || 0,
          active: activeResult.data || 0,
          inactive: inactiveResult.data || 0,
          withSpecialNeeds: specialNeedsResult.data || 0,
          byCompany,
          byStatus,
          withRoutes,
          withoutRoutes,
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
export const passengersService = new PassengersService()