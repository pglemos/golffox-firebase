import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para empresas
export type CompanyRow = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export interface CompanyWithStats extends CompanyRow {
  totalDrivers?: number
  totalVehicles?: number
  totalPassengers?: number
  totalRoutes?: number
  activeRoutes?: number
}

export interface CompanyFilters {
  name?: string
  cnpj?: string
  status?: 'Ativo' | 'Inativo'
  city?: string
}

export class CompaniesService extends BaseCrudService<
  CompanyRow,
  CompanyInsert,
  CompanyUpdate,
  'companies'
> {
  constructor() {
    super('companies')
  }

  /**
   * Busca empresas com estatísticas
   */
  async findAllWithStats(): Promise<CrudListResponse<CompanyWithStats>> {
    try {
      const { data: companies, error: companiesError } = await this.client
        .from('companies')
        .select(`
          *,
          drivers:drivers(count),
          vehicles:vehicles(count),
          passengers:passengers(count),
          routes:routes(count),
          active_routes:routes!inner(count)
        `)

      if (companiesError) {
        return { data: [], error: this.translateError(companiesError.message) }
      }

      const companiesWithStats: CompanyWithStats[] = (companies || []).map(company => ({
        ...company,
        totalDrivers: company.drivers?.[0]?.count || 0,
        totalVehicles: company.vehicles?.[0]?.count || 0,
        totalPassengers: company.passengers?.[0]?.count || 0,
        totalRoutes: company.routes?.[0]?.count || 0,
        activeRoutes: company.active_routes?.[0]?.count || 0,
      }))

      return { data: companiesWithStats, error: null, count: companiesWithStats.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar empresas com estatísticas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca empresa por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<CrudResponse<CompanyRow>> {
    try {
      const { data, error } = await this.client
        .from('companies')
        .select('*')
        .eq('cnpj', cnpj)
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao buscar empresa por CNPJ: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Busca empresas ativas
   */
  async findActive(): Promise<CrudListResponse<CompanyRow>> {
    return this.findAll({
      filters: { status: 'Ativo' },
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Valida CNPJ antes de criar/atualizar
   */
  private validateCnpj(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/\D/g, '')
    
    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false
    
    // Verifica se não são todos iguais
    if (/^(\d)\1+$/.test(cleanCnpj)) return false
    
    // Validação dos dígitos verificadores
    let sum = 0
    let weight = 2
    
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(cleanCnpj[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }
    
    const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (parseInt(cleanCnpj[12]) !== firstDigit) return false
    
    sum = 0
    weight = 2
    
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(cleanCnpj[i]) * weight
      weight = weight === 9 ? 2 : weight + 1
    }
    
    const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return parseInt(cleanCnpj[13]) === secondDigit
  }

  /**
   * Cria uma nova empresa com validação
   */
  async create(data: CompanyInsert): Promise<CrudResponse<CompanyRow>> {
    // Valida CNPJ
    if (!this.validateCnpj(data.cnpj)) {
      return { data: null, error: 'CNPJ inválido' }
    }

    // Verifica se CNPJ já existe
    const existingCompany = await this.findByCnpj(data.cnpj)
    if (existingCompany.data) {
      return { data: null, error: 'CNPJ já cadastrado' }
    }

    return super.create(data)
  }

  /**
   * Atualiza empresa com validação
   */
  async update(id: string, data: CompanyUpdate): Promise<CrudResponse<CompanyRow>> {
    // Se está atualizando CNPJ, valida
    if (data.cnpj && !this.validateCnpj(data.cnpj)) {
      return { data: null, error: 'CNPJ inválido' }
    }

    // Se está atualizando CNPJ, verifica se já existe
    if (data.cnpj) {
      const existingCompany = await this.findByCnpj(data.cnpj)
      if (existingCompany.data && existingCompany.data.id !== id) {
        return { data: null, error: 'CNPJ já cadastrado por outra empresa' }
      }
    }

    return super.update(id, data)
  }

  /**
   * Ativa/desativa empresa
   */
  async toggleStatus(id: string): Promise<CrudResponse<CompanyRow>> {
    const company = await this.findById(id)
    if (!company.data) {
      return { data: null, error: 'Empresa não encontrada' }
    }

    const newStatus = company.data.status === 'Ativo' ? 'Inativo' : 'Ativo'
    return this.update(id, { status: newStatus })
  }

  /**
   * Busca empresas com filtros específicos
   */
  async findWithFilters(filters: CompanyFilters): Promise<CrudListResponse<CompanyRow>> {
    const searchFilters: any = {}

    if (filters.name) {
      searchFilters.name = `%${filters.name}%`
    }
    if (filters.cnpj) {
      searchFilters.cnpj = filters.cnpj
    }
    if (filters.status) {
      searchFilters.status = filters.status
    }

    return this.findAll({
      filters: searchFilters,
      sort: { column: 'name', ascending: true }
    })
  }

  /**
   * Obtém estatísticas gerais das empresas
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    active: number
    inactive: number
    totalDrivers: number
    totalVehicles: number
    totalPassengers: number
  }>> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        driversResult,
        vehiclesResult,
        passengersResult
      ] = await Promise.all([
        this.count(),
        this.count({ status: 'Ativo' }),
        this.count({ status: 'Inativo' }),
        this.client.from('drivers').select('*', { count: 'exact', head: true }),
        this.client.from('vehicles').select('*', { count: 'exact', head: true }),
        this.client.from('passengers').select('*', { count: 'exact', head: true })
      ])

      if (totalResult.error) return { data: null, error: totalResult.error }
      if (activeResult.error) return { data: null, error: activeResult.error }
      if (inactiveResult.error) return { data: null, error: inactiveResult.error }

      return {
        data: {
          total: totalResult.data || 0,
          active: activeResult.data || 0,
          inactive: inactiveResult.data || 0,
          totalDrivers: driversResult.count || 0,
          totalVehicles: vehiclesResult.count || 0,
          totalPassengers: passengersResult.count || 0,
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
export const companiesService = new CompaniesService()