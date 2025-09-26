import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService'
import type { Database } from '../lib/supabase'

// Tipos específicos para veículos
export type VehicleRow = Database['public']['Tables']['vehicles']['Row']
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert']
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update']

export interface VehicleWithDriver extends VehicleRow {
  driver?: {
    id: string
    name: string
    cpf: string
    status: string
  }
  currentRoute?: {
    id: string
    name: string
    status: string
  }
  lastLocation?: {
    latitude: number
    longitude: number
    timestamp: string
  }
  maintenance?: {
    lastMaintenance: string
    nextMaintenance: string
    status: string
  }
}

export interface VehicleFilters {
  plate?: string
  model?: string
  brand?: string
  status?: 'Ativo' | 'Manutenção' | 'Inativo'
  type?: 'van' | 'micro-ônibus' | 'ônibus'
  year?: number
  capacity?: number
  fuel_type?: 'gasolina' | 'etanol' | 'diesel' | 'flex'
}

export class VehiclesService extends BaseCrudService<
  VehicleRow,
  VehicleInsert,
  VehicleUpdate,
  'vehicles'
> {
  constructor() {
    super('vehicles')
  }

  /**
   * Busca veículos com motoristas e rotas
   */
  async findAllWithDetails(): Promise<CrudListResponse<VehicleWithDriver>> {
    try {
      const { data: vehicles, error } = await this.client
        .from('vehicles')
        .select(`
          *,
          driver:drivers!vehicles_driver_id_fkey(id, name, cpf, status),
          current_route:routes!routes_vehicle_id_fkey(id, name, status)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      const vehiclesWithDetails: VehicleWithDriver[] = (vehicles || []).map(vehicle => ({
        ...vehicle,
        driver: vehicle.driver || undefined,
        currentRoute: vehicle.current_route || undefined,
      }))

      return { data: vehiclesWithDetails, error: null, count: vehiclesWithDetails.length }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar veículos com detalhes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca veículo por placa
   */
  async findByPlate(plate: string): Promise<CrudResponse<VehicleRow>> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .select('*')
        .eq('plate', plate.toUpperCase())
        .single()

      if (error) {
        return { data: null, error: this.translateError(error.message) }
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: `Erro ao buscar veículo por placa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }
    }
  }

  /**
   * Busca veículos ativos
   */
  async findActive(): Promise<CrudListResponse<VehicleRow>> {
    return this.findAll({
      filters: { status: 'Ativo' },
      sort: { column: 'plate', ascending: true }
    })
  }

  /**
   * Busca veículos disponíveis (sem motorista ou rota)
   */
  async findAvailable(): Promise<CrudListResponse<VehicleRow>> {
    try {
      const { data, error } = await this.client
        .from('vehicles')
        .select('*')
        .eq('status', 'Ativo')
        .is('driver_id', null)
        .order('plate')

      if (error) {
        return { data: [], error: this.translateError(error.message) }
      }

      return { data: data || [], error: null, count: data?.length || 0 }
    } catch (error) {
      return {
        data: [],
        error: `Erro ao buscar veículos disponíveis: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        count: 0
      }
    }
  }

  /**
   * Busca veículos em manutenção
   */
  async findInMaintenance(): Promise<CrudListResponse<VehicleRow>> {
    return this.findAll({
      filters: { status: 'Manutenção' },
      sort: { column: 'plate', ascending: true }
    })
  }

  /**
   * Valida placa do veículo (formato brasileiro)
   */
  private validatePlate(plate: string): boolean {
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '').toUpperCase()
    
    // Formato antigo: ABC1234
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/
    // Formato Mercosul: ABC1D23
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
    
    return oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate)
  }

  // Métodos de validação removidos pois os campos year e capacity não existem na tabela

  /**
   * Cria um novo veículo com validação
   */
  async create(data: VehicleInsert): Promise<CrudResponse<VehicleRow>> {
    // Valida placa
    if (!this.validatePlate(data.plate)) {
      return { data: null, error: 'Placa inválida' }
    }

    // Capacidade não é um campo da tabela vehicles

    // Verifica se placa já existe
    const existingVehicle = await this.findByPlate(data.plate)
    if (existingVehicle.data) {
      return { data: null, error: 'Placa já cadastrada' }
    }

    // Normaliza a placa
    const vehicleData = {
      ...data,
      plate: data.plate.replace(/[^A-Z0-9]/g, '').toUpperCase()
    }

    return super.create(vehicleData)
  }

  /**
   * Atualiza veículo com validação
   */
  async update(id: string, data: VehicleUpdate): Promise<CrudResponse<VehicleRow>> {
    // Se está atualizando placa, valida
    if (data.plate && !this.validatePlate(data.plate)) {
      return { data: null, error: 'Placa inválida' }
    }

    // Campos year e capacity não existem na tabela vehicles

    // Se está atualizando placa, verifica se já existe
    if (data.plate) {
      const existingVehicle = await this.findByPlate(data.plate)
      if (existingVehicle.data && existingVehicle.data.id !== id) {
        return { data: null, error: 'Placa já cadastrada por outro veículo' }
      }
    }

    // Normaliza a placa se fornecida
    const vehicleData = data.plate 
      ? { ...data, plate: data.plate.replace(/[^A-Z0-9]/g, '').toUpperCase() }
      : data

    return super.update(id, vehicleData)
  }

  /**
   * Atribui motorista ao veículo
   */
  async assignDriver(vehicleId: string, driverId: string): Promise<CrudResponse<VehicleRow>> {
    const vehicle = await this.findById(vehicleId)
    if (!vehicle.data) {
      return { data: null, error: 'Veículo não encontrado' }
    }

    if (vehicle.data.driver_id) {
      return { data: null, error: 'Veículo já possui motorista atribuído' }
    }

    return this.update(vehicleId, { driver_id: driverId })
  }

  /**
   * Remove motorista do veículo
   */
  async unassignDriver(vehicleId: string): Promise<CrudResponse<VehicleRow>> {
    return this.update(vehicleId, { driver_id: null })
  }

  /**
   * Coloca veículo em manutenção
   */
  async setMaintenance(vehicleId: string, reason?: string): Promise<CrudResponse<VehicleRow>> {
    const updateData: VehicleUpdate = {
      status: 'Com Problema'
    }

    return this.update(vehicleId, updateData)
  }

  /**
   * Remove veículo da manutenção
   */
  async removeMaintenance(vehicleId: string): Promise<CrudResponse<VehicleRow>> {
    return this.update(vehicleId, {
      status: 'Garagem'
    })
  }

  /**
   * Busca veículos com filtros específicos
   */
  async findWithFilters(filters: VehicleFilters): Promise<CrudListResponse<VehicleRow>> {
    const searchFilters: any = {}

    if (filters.plate) {
      searchFilters.plate = `%${filters.plate.toUpperCase()}%`
    }
    if (filters.model) {
      searchFilters.model = `%${filters.model}%`
    }
    if (filters.brand) {
      searchFilters.brand = `%${filters.brand}%`
    }
    if (filters.status) {
      searchFilters.status = filters.status
    }
    if (filters.type) {
      searchFilters.type = filters.type
    }
    if (filters.year) {
      searchFilters.year = filters.year
    }
    if (filters.capacity) {
      searchFilters.capacity = filters.capacity
    }
    if (filters.fuel_type) {
      searchFilters.fuel_type = filters.fuel_type
    }

    return this.findAll({
      filters: searchFilters,
      sort: { column: 'plate', ascending: true }
    })
  }

  /**
   * Obtém estatísticas dos veículos
   */
  async getStats(): Promise<CrudResponse<{
    total: number
    active: number
    inactive: number
    inMaintenance: number
    available: number
    withDriver: number
  }>> {
    try {
      const [
        totalResult,
        activeResult,
        inactiveResult,
        maintenanceResult,
        availableResult
      ] = await Promise.all([
        this.count(),
        this.count({ status: 'Ativo' }),
        this.count({ status: 'Inativo' }),
        this.count({ status: 'Manutenção' }),
        this.findAvailable()
      ])

      // Busca todos os veículos para calcular estatísticas detalhadas
      const allVehicles = await this.findAll()
      
      if (allVehicles.error) {
        return { data: null, error: allVehicles.error }
      }

      const vehicles = allVehicles.data
      const currentYear = new Date().getFullYear()

      const withDriver = vehicles.filter(vehicle => vehicle.driver_id).length

      // Estatísticas por type, fuel_type e brand não disponíveis (campos não existem)
      // Campos year e capacity também não existem

      return {
        data: {
          total: totalResult.data || 0,
          active: activeResult.data || 0,
          inactive: inactiveResult.data || 0,
          inMaintenance: maintenanceResult.data || 0,
          available: availableResult.count || 0,
          withDriver
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
export const vehiclesService = new VehiclesService()