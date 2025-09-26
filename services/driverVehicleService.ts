import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// Tipos baseados no schema do Supabase
export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type DriverInsert = Database['public']['Tables']['drivers']['Insert'];
export type DriverUpdate = Database['public']['Tables']['drivers']['Update'];

export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

// Tipos de performance removidos - tabela não existe no schema

// Interfaces para compatibilidade com o código existente
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  status: 'active' | 'inactive' | 'suspended';
  vehicleId?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  capacity: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  status: 'available' | 'in_use' | 'maintenance' | 'inactive';
  currentDriverId?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverPerformance {
  id: string;
  driverId: string;
  date: Date;
  routesCompleted: number;
  totalDistance: number;
  totalDuration: number;
  fuelConsumed: number;
  averageSpeed: number;
  safetyScore: number;
  punctualityScore: number;
  customerRating: number;
  incidents: number;
}

export interface CreateDriverData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: Date;
  companyId: string;
  vehicleId?: string;
}

export interface UpdateDriverData {
  name?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  status?: Driver['status'];
  vehicleId?: string;
}

export interface CreateVehicleData {
  plate: string;
  model: string;
  brand: string;
  year: number;
  capacity: number;
  fuelType: Vehicle['fuelType'];
  companyId: string;
}

export interface UpdateVehicleData {
  plate?: string;
  model?: string;
  brand?: string;
  year?: number;
  capacity?: number;
  fuelType?: Vehicle['fuelType'];
  status?: Vehicle['status'];
  currentDriverId?: string;
}

export class DriverVehicleService {
  private static instance: DriverVehicleService;

  public static getInstance(): DriverVehicleService {
    if (!DriverVehicleService.instance) {
      DriverVehicleService.instance = new DriverVehicleService();
    }
    return DriverVehicleService.instance;
  }

  /**
   * Converte motorista do Supabase para o formato esperado
   */
  private convertDriverFromDB(dbDriver: DriverRow): Driver {
    return {
      id: dbDriver.id,
      name: dbDriver.name,
      email: dbDriver.email,
      phone: dbDriver.phone,
      licenseNumber: dbDriver.cnh, // Campo correto é 'cnh'
      licenseExpiry: new Date(dbDriver.cnh_validity), // Campo correto é 'cnh_validity'
      status: dbDriver.status === 'Ativo' ? 'active' : 'inactive', // Mapeamento de status
      vehicleId: undefined, // Não há vehicle_id na tabela drivers
      companyId: dbDriver.linked_company, // Campo correto é 'linked_company'
      createdAt: new Date(dbDriver.created_at),
      updatedAt: new Date(dbDriver.updated_at)
    };
  }

  /**
   * Converte veículo do Supabase para o formato esperado
   */
  private convertVehicleFromDB(dbVehicle: VehicleRow): Vehicle {
    return {
      id: dbVehicle.id,
      plate: dbVehicle.plate,
      model: dbVehicle.model,
      brand: 'N/A', // Campo não existe na tabela
      year: 2020, // Campo não existe na tabela
      capacity: 20, // Campo não existe na tabela
      fuelType: 'diesel', // Campo não existe na tabela
      status: this.mapVehicleStatus(dbVehicle.status),
      currentDriverId: dbVehicle.driver_id || undefined,
      companyId: 'N/A', // Campo não existe na tabela vehicles
      createdAt: new Date(dbVehicle.created_at),
      updatedAt: new Date(dbVehicle.updated_at)
    };
  }

  // Método convertDriverPerformanceFromDB removido - tabela não existe no schema

  /**
   * Mapeia status do veículo da tabela para o formato esperado
   */
  private mapVehicleStatus(dbStatus: 'Em Movimento' | 'Parado' | 'Com Problema' | 'Garagem'): Vehicle['status'] {
    switch (dbStatus) {
      case 'Em Movimento':
        return 'in_use';
      case 'Parado':
        return 'available';
      case 'Com Problema':
        return 'maintenance';
      case 'Garagem':
        return 'inactive';
      default:
        return 'available';
    }
  }

  // === MÉTODOS PARA MOTORISTAS ===

  /**
   * Obtém todos os motoristas de uma empresa
   */
  async getDrivers(companyId: string): Promise<Driver[]> {
    try {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('linked_company', companyId)
        .order('name');

      if (error) throw error;

      return (drivers || []).map(d => this.convertDriverFromDB(d));
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      throw error;
    }
  }

  /**
   * Obtém motorista por ID
   */
  async getDriver(driverId: string): Promise<Driver | null> {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.convertDriverFromDB(driver);
    } catch (error) {
      console.error('Erro ao buscar motorista:', error);
      throw error;
    }
  }

  /**
   * Cria novo motorista
   */
  async createDriver(driverData: CreateDriverData): Promise<Driver> {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .insert({
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          cnh: driverData.licenseNumber,
          cnh_validity: driverData.licenseExpiry.toISOString(),
          linked_company: driverData.companyId,
          status: 'Ativo'
        })
        .select()
        .single();

      if (error) throw error;

      // Se foi atribuído um veículo, atualiza o veículo
      if (driverData.vehicleId) {
        await this.assignVehicleToDriver(driverData.vehicleId, driver.id);
      }

      return this.convertDriverFromDB(driver);
    } catch (error) {
      console.error('Erro ao criar motorista:', error);
      throw error;
    }
  }

  /**
   * Atualiza motorista
   */
  async updateDriver(driverId: string, updateData: UpdateDriverData): Promise<Driver> {
    try {
      const updatePayload: Partial<DriverUpdate> = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.email) updatePayload.email = updateData.email;
      if (updateData.phone) updatePayload.phone = updateData.phone;
      if (updateData.licenseNumber) updatePayload.cnh = updateData.licenseNumber;
      if (updateData.licenseExpiry) updatePayload.cnh_validity = updateData.licenseExpiry.toISOString();
      if (updateData.status) {
        // Mapear status para o formato da tabela
        updatePayload.status = updateData.status === 'active' ? 'Ativo' : 'Inativo';
      }

      const { data: driver, error } = await supabase
        .from('drivers')
        .update(updatePayload)
        .eq('id', driverId)
        .select()
        .single();

      if (error) throw error;

      return this.convertDriverFromDB(driver);
    } catch (error) {
      console.error('Erro ao atualizar motorista:', error);
      throw error;
    }
  }

  /**
   * Deleta motorista
   */
  async deleteDriver(driverId: string): Promise<void> {
    try {
      // Remove associação com veículo
      await supabase
        .from('vehicles')
        .update({ current_driver_id: null })
        .eq('current_driver_id', driverId);

      // Remove o motorista
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar motorista:', error);
      throw error;
    }
  }

  /**
   * Obtém motoristas disponíveis (sem veículo atribuído)
   */
  async getAvailableDrivers(companyId: string): Promise<Driver[]> {
    try {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('linked_company', companyId)
        .eq('status', 'Ativo')
        .order('name');

      if (error) throw error;

      return (drivers || []).map(d => this.convertDriverFromDB(d));
    } catch (error) {
      console.error('Erro ao buscar motoristas disponíveis:', error);
      throw error;
    }
  }

  // === MÉTODOS PARA VEÍCULOS ===

  /**
   * Obtém todos os veículos de uma empresa
   */
  async getVehicles(companyId: string): Promise<Vehicle[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        // Campo company_id não existe na tabela
        .order('plate');

      if (error) throw error;

      return (vehicles || []).map(v => this.convertVehicleFromDB(v));
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }
  }

  /**
   * Obtém veículo por ID
   */
  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.convertVehicleFromDB(vehicle);
    } catch (error) {
      console.error('Erro ao buscar veículo:', error);
      throw error;
    }
  }

  /**
   * Cria novo veículo
   */
  async createVehicle(vehicleData: CreateVehicleData): Promise<Vehicle> {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({
          plate: vehicleData.plate,
          model: vehicleData.model,
          // Campos brand, year, capacity, fuel_type, company_id não existem na tabela
          status: 'Parado' // Status padrão para veículo disponível
        })
        .select()
        .single();

      if (error) throw error;

      return this.convertVehicleFromDB(vehicle);
    } catch (error) {
      console.error('Erro ao criar veículo:', error);
      throw error;
    }
  }

  /**
   * Atualiza veículo
   */
  async updateVehicle(vehicleId: string, updateData: UpdateVehicleData): Promise<Vehicle> {
    try {
      const updatePayload: Partial<VehicleUpdate> = {};
      
      if (updateData.plate) updatePayload.plate = updateData.plate;
      if (updateData.model) updatePayload.model = updateData.model;
      // Campos brand, year, capacity, fuelType não existem na tabela vehicles
      if (updateData.status) {
        // Mapear status para os valores da tabela
        switch (updateData.status) {
          case 'available':
            updatePayload.status = 'Parado';
            break;
          case 'in_use':
            updatePayload.status = 'Em Movimento';
            break;
          case 'maintenance':
            updatePayload.status = 'Com Problema';
            break;
          case 'inactive':
            updatePayload.status = 'Garagem';
            break;
        }
      }
      if (updateData.currentDriverId !== undefined) updatePayload.driver_id = updateData.currentDriverId;

      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) throw error;

      return this.convertVehicleFromDB(vehicle);
    } catch (error) {
      console.error('Erro ao atualizar veículo:', error);
      throw error;
    }
  }

  /**
   * Deleta veículo
   */
  async deleteVehicle(vehicleId: string): Promise<void> {
    try {
      // Remove associação com motorista
      await supabase
        .from('drivers')
        .update({ vehicle_id: null })
        .eq('vehicle_id', vehicleId);

      // Remove o veículo
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar veículo:', error);
      throw error;
    }
  }

  /**
   * Obtém veículos disponíveis (sem motorista atribuído)
   */
  async getAvailableVehicles(companyId: string): Promise<Vehicle[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        // Campo company_id não existe na tabela
        .eq('status', 'Parado') // Status para veículo disponível
        .is('driver_id', null)
        .order('plate');

      if (error) throw error;

      return (vehicles || []).map(v => this.convertVehicleFromDB(v));
    } catch (error) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      throw error;
    }
  }

  // === MÉTODOS DE ASSOCIAÇÃO ===

  /**
   * Atribui veículo a motorista
   */
  async assignVehicleToDriver(vehicleId: string, driverId: string): Promise<void> {
    try {
      // Atualiza o veículo
      await this.updateVehicle(vehicleId, {
        currentDriverId: driverId,
        status: 'in_use'
      });

      // Atualiza o motorista
      await this.updateDriver(driverId, {
        vehicleId: vehicleId
      });
    } catch (error) {
      console.error('Erro ao atribuir veículo ao motorista:', error);
      throw error;
    }
  }

  /**
   * Remove atribuição de veículo de motorista
   */
  async unassignVehicleFromDriver(vehicleId: string, driverId: string): Promise<void> {
    try {
      // Atualiza o veículo
      await this.updateVehicle(vehicleId, {
        currentDriverId: undefined,
        status: 'available'
      });

      // Atualiza o motorista
      await this.updateDriver(driverId, {
        vehicleId: undefined
      });
    } catch (error) {
      console.error('Erro ao remover atribuição de veículo:', error);
      throw error;
    }
  }

  // === MÉTODOS DE PERFORMANCE ===

  // Métodos de performance comentados - tabela driver_performance não existe no schema
  /*
  async recordDriverPerformance(performanceData: Omit<DriverPerformance, 'id'>): Promise<DriverPerformance> {
    // Implementação removida - tabela não existe
    throw new Error('Funcionalidade de performance não implementada');
  }

  async getDriverPerformance(driverId: string, startDate?: Date, endDate?: Date): Promise<DriverPerformance[]> {
    // Implementação removida - tabela não existe
    return [];
  }
  */

  /**
   * Obtém estatísticas de motoristas de uma empresa
   */
  async getDriverStats(companyId: string): Promise<{
    totalDrivers: number;
    activeDrivers: number;
    inactiveDrivers: number;
    suspendedDrivers: number;
    driversWithVehicles: number;
    driversWithoutVehicles: number;
    averagePerformanceScore: number;
  }> {
    try {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('linked_company', companyId);

      if (error) throw error;

      const stats = {
        totalDrivers: drivers?.length || 0,
        activeDrivers: drivers?.filter(d => d.status === 'Ativo').length || 0,
        inactiveDrivers: drivers?.filter(d => d.status === 'Inativo').length || 0,
        suspendedDrivers: 0, // Não há status suspenso na tabela
        driversWithVehicles: 0, // Não há vehicle_id na tabela drivers
        driversWithoutVehicles: drivers?.length || 0,
        averagePerformanceScore: 0 // Performance não implementada
      };

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de motoristas:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de veículos de uma empresa
   */
  async getVehicleStats(companyId: string): Promise<{
    totalVehicles: number;
    availableVehicles: number;
    inUseVehicles: number;
    maintenanceVehicles: number;
    inactiveVehicles: number;
    averageCapacity: number;
    fuelTypeDistribution: Record<string, number>;
  }> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*');
        // Campo company_id não existe na tabela

      if (error) throw error;

      const stats = {
        totalVehicles: vehicles?.length || 0,
        availableVehicles: vehicles?.filter(v => v.status === 'Parado').length || 0,
        inUseVehicles: vehicles?.filter(v => v.status === 'Em Movimento').length || 0,
        maintenanceVehicles: vehicles?.filter(v => v.status === 'Com Problema').length || 0,
        inactiveVehicles: vehicles?.filter(v => v.status === 'Garagem').length || 0,
        averageCapacity: 20, // Valor padrão já que o campo não existe
        fuelTypeDistribution: { 'diesel': vehicles?.length || 0 } as Record<string, number>
      };

      // Campos capacity e fuel_type não existem na tabela vehicles

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de veículos:', error);
      throw error;
    }
  }
}

// Instância singleton
export const driverVehicleService = DriverVehicleService.getInstance();