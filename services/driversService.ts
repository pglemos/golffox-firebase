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

// Tipos específicos para motoristas
export interface Driver {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: Date;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cnhNumber: string;
  cnhCategory: 'D' | 'E';
  cnhExpiry: Date;
  status: 'Ativo' | 'Em análise' | 'Inativo';
  contractType: 'CLT' | 'terceirizado' | 'autônomo';
  salary?: number;
  availability: string;
  companyId: string;
  vehicleId?: string;
  currentRouteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverInsert extends Omit<Driver, 'id' | 'createdAt' | 'updatedAt'> {}

export interface DriverUpdate extends Partial<Omit<Driver, 'id' | 'createdAt'>> {}

export interface DriverWithVehicle extends Driver {
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    status: string;
  };
  currentRoute?: {
    id: string;
    name: string;
    status: string;
  };
  performance?: {
    punctuality: number;
    totalRoutes: number;
    completedRoutes: number;
  };
}

export interface DriverFilters {
  name?: string;
  cpf?: string;
  email?: string;
  status?: 'Ativo' | 'Em análise' | 'Inativo';
  companyId?: string;
  cnhCategory?: 'D' | 'E';
  contractType?: 'CLT' | 'terceirizado' | 'autônomo';
  availability?: string;
}

export interface DriverPerformance {
  driverId: string;
  punctuality: number;
  totalRoutes: number;
  completedRoutes: number;
  averageRating: number;
  totalKm: number;
  fuelEfficiency: number;
  incidentCount: number;
  lastRouteDate: Date;
}

export class DriversService extends BaseCrudService<Driver> {
  constructor() {
    super('drivers');
  }

  /**
   * Busca motoristas com veículos e rotas
   */
  async findAllWithDetails(): Promise<CrudListResponse<DriverWithVehicle>> {
    try {
      const driversResult = await this.list();
      
      if (driversResult.error) {
        return driversResult as CrudListResponse<DriverWithVehicle>;
      }

      const driversWithDetails: DriverWithVehicle[] = [];

      for (const driver of driversResult.data) {
        const details = await this.getDriverDetails(driver.id);
        
        driversWithDetails.push({
          ...driver,
          ...details
        });
      }

      return {
        data: driversWithDetails,
        error: null,
        count: driversWithDetails.length,
        totalCount: driversWithDetails.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar motoristas com detalhes:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar motoristas com detalhes'
      };
    }
  }

  /**
   * Busca detalhes de um motorista específico
   */
  async getDriverDetails(driverId: string): Promise<{
    vehicle?: { id: string; plate: string; model: string; status: string };
    currentRoute?: { id: string; name: string; status: string };
    performance?: { punctuality: number; totalRoutes: number; completedRoutes: number };
  }> {
    try {
      const driver = await this.getById(driverId);
      
      if (driver.error || !driver.data) {
        return {};
      }

      const details: any = {};

      // Buscar veículo se associado
      if (driver.data.vehicleId) {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', driver.data.vehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data();
          details.vehicle = {
            id: vehicleDoc.id,
            plate: vehicleData.plate,
            model: vehicleData.model,
            status: vehicleData.status
          };
        }
      }

      // Buscar rota atual se associada
      if (driver.data.currentRouteId) {
        const routeDoc = await getDoc(doc(db, 'routes', driver.data.currentRouteId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          details.currentRoute = {
            id: routeDoc.id,
            name: routeData.name,
            status: routeData.status
          };
        }
      }

      // Buscar performance
      const performance = await this.getDriverPerformance(driverId);
      if (performance.data) {
        details.performance = {
          punctuality: performance.data.punctuality,
          totalRoutes: performance.data.totalRoutes,
          completedRoutes: performance.data.completedRoutes
        };
      }

      return details;
    } catch (error) {
      console.error('Erro ao buscar detalhes do motorista:', error);
      return {};
    }
  }

  /**
   * Busca motoristas por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<Driver>> {
    try {
      return await this.findWhere('companyId', '==', companyId);
    } catch (error: any) {
      console.error('Erro ao buscar motoristas por empresa:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar motoristas por empresa'
      };
    }
  }

  /**
   * Busca motoristas ativos
   */
  async findActiveDrivers(companyId?: string): Promise<CrudListResponse<Driver>> {
    try {
      if (companyId) {
        // Buscar motoristas ativos de uma empresa específica
        const q = query(
          collection(db, 'drivers'),
          where('status', '==', 'Ativo'),
          where('companyId', '==', companyId)
        );
        
        const snapshot = await getDocs(q);
        const drivers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Driver[];

        return {
          data: drivers,
          error: null,
          count: drivers.length,
          totalCount: drivers.length
        };
      } else {
        return await this.findWhere('status', '==', 'Ativo');
      }
    } catch (error: any) {
      console.error('Erro ao buscar motoristas ativos:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar motoristas ativos'
      };
    }
  }

  /**
   * Busca motoristas disponíveis (sem veículo ou rota)
   */
  async findAvailableDrivers(companyId: string): Promise<CrudListResponse<Driver>> {
    try {
      const q = query(
        collection(db, 'drivers'),
        where('companyId', '==', companyId),
        where('status', '==', 'Ativo')
      );
      
      const snapshot = await getDocs(q);
      const allDrivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];

      // Filtrar motoristas disponíveis (sem veículo ou rota atual)
      const availableDrivers = allDrivers.filter(driver => 
        !driver.vehicleId && !driver.currentRouteId
      );

      return {
        data: availableDrivers,
        error: null,
        count: availableDrivers.length,
        totalCount: availableDrivers.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar motoristas disponíveis:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar motoristas disponíveis'
      };
    }
  }

  /**
   * Busca motorista por CPF
   */
  async findByCpf(cpf: string): Promise<CrudResponse<Driver>> {
    try {
      const result = await this.findWhere('cpf', '==', cpf);
      
      if (result.error) {
        return {
          data: null,
          error: result.error
        };
      }

      if (result.data.length === 0) {
        return {
          data: null,
          error: 'Motorista não encontrado'
        };
      }

      return {
        data: result.data[0],
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar motorista por CPF:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar motorista'
      };
    }
  }

  /**
   * Associa motorista a um veículo
   */
  async assignVehicle(driverId: string, vehicleId: string): Promise<CrudResponse<Driver>> {
    try {
      // Verificar se o veículo existe e está disponível
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (!vehicleDoc.exists()) {
        return {
          data: null,
          error: 'Veículo não encontrado'
        };
      }

      const vehicleData = vehicleDoc.data();
      if (vehicleData.status !== 'Disponível') {
        return {
          data: null,
          error: 'Veículo não está disponível'
        };
      }

      // Atualizar motorista
      const driverResult = await this.update(driverId, { vehicleId });
      
      if (driverResult.error) {
        return driverResult;
      }

      // Atualizar status do veículo
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        status: 'Em uso',
        driverId: driverId,
        updatedAt: serverTimestamp()
      });

      return driverResult;
    } catch (error: any) {
      console.error('Erro ao associar veículo ao motorista:', error);
      return {
        data: null,
        error: error.message || 'Erro ao associar veículo'
      };
    }
  }

  /**
   * Remove associação de veículo do motorista
   */
  async unassignVehicle(driverId: string): Promise<CrudResponse<Driver>> {
    try {
      const driver = await this.getById(driverId);
      
      if (driver.error || !driver.data) {
        return {
          data: null,
          error: 'Motorista não encontrado'
        };
      }

      const vehicleId = driver.data.vehicleId;

      // Atualizar motorista
      const driverResult = await this.update(driverId, { vehicleId: null });
      
      if (driverResult.error) {
        return driverResult;
      }

      // Atualizar status do veículo se existir
      if (vehicleId) {
        await updateDoc(doc(db, 'vehicles', vehicleId), {
          status: 'Disponível',
          driverId: null,
          updatedAt: serverTimestamp()
        });
      }

      return driverResult;
    } catch (error: any) {
      console.error('Erro ao remover associação de veículo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover associação de veículo'
      };
    }
  }

  /**
   * Busca performance de um motorista
   */
  async getDriverPerformance(driverId: string): Promise<CrudResponse<DriverPerformance>> {
    try {
      // Buscar dados de performance do motorista
      const performanceDoc = await getDoc(doc(db, 'driver_performance', driverId));
      
      if (!performanceDoc.exists()) {
        // Criar performance inicial se não existir
        const initialPerformance: DriverPerformance = {
          driverId,
          punctuality: 0,
          totalRoutes: 0,
          completedRoutes: 0,
          averageRating: 0,
          totalKm: 0,
          fuelEfficiency: 0,
          incidentCount: 0,
          lastRouteDate: new Date()
        };

        return {
          data: initialPerformance,
          error: null
        };
      }

      const performanceData = performanceDoc.data() as DriverPerformance;

      return {
        data: performanceData,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar performance do motorista:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar performance'
      };
    }
  }

  /**
   * Valida CPF
   */
  validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    
    // Primeiro dígito verificador
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf[i]) * (10 - i);
    }
    
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (parseInt(cleanCpf[9]) !== digit) return false;
    
    // Segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf[i]) * (11 - i);
    }
    
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    return parseInt(cleanCpf[10]) === digit;
  }

  /**
   * Formata CPF
   */
  formatCpf(cpf: string): string {
    const cleanCpf = cpf.replace(/[^\d]/g, '');
    
    if (cleanCpf.length !== 11) return cpf;
    
    return cleanCpf.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }

  /**
   * Verifica se CPF já está em uso
   */
  async isCpfInUse(cpf: string, excludeDriverId?: string): Promise<boolean> {
    try {
      const result = await this.findByCpf(cpf);
      
      if (result.error || !result.data) {
        return false;
      }

      // Se excluir um motorista específico (para updates)
      if (excludeDriverId && result.data.id === excludeDriverId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    }
  }

  /**
   * Busca motoristas com filtros avançados
   */
  async findWithFilters(filters: DriverFilters): Promise<CrudListResponse<Driver>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      const allDrivers = await this.list();
      
      if (allDrivers.error) {
        return allDrivers;
      }

      const filteredData = allDrivers.data.filter(driver => {
        if (filters.name && !driver.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        if (filters.cpf && driver.cpf !== filters.cpf) {
          return false;
        }
        if (filters.email && !driver.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false;
        }
        if (filters.status && driver.status !== filters.status) {
          return false;
        }
        if (filters.companyId && driver.companyId !== filters.companyId) {
          return false;
        }
        if (filters.cnhCategory && driver.cnhCategory !== filters.cnhCategory) {
          return false;
        }
        if (filters.contractType && driver.contractType !== filters.contractType) {
          return false;
        }
        if (filters.availability && driver.availability !== filters.availability) {
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
      console.error('Erro ao buscar motoristas com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar motoristas'
      };
    }
  }

  /**
   * Atualiza status do motorista
   */
  async updateStatus(driverId: string, status: 'Ativo' | 'Em análise' | 'Inativo'): Promise<CrudResponse<Driver>> {
    try {
      return await this.update(driverId, { status });
    } catch (error: any) {
      console.error('Erro ao atualizar status do motorista:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Busca motoristas próximos ao vencimento da CNH
   */
  async findCnhExpiringSoon(days: number = 30): Promise<CrudListResponse<Driver>> {
    try {
      const allDrivers = await this.findWhere('status', '==', 'Ativo');
      
      if (allDrivers.error) {
        return allDrivers;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const expiringSoon = allDrivers.data.filter(driver => {
        const cnhExpiry = new Date(driver.cnhExpiry);
        return cnhExpiry <= expiryDate;
      });

      return {
        data: expiringSoon,
        error: null,
        count: expiringSoon.length,
        totalCount: expiringSoon.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar CNHs próximas ao vencimento:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar CNHs próximas ao vencimento'
      };
    }
  }
}

export const driversService = new DriversService();
export default driversService;