import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos específicos para veículos
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  capacity: number;
  type: 'van' | 'micro-ônibus' | 'ônibus';
  fuelType: 'gasolina' | 'etanol' | 'diesel' | 'flex';
  status: 'Disponível' | 'Em uso' | 'Manutenção' | 'Inativo';
  color: string;
  chassisNumber: string;
  renavam: string;
  companyId: string;
  driverId?: string;
  currentRouteId?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceKm?: number;
  currentKm: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleInsert extends Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'> {}

export interface VehicleUpdate extends Partial<Omit<Vehicle, 'id' | 'createdAt'>> {}

export interface VehicleWithDriver extends Vehicle {
  driver?: {
    id: string;
    name: string;
    cpf: string;
    status: string;
  };
  currentRoute?: {
    id: string;
    name: string;
    status: string;
  };
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  maintenance?: {
    lastMaintenance: Date;
    nextMaintenance: Date;
    status: string;
  };
}

export interface VehicleFilters {
  plate?: string;
  model?: string;
  brand?: string;
  status?: 'Disponível' | 'Em uso' | 'Manutenção' | 'Inativo';
  type?: 'van' | 'micro-ônibus' | 'ônibus';
  year?: number;
  capacity?: number;
  fuelType?: 'gasolina' | 'etanol' | 'diesel' | 'flex';
  companyId?: string;
}

export interface VehicleLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  accuracy: number;
}

export interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  type: 'preventiva' | 'corretiva' | 'revisão';
  description: string;
  cost: number;
  date: Date;
  nextMaintenanceKm?: number;
  nextMaintenanceDate?: Date;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VehiclesService extends BaseCrudService<Vehicle> {
  constructor() {
    super('vehicles');
  }

  /**
   * Busca veículos com motoristas e rotas
   */
  async findAllWithDetails(): Promise<CrudListResponse<VehicleWithDriver>> {
    try {
      const vehiclesResult = await this.list();
      
      if (vehiclesResult.error) {
        return vehiclesResult as CrudListResponse<VehicleWithDriver>;
      }

      const vehiclesWithDetails: VehicleWithDriver[] = [];

      for (const vehicle of vehiclesResult.data) {
        const details = await this.getVehicleDetails(vehicle.id);
        
        vehiclesWithDetails.push({
          ...vehicle,
          ...details
        });
      }

      return {
        data: vehiclesWithDetails,
        error: null,
        count: vehiclesWithDetails.length,
        totalCount: vehiclesWithDetails.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar veículos com detalhes:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar veículos com detalhes'
      };
    }
  }

  /**
   * Busca detalhes de um veículo específico
   */
  async getVehicleDetails(vehicleId: string): Promise<{
    driver?: { id: string; name: string; cpf: string; status: string };
    currentRoute?: { id: string; name: string; status: string };
    lastLocation?: { latitude: number; longitude: number; timestamp: Date };
    maintenance?: { lastMaintenance: Date; nextMaintenance: Date; status: string };
  }> {
    try {
      const vehicle = await this.getById(vehicleId);
      
      if (vehicle.error || !vehicle.data) {
        return {};
      }

      const details: any = {};

      // Buscar motorista se associado
      if (vehicle.data.driverId) {
        const driverDoc = await getDoc(doc(db, 'drivers', vehicle.data.driverId));
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();
          details.driver = {
            id: driverDoc.id,
            name: driverData.name,
            cpf: driverData.cpf,
            status: driverData.status
          };
        }
      }

      // Buscar rota atual se associada
      if (vehicle.data.currentRouteId) {
        const routeDoc = await getDoc(doc(db, 'routes', vehicle.data.currentRouteId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          details.currentRoute = {
            id: routeDoc.id,
            name: routeData.name,
            status: routeData.status
          };
        }
      }

      // Buscar última localização
      const lastLocation = await this.getLastLocation(vehicleId);
      if (lastLocation.data) {
        details.lastLocation = {
          latitude: lastLocation.data.latitude,
          longitude: lastLocation.data.longitude,
          timestamp: lastLocation.data.timestamp
        };
      }

      // Buscar informações de manutenção
      details.maintenance = {
        lastMaintenance: vehicle.data.lastMaintenanceDate || new Date(0),
        nextMaintenance: vehicle.data.nextMaintenanceDate || new Date(),
        status: this.getMaintenanceStatus(vehicle.data)
      };

      return details;
    } catch (error) {
      console.error('Erro ao buscar detalhes do veículo:', error);
      return {};
    }
  }

  /**
   * Busca veículos por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<Vehicle>> {
    try {
      return await this.findWhere('companyId', '==', companyId);
    } catch (error: any) {
      console.error('Erro ao buscar veículos por empresa:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar veículos por empresa'
      };
    }
  }

  /**
   * Busca veículos disponíveis
   */
  async findAvailableVehicles(companyId?: string): Promise<CrudListResponse<Vehicle>> {
    try {
      if (companyId) {
        // Buscar veículos disponíveis de uma empresa específica
        const q = query(
          collection(db, 'vehicles'),
          where('status', '==', 'Disponível'),
          where('companyId', '==', companyId)
        );
        
        const snapshot = await getDocs(q);
        const vehicles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Vehicle[];

        return {
          data: vehicles,
          error: null,
          count: vehicles.length,
          totalCount: vehicles.length
        };
      } else {
        return await this.findWhere('status', '==', 'Disponível');
      }
    } catch (error: any) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar veículos disponíveis'
      };
    }
  }

  /**
   * Busca veículo por placa
   */
  async findByPlate(plate: string): Promise<CrudResponse<Vehicle>> {
    try {
      const result = await this.findWhere('plate', '==', plate.toUpperCase());
      
      if (result.error) {
        return {
          data: null,
          error: result.error
        };
      }

      if (result.data.length === 0) {
        return {
          data: null,
          error: 'Veículo não encontrado'
        };
      }

      return {
        data: result.data[0],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar veículo por placa:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar veículo'
      };
    }
  }

  /**
   * Associa motorista a um veículo
   */
  async assignDriver(vehicleId: string, driverId: string): Promise<CrudResponse<Vehicle>> {
    try {
      // Verificar se o motorista existe e está disponível
      const driverDoc = await getDoc(doc(db, 'drivers', driverId));
      if (!driverDoc.exists()) {
        return {
          data: null,
          error: 'Motorista não encontrado'
        };
      }

      const driverData = driverDoc.data();
      if (driverData.status !== 'Ativo') {
        return {
          data: null,
          error: 'Motorista não está ativo'
        };
      }

      // Atualizar veículo
      const vehicleResult = await this.update(vehicleId, { 
        driverId,
        status: 'Em uso'
      });
      
      if (vehicleResult.error) {
        return vehicleResult;
      }

      // Atualizar motorista
      await updateDoc(doc(db, 'drivers', driverId), {
        vehicleId: vehicleId,
        updatedAt: serverTimestamp()
      });

      return vehicleResult;
    } catch (error: any) {
      console.error('Erro ao associar motorista ao veículo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao associar motorista'
      };
    }
  }

  /**
   * Remove associação de motorista do veículo
   */
  async unassignDriver(vehicleId: string): Promise<CrudResponse<Vehicle>> {
    try {
      const vehicle = await this.getById(vehicleId);
      
      if (vehicle.error || !vehicle.data) {
        return {
          data: null,
          error: 'Veículo não encontrado'
        };
      }

      const driverId = vehicle.data.driverId;

      // Atualizar veículo
      const vehicleResult = await this.update(vehicleId, { 
        driverId: null,
        status: 'Disponível'
      });
      
      if (vehicleResult.error) {
        return vehicleResult;
      }

      // Atualizar motorista se existir
      if (driverId) {
        await updateDoc(doc(db, 'drivers', driverId), {
          vehicleId: null,
          updatedAt: serverTimestamp()
        });
      }

      return vehicleResult;
    } catch (error: any) {
      console.error('Erro ao remover associação de motorista:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover associação de motorista'
      };
    }
  }

  /**
   * Atualiza localização do veículo
   */
  async updateLocation(vehicleId: string, location: Omit<VehicleLocation, 'vehicleId'>): Promise<CrudResponse<VehicleLocation>> {
    try {
      const locationData: VehicleLocation = {
        vehicleId,
        ...location,
        timestamp: new Date()
      };

      // Salvar no subcoleção de localizações
      const locationRef = doc(collection(db, 'vehicle_locations'));
      await updateDoc(locationRef, {
        ...locationData,
        createdAt: serverTimestamp()
      });

      return {
        data: locationData,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao atualizar localização do veículo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar localização'
      };
    }
  }

  /**
   * Busca última localização do veículo
   */
  async getLastLocation(vehicleId: string): Promise<CrudResponse<VehicleLocation>> {
    try {
      const q = query(
        collection(db, 'vehicle_locations'),
        where('vehicleId', '==', vehicleId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          data: null,
          error: 'Localização não encontrada'
        };
      }

      const locationData = snapshot.docs[0].data() as VehicleLocation;

      return {
        data: locationData,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar última localização:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar localização'
      };
    }
  }

  /**
   * Agenda manutenção do veículo
   */
  async scheduleMaintenance(vehicleId: string, maintenance: Omit<VehicleMaintenance, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt'>): Promise<CrudResponse<VehicleMaintenance>> {
    try {
      const maintenanceData: Omit<VehicleMaintenance, 'id'> = {
        vehicleId,
        ...maintenance,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Salvar manutenção
      const maintenanceRef = doc(collection(db, 'vehicle_maintenance'));
      await updateDoc(maintenanceRef, {
        ...maintenanceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Atualizar status do veículo se necessário
      if (maintenance.status === 'em_andamento') {
        await this.update(vehicleId, { status: 'Manutenção' });
      }

      return {
        data: { id: maintenanceRef.id, ...maintenanceData } as VehicleMaintenance,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao agendar manutenção:', error);
      return {
        data: null,
        error: error.message || 'Erro ao agendar manutenção'
      };
    }
  }

  /**
   * Valida placa do veículo
   */
  validatePlate(plate: string): boolean {
    // Remove espaços e converte para maiúsculo
    const cleanPlate = plate.replace(/\s/g, '').toUpperCase();
    
    // Formato antigo: ABC-1234
    const oldFormat = /^[A-Z]{3}-?\d{4}$/;
    
    // Formato Mercosul: ABC1D23
    const mercosulFormat = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    
    return oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate);
  }

  /**
   * Formata placa do veículo
   */
  formatPlate(plate: string): string {
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    
    if (cleanPlate.length === 7) {
      // Formato antigo: ABC1234 -> ABC-1234
      if (/^[A-Z]{3}\d{4}$/.test(cleanPlate)) {
        return cleanPlate.replace(/^([A-Z]{3})(\d{4})$/, '$1-$2');
      }
      // Formato Mercosul: ABC1D23 -> ABC1D23
      if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(cleanPlate)) {
        return cleanPlate;
      }
    }
    
    return plate;
  }

  /**
   * Verifica se placa já está em uso
   */
  async isPlateInUse(plate: string, excludeVehicleId?: string): Promise<boolean> {
    try {
      const result = await this.findByPlate(plate);
      
      if (result.error || !result.data) {
        return false;
      }

      // Se excluir um veículo específico (para updates)
      if (excludeVehicleId && result.data.id === excludeVehicleId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar placa:', error);
      return false;
    }
  }

  /**
   * Busca veículos com filtros avançados
   */
  async findWithFilters(filters: VehicleFilters): Promise<CrudListResponse<Vehicle>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      const allVehicles = await this.list();
      
      if (allVehicles.error) {
        return allVehicles;
      }

      const filteredData = allVehicles.data.filter(vehicle => {
        if (filters.plate && !vehicle.plate.toLowerCase().includes(filters.plate.toLowerCase())) {
          return false;
        }
        if (filters.model && !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())) {
          return false;
        }
        if (filters.brand && !vehicle.brand.toLowerCase().includes(filters.brand.toLowerCase())) {
          return false;
        }
        if (filters.status && vehicle.status !== filters.status) {
          return false;
        }
        if (filters.type && vehicle.type !== filters.type) {
          return false;
        }
        if (filters.year && vehicle.year !== filters.year) {
          return false;
        }
        if (filters.capacity && vehicle.capacity !== filters.capacity) {
          return false;
        }
        if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
          return false;
        }
        if (filters.companyId && vehicle.companyId !== filters.companyId) {
          return false;
        }
        return true;
      });

      return {
        data: filteredData,
        error: null,
        count: filteredData.length,
        totalCount: filteredData.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar veículos com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar veículos'
      };
    }
  }

  /**
   * Atualiza status do veículo
   */
  async updateStatus(vehicleId: string, status: 'Disponível' | 'Em uso' | 'Manutenção' | 'Inativo'): Promise<CrudResponse<Vehicle>> {
    try {
      return await this.update(vehicleId, { status });
    } catch (error: any) {
      console.error('Erro ao atualizar status do veículo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Busca veículos próximos à manutenção
   */
  async findMaintenanceDue(days: number = 30): Promise<CrudListResponse<Vehicle>> {
    try {
      const allVehicles = await this.list();
      
      if (allVehicles.error) {
        return allVehicles;
      }

      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() + days);

      const maintenanceDue = allVehicles.data.filter(vehicle => {
        if (!vehicle.nextMaintenanceDate) return false;
        const nextMaintenance = new Date(vehicle.nextMaintenanceDate);
        return nextMaintenance <= maintenanceDate;
      });

      return {
        data: maintenanceDue,
        error: null,
        count: maintenanceDue.length,
        totalCount: maintenanceDue.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar veículos próximos à manutenção:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar veículos próximos à manutenção'
      };
    }
  }

  /**
   * Determina status de manutenção do veículo
   */
  private getMaintenanceStatus(vehicle: Vehicle): string {
    if (!vehicle.nextMaintenanceDate) return 'indefinido';
    
    const today = new Date();
    const nextMaintenance = new Date(vehicle.nextMaintenanceDate);
    const diffDays = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'atrasada';
    if (diffDays <= 7) return 'urgente';
    if (diffDays <= 30) return 'próxima';
    return 'em_dia';
  }

  /**
   * Atualiza quilometragem do veículo
   */
  async updateKilometers(vehicleId: string, currentKm: number): Promise<CrudResponse<Vehicle>> {
    try {
      return await this.update(vehicleId, { currentKm });
    } catch (error: any) {
      console.error('Erro ao atualizar quilometragem:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar quilometragem'
      };
    }
  }
}

export const vehiclesService = new VehiclesService();
export default vehiclesService;