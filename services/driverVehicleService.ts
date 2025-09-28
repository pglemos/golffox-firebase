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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interfaces para compatibilidade com o código existente
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  licenseNumber: string;
  licenseExpiry: Date;
  licenseCategory: string;
  status: 'active' | 'inactive' | 'suspended';
  vehicleId?: string;
  companyId: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  medicalInfo?: {
    bloodType?: string;
    allergies?: string;
    medications?: string;
    observations?: string;
  };
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
  chassisNumber?: string;
  renavam?: string;
  color?: string;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  kilometers?: number;
  fuelLevel?: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverPerformance {
  id: string;
  driverId: string;
  date: Date;
  routesCompleted: number;
  totalDistance: number;
  fuelConsumption: number;
  averageSpeed: number;
  punctualityScore: number;
  safetyScore: number;
  customerRating: number;
  incidents: number;
  createdAt: Date;
}

export interface VehiclePerformance {
  id: string;
  vehicleId: string;
  date: Date;
  totalDistance: number;
  fuelConsumption: number;
  averageSpeed: number;
  maintenanceAlerts: number;
  utilizationRate: number;
  createdAt: Date;
}

export interface DriverVehicleAssignment {
  id: string;
  driverId: string;
  vehicleId: string;
  assignedAt: Date;
  assignedBy: string;
  unassignedAt?: Date;
  unassignedBy?: string;
  reason?: string;
  isActive: boolean;
  companyId: string;
}

export interface DriverWithVehicle extends Driver {
  vehicle?: Vehicle;
  currentAssignment?: DriverVehicleAssignment;
  performance?: DriverPerformance[];
}

export interface VehicleWithDriver extends Vehicle {
  driver?: Driver;
  currentAssignment?: DriverVehicleAssignment;
  performance?: VehiclePerformance[];
}

export interface AssignmentHistory {
  assignments: DriverVehicleAssignment[];
  totalAssignments: number;
  activeAssignments: number;
  averageAssignmentDuration: number;
}

export interface PerformanceMetrics {
  driver: {
    totalRoutes: number;
    totalDistance: number;
    averagePunctuality: number;
    averageSafety: number;
    averageRating: number;
    totalIncidents: number;
  };
  vehicle: {
    totalDistance: number;
    averageFuelConsumption: number;
    averageUtilization: number;
    maintenanceAlerts: number;
  };
}

export interface DriverVehicleFilters {
  companyId?: string;
  driverId?: string;
  vehicleId?: string;
  status?: 'active' | 'inactive';
  dateFrom?: string;
  dateTo?: string;
  assignedBy?: string;
}

export class DriverVehicleService {
  /**
   * Busca motorista com veículo atribuído
   */
  async getDriverWithVehicle(driverId: string): Promise<DriverWithVehicle | null> {
    try {
      const driverDoc = await getDoc(doc(db, 'drivers', driverId));
      
      if (!driverDoc.exists()) {
        return null;
      }

      const driverData = { id: driverDoc.id, ...driverDoc.data() } as Driver;
      const result: DriverWithVehicle = { ...driverData };

      // Buscar veículo atribuído
      if (driverData.vehicleId) {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', driverData.vehicleId));
        if (vehicleDoc.exists()) {
          result.vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
        }
      }

      // Buscar atribuição atual
      const assignmentQuery = query(
        collection(db, 'driverVehicleAssignments'),
        where('driverId', '==', driverId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const assignmentSnapshot = await getDocs(assignmentQuery);
      if (!assignmentSnapshot.empty) {
        result.currentAssignment = {
          id: assignmentSnapshot.docs[0].id,
          ...assignmentSnapshot.docs[0].data()
        } as DriverVehicleAssignment;
      }

      // Buscar performance recente
      const performanceQuery = query(
        collection(db, 'driverPerformance'),
        where('driverId', '==', driverId),
        orderBy('date', 'desc'),
        limit(30)
      );
      
      const performanceSnapshot = await getDocs(performanceQuery);
      result.performance = performanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DriverPerformance[];

      return result;
    } catch (error) {
      console.error('Erro ao buscar motorista com veículo:', error);
      return null;
    }
  }

  /**
   * Busca veículo com motorista atribuído
   */
  async getVehicleWithDriver(vehicleId: string): Promise<VehicleWithDriver | null> {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      
      if (!vehicleDoc.exists()) {
        return null;
      }

      const vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() } as Vehicle;
      const result: VehicleWithDriver = { ...vehicleData };

      // Buscar motorista atribuído
      if (vehicleData.currentDriverId) {
        const driverDoc = await getDoc(doc(db, 'drivers', vehicleData.currentDriverId));
        if (driverDoc.exists()) {
          result.driver = { id: driverDoc.id, ...driverDoc.data() } as Driver;
        }
      }

      // Buscar atribuição atual
      const assignmentQuery = query(
        collection(db, 'driverVehicleAssignments'),
        where('vehicleId', '==', vehicleId),
        where('isActive', '==', true),
        limit(1)
      );
      
      const assignmentSnapshot = await getDocs(assignmentQuery);
      if (!assignmentSnapshot.empty) {
        result.currentAssignment = {
          id: assignmentSnapshot.docs[0].id,
          ...assignmentSnapshot.docs[0].data()
        } as DriverVehicleAssignment;
      }

      // Buscar performance recente
      const performanceQuery = query(
        collection(db, 'vehiclePerformance'),
        where('vehicleId', '==', vehicleId),
        orderBy('date', 'desc'),
        limit(30)
      );
      
      const performanceSnapshot = await getDocs(performanceQuery);
      result.performance = performanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VehiclePerformance[];

      return result;
    } catch (error) {
      console.error('Erro ao buscar veículo com motorista:', error);
      return null;
    }
  }

  /**
   * Atribui veículo a motorista
   */
  async assignVehicleToDriver(
    driverId: string,
    vehicleId: string,
    assignedBy: string,
    companyId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Verificar se o motorista existe e está ativo
      const driverDoc = await getDoc(doc(db, 'drivers', driverId));
      if (!driverDoc.exists() || driverDoc.data().status !== 'active') {
        throw new Error('Motorista não encontrado ou inativo');
      }

      // Verificar se o veículo existe e está disponível
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (!vehicleDoc.exists() || vehicleDoc.data().status !== 'available') {
        throw new Error('Veículo não encontrado ou indisponível');
      }

      // Desatribuir veículo atual do motorista, se houver
      await this.unassignCurrentVehicle(driverId, assignedBy, 'Nova atribuição');

      // Desatribuir motorista atual do veículo, se houver
      await this.unassignCurrentDriver(vehicleId, assignedBy, 'Nova atribuição');

      // Criar nova atribuição
      const assignmentData: Omit<DriverVehicleAssignment, 'id'> = {
        driverId,
        vehicleId,
        assignedAt: new Date(),
        assignedBy,
        reason,
        isActive: true,
        companyId
      };

      const assignmentRef = doc(collection(db, 'driverVehicleAssignments'));
      await updateDoc(assignmentRef, assignmentData);

      // Atualizar motorista
      await updateDoc(doc(db, 'drivers', driverId), {
        vehicleId,
        updatedAt: serverTimestamp()
      });

      // Atualizar veículo
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        currentDriverId: driverId,
        status: 'in_use',
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao atribuir veículo ao motorista:', error);
      return false;
    }
  }

  /**
   * Remove atribuição de veículo do motorista
   */
  async unassignVehicleFromDriver(
    driverId: string,
    unassignedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      return await this.unassignCurrentVehicle(driverId, unassignedBy, reason);
    } catch (error) {
      console.error('Erro ao desatribuir veículo do motorista:', error);
      return false;
    }
  }

  /**
   * Remove atribuição de motorista do veículo
   */
  async unassignDriverFromVehicle(
    vehicleId: string,
    unassignedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      return await this.unassignCurrentDriver(vehicleId, unassignedBy, reason);
    } catch (error) {
      console.error('Erro ao desatribuir motorista do veículo:', error);
      return false;
    }
  }

  /**
   * Busca histórico de atribuições
   */
  async getAssignmentHistory(filters: DriverVehicleFilters): Promise<AssignmentHistory> {
    try {
      let q = collection(db, 'driverVehicleAssignments');
      const constraints = [];

      if (filters.companyId) {
        constraints.push(where('companyId', '==', filters.companyId));
      }
      if (filters.driverId) {
        constraints.push(where('driverId', '==', filters.driverId));
      }
      if (filters.vehicleId) {
        constraints.push(where('vehicleId', '==', filters.vehicleId));
      }
      if (filters.assignedBy) {
        constraints.push(where('assignedBy', '==', filters.assignedBy));
      }

      constraints.push(orderBy('assignedAt', 'desc'));

      const queryRef = query(q, ...constraints);
      const snapshot = await getDocs(queryRef);
      
      const assignments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DriverVehicleAssignment[];

      // Filtrar por data se especificado
      let filteredAssignments = assignments;
      if (filters.dateFrom || filters.dateTo) {
        filteredAssignments = assignments.filter(assignment => {
          const assignedDate = new Date(assignment.assignedAt);
          
          if (filters.dateFrom && assignedDate < new Date(filters.dateFrom)) {
            return false;
          }
          if (filters.dateTo && assignedDate > new Date(filters.dateTo)) {
            return false;
          }
          return true;
        });
      }

      // Filtrar por status se especificado
      if (filters.status) {
        const isActive = filters.status === 'active';
        filteredAssignments = filteredAssignments.filter(assignment => 
          assignment.isActive === isActive
        );
      }

      // Calcular estatísticas
      const activeAssignments = filteredAssignments.filter(a => a.isActive).length;
      
      const completedAssignments = filteredAssignments.filter(a => !a.isActive && a.unassignedAt);
      const totalDuration = completedAssignments.reduce((sum, assignment) => {
        if (assignment.unassignedAt) {
          const duration = new Date(assignment.unassignedAt).getTime() - new Date(assignment.assignedAt).getTime();
          return sum + duration;
        }
        return sum;
      }, 0);
      
      const averageAssignmentDuration = completedAssignments.length > 0 
        ? totalDuration / completedAssignments.length / (1000 * 60 * 60 * 24) // em dias
        : 0;

      return {
        assignments: filteredAssignments,
        totalAssignments: filteredAssignments.length,
        activeAssignments,
        averageAssignmentDuration
      };
    } catch (error) {
      console.error('Erro ao buscar histórico de atribuições:', error);
      return {
        assignments: [],
        totalAssignments: 0,
        activeAssignments: 0,
        averageAssignmentDuration: 0
      };
    }
  }

  /**
   * Busca métricas de performance
   */
  async getPerformanceMetrics(
    driverId?: string,
    vehicleId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<PerformanceMetrics> {
    try {
      const metrics: PerformanceMetrics = {
        driver: {
          totalRoutes: 0,
          totalDistance: 0,
          averagePunctuality: 0,
          averageSafety: 0,
          averageRating: 0,
          totalIncidents: 0
        },
        vehicle: {
          totalDistance: 0,
          averageFuelConsumption: 0,
          averageUtilization: 0,
          maintenanceAlerts: 0
        }
      };

      // Buscar performance do motorista
      if (driverId) {
        let driverQuery = query(
          collection(db, 'driverPerformance'),
          where('driverId', '==', driverId)
        );

        if (dateFrom || dateTo) {
          // Para filtros de data, buscar todos e filtrar no cliente
          const snapshot = await getDocs(driverQuery);
          const performances = snapshot.docs.map(doc => doc.data() as DriverPerformance)
            .filter(perf => {
              const perfDate = new Date(perf.date);
              if (dateFrom && perfDate < new Date(dateFrom)) return false;
              if (dateTo && perfDate > new Date(dateTo)) return false;
              return true;
            });

          if (performances.length > 0) {
            metrics.driver.totalRoutes = performances.reduce((sum, p) => sum + p.routesCompleted, 0);
            metrics.driver.totalDistance = performances.reduce((sum, p) => sum + p.totalDistance, 0);
            metrics.driver.averagePunctuality = performances.reduce((sum, p) => sum + p.punctualityScore, 0) / performances.length;
            metrics.driver.averageSafety = performances.reduce((sum, p) => sum + p.safetyScore, 0) / performances.length;
            metrics.driver.averageRating = performances.reduce((sum, p) => sum + p.customerRating, 0) / performances.length;
            metrics.driver.totalIncidents = performances.reduce((sum, p) => sum + p.incidents, 0);
          }
        } else {
          const snapshot = await getDocs(driverQuery);
          const performances = snapshot.docs.map(doc => doc.data() as DriverPerformance);

          if (performances.length > 0) {
            metrics.driver.totalRoutes = performances.reduce((sum, p) => sum + p.routesCompleted, 0);
            metrics.driver.totalDistance = performances.reduce((sum, p) => sum + p.totalDistance, 0);
            metrics.driver.averagePunctuality = performances.reduce((sum, p) => sum + p.punctualityScore, 0) / performances.length;
            metrics.driver.averageSafety = performances.reduce((sum, p) => sum + p.safetyScore, 0) / performances.length;
            metrics.driver.averageRating = performances.reduce((sum, p) => sum + p.customerRating, 0) / performances.length;
            metrics.driver.totalIncidents = performances.reduce((sum, p) => sum + p.incidents, 0);
          }
        }
      }

      // Buscar performance do veículo
      if (vehicleId) {
        let vehicleQuery = query(
          collection(db, 'vehiclePerformance'),
          where('vehicleId', '==', vehicleId)
        );

        if (dateFrom || dateTo) {
          // Para filtros de data, buscar todos e filtrar no cliente
          const snapshot = await getDocs(vehicleQuery);
          const performances = snapshot.docs.map(doc => doc.data() as VehiclePerformance)
            .filter(perf => {
              const perfDate = new Date(perf.date);
              if (dateFrom && perfDate < new Date(dateFrom)) return false;
              if (dateTo && perfDate > new Date(dateTo)) return false;
              return true;
            });

          if (performances.length > 0) {
            metrics.vehicle.totalDistance = performances.reduce((sum, p) => sum + p.totalDistance, 0);
            metrics.vehicle.averageFuelConsumption = performances.reduce((sum, p) => sum + p.fuelConsumption, 0) / performances.length;
            metrics.vehicle.averageUtilization = performances.reduce((sum, p) => sum + p.utilizationRate, 0) / performances.length;
            metrics.vehicle.maintenanceAlerts = performances.reduce((sum, p) => sum + p.maintenanceAlerts, 0);
          }
        } else {
          const snapshot = await getDocs(vehicleQuery);
          const performances = snapshot.docs.map(doc => doc.data() as VehiclePerformance);

          if (performances.length > 0) {
            metrics.vehicle.totalDistance = performances.reduce((sum, p) => sum + p.totalDistance, 0);
            metrics.vehicle.averageFuelConsumption = performances.reduce((sum, p) => sum + p.fuelConsumption, 0) / performances.length;
            metrics.vehicle.averageUtilization = performances.reduce((sum, p) => sum + p.utilizationRate, 0) / performances.length;
            metrics.vehicle.maintenanceAlerts = performances.reduce((sum, p) => sum + p.maintenanceAlerts, 0);
          }
        }
      }

      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas de performance:', error);
      return {
        driver: {
          totalRoutes: 0,
          totalDistance: 0,
          averagePunctuality: 0,
          averageSafety: 0,
          averageRating: 0,
          totalIncidents: 0
        },
        vehicle: {
          totalDistance: 0,
          averageFuelConsumption: 0,
          averageUtilization: 0,
          maintenanceAlerts: 0
        }
      };
    }
  }

  /**
   * Busca motoristas disponíveis (sem veículo atribuído)
   */
  async getAvailableDrivers(companyId: string): Promise<Driver[]> {
    try {
      const q = query(
        collection(db, 'drivers'),
        where('companyId', '==', companyId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Driver[];

      // Filtrar motoristas sem veículo atribuído
      return drivers.filter(driver => !driver.vehicleId);
    } catch (error) {
      console.error('Erro ao buscar motoristas disponíveis:', error);
      return [];
    }
  }

  /**
   * Busca veículos disponíveis (sem motorista atribuído)
   */
  async getAvailableVehicles(companyId: string): Promise<Vehicle[]> {
    try {
      const q = query(
        collection(db, 'vehicles'),
        where('companyId', '==', companyId),
        where('status', '==', 'available')
      );
      
      const snapshot = await getDocs(q);
      const vehicles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];

      // Filtrar veículos sem motorista atribuído
      return vehicles.filter(vehicle => !vehicle.currentDriverId);
    } catch (error) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      return [];
    }
  }

  // Métodos auxiliares privados

  private async unassignCurrentVehicle(
    driverId: string,
    unassignedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Buscar atribuição ativa atual
      const assignmentQuery = query(
        collection(db, 'driverVehicleAssignments'),
        where('driverId', '==', driverId),
        where('isActive', '==', true)
      );
      
      const assignmentSnapshot = await getDocs(assignmentQuery);
      
      for (const assignmentDoc of assignmentSnapshot.docs) {
        const assignment = assignmentDoc.data() as DriverVehicleAssignment;
        
        // Desativar atribuição
        await updateDoc(doc(db, 'driverVehicleAssignments', assignmentDoc.id), {
          isActive: false,
          unassignedAt: new Date(),
          unassignedBy,
          reason
        });

        // Atualizar veículo para disponível
        if (assignment.vehicleId) {
          await updateDoc(doc(db, 'vehicles', assignment.vehicleId), {
            currentDriverId: null,
            status: 'available',
            updatedAt: serverTimestamp()
          });
        }
      }

      // Atualizar motorista
      await updateDoc(doc(db, 'drivers', driverId), {
        vehicleId: null,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao desatribuir veículo atual:', error);
      return false;
    }
  }

  private async unassignCurrentDriver(
    vehicleId: string,
    unassignedBy: string,
    reason?: string
  ): Promise<boolean> {
    try {
      // Buscar atribuição ativa atual
      const assignmentQuery = query(
        collection(db, 'driverVehicleAssignments'),
        where('vehicleId', '==', vehicleId),
        where('isActive', '==', true)
      );
      
      const assignmentSnapshot = await getDocs(assignmentQuery);
      
      for (const assignmentDoc of assignmentSnapshot.docs) {
        const assignment = assignmentDoc.data() as DriverVehicleAssignment;
        
        // Desativar atribuição
        await updateDoc(doc(db, 'driverVehicleAssignments', assignmentDoc.id), {
          isActive: false,
          unassignedAt: new Date(),
          unassignedBy,
          reason
        });

        // Atualizar motorista
        if (assignment.driverId) {
          await updateDoc(doc(db, 'drivers', assignment.driverId), {
            vehicleId: null,
            updatedAt: serverTimestamp()
          });
        }
      }

      // Atualizar veículo
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        currentDriverId: null,
        status: 'available',
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Erro ao desatribuir motorista atual:', error);
      return false;
    }
  }
}

export const driverVehicleService = new DriverVehicleService();
export default driverVehicleService;