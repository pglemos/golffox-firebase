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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos específicos para alertas
export interface Alert {
  id: string;
  type: 'Crítico' | 'Atenção' | 'Informativo';
  title: string;
  message: string;
  userId: string;
  companyId: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  passengerId?: string;
  tripId?: string;
  isRead: boolean;
  readAt?: Date;
  priority: 'high' | 'medium' | 'low';
  category: 'safety' | 'maintenance' | 'route' | 'passenger' | 'system' | 'other';
  metadata?: {
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    speed?: number;
    temperature?: number;
    fuelLevel?: number;
    batteryLevel?: number;
    [key: string]: any;
  };
  actionRequired?: boolean;
  actionTaken?: boolean;
  actionTakenAt?: Date;
  actionTakenBy?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertInsert extends Omit<Alert, 'id' | 'createdAt' | 'updatedAt'> {}

export interface AlertUpdate extends Partial<Omit<Alert, 'id' | 'createdAt'>> {}

export interface AlertWithDetails extends Alert {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  route?: {
    id: string;
    name: string;
    driverName?: string;
    vehiclePlate?: string;
  };
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    brand: string;
  };
  driver?: {
    id: string;
    name: string;
    cpf: string;
    phone: string;
  };
  passenger?: {
    id: string;
    name: string;
    cpf: string;
    phone: string;
  };
  company?: {
    id: string;
    name: string;
    status: string;
  };
}

export interface AlertFilters {
  type?: 'Crítico' | 'Atenção' | 'Informativo';
  userId?: string;
  companyId?: string;
  routeId?: string;
  vehicleId?: string;
  driverId?: string;
  passengerId?: string;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: 'safety' | 'maintenance' | 'route' | 'passenger' | 'system' | 'other';
  actionRequired?: boolean;
  actionTaken?: boolean;
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: {
    Crítico: number;
    Atenção: number;
    Informativo: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byCategory: {
    safety: number;
    maintenance: number;
    route: number;
    passenger: number;
    system: number;
    other: number;
  };
  actionRequired: number;
  expired: number;
}

export class AlertsService extends BaseCrudService<Alert> {
  constructor() {
    super('alerts');
  }

  /**
   * Busca alertas com detalhes completos
   */
  async findAllWithDetails(companyId?: string): Promise<CrudListResponse<AlertWithDetails>> {
    try {
      let alertsResult;
      
      if (companyId) {
        alertsResult = await this.findWhere('companyId', '==', companyId);
      } else {
        alertsResult = await this.list();
      }
      
      if (alertsResult.error) {
        return alertsResult as CrudListResponse<AlertWithDetails>;
      }

      const alertsWithDetails: AlertWithDetails[] = [];

      for (const alert of alertsResult.data) {
        const details = await this.getAlertDetails(alert.id);
        
        alertsWithDetails.push({
          ...alert,
          ...details
        });
      }

      // Ordenar por data de criação (mais recentes primeiro)
      alertsWithDetails.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        data: alertsWithDetails,
        error: null,
        count: alertsWithDetails.length,
        totalCount: alertsWithDetails.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar alertas com detalhes:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas com detalhes'
      };
    }
  }

  /**
   * Busca detalhes de um alerta específico
   */
  async getAlertDetails(alertId: string): Promise<{
    user?: { id: string; name: string; email: string; role: string };
    route?: { id: string; name: string; driverName?: string; vehiclePlate?: string };
    vehicle?: { id: string; plate: string; model: string; brand: string };
    driver?: { id: string; name: string; cpf: string; phone: string };
    passenger?: { id: string; name: string; cpf: string; phone: string };
    company?: { id: string; name: string; status: string };
  }> {
    try {
      const alert = await this.getById(alertId);
      
      if (alert.error || !alert.data) {
        return {};
      }

      const details: any = {};

      // Buscar usuário
      if (alert.data.userId) {
        const userDoc = await getDoc(doc(db, 'users', alert.data.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          details.user = {
            id: userDoc.id,
            name: userData.name,
            email: userData.email,
            role: userData.role
          };
        }
      }

      // Buscar empresa
      if (alert.data.companyId) {
        const companyDoc = await getDoc(doc(db, 'companies', alert.data.companyId));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          details.company = {
            id: companyDoc.id,
            name: companyData.name,
            status: companyData.status
          };
        }
      }

      // Buscar rota
      if (alert.data.routeId) {
        const routeDoc = await getDoc(doc(db, 'routes', alert.data.routeId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          
          // Buscar nome do motorista se existir
          let driverName;
          if (routeData.driverId) {
            const driverDoc = await getDoc(doc(db, 'drivers', routeData.driverId));
            if (driverDoc.exists()) {
              driverName = driverDoc.data().name;
            }
          }

          // Buscar placa do veículo se existir
          let vehiclePlate;
          if (routeData.vehicleId) {
            const vehicleDoc = await getDoc(doc(db, 'vehicles', routeData.vehicleId));
            if (vehicleDoc.exists()) {
              vehiclePlate = vehicleDoc.data().plate;
            }
          }

          details.route = {
            id: routeDoc.id,
            name: routeData.name,
            driverName,
            vehiclePlate
          };
        }
      }

      // Buscar veículo
      if (alert.data.vehicleId) {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', alert.data.vehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data();
          details.vehicle = {
            id: vehicleDoc.id,
            plate: vehicleData.plate,
            model: vehicleData.model,
            brand: vehicleData.brand
          };
        }
      }

      // Buscar motorista
      if (alert.data.driverId) {
        const driverDoc = await getDoc(doc(db, 'drivers', alert.data.driverId));
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();
          details.driver = {
            id: driverDoc.id,
            name: driverData.name,
            cpf: driverData.cpf,
            phone: driverData.phone
          };
        }
      }

      // Buscar passageiro
      if (alert.data.passengerId) {
        const passengerDoc = await getDoc(doc(db, 'passengers', alert.data.passengerId));
        if (passengerDoc.exists()) {
          const passengerData = passengerDoc.data();
          details.passenger = {
            id: passengerDoc.id,
            name: passengerData.name,
            cpf: passengerData.cpf,
            phone: passengerData.phone
          };
        }
      }

      return details;
    } catch (error) {
      console.error('Erro ao buscar detalhes do alerta:', error);
      return {};
    }
  }

  /**
   * Busca alertas não lidos
   */
  async findUnread(userId?: string, companyId?: string): Promise<CrudListResponse<Alert>> {
    try {
      if (userId && companyId) {
        const q = query(
          collection(db, 'alerts'),
          where('isRead', '==', false),
          where('userId', '==', userId),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alert[];

        return {
          data: alerts,
          error: null,
          count: alerts.length,
          totalCount: alerts.length
        };
      } else if (companyId) {
        const q = query(
          collection(db, 'alerts'),
          where('isRead', '==', false),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alert[];

        return {
          data: alerts,
          error: null,
          count: alerts.length,
          totalCount: alerts.length
        };
      } else {
        return await this.findWhere('isRead', '==', false);
      }
    } catch (error: any) {
      console.error('Erro ao buscar alertas não lidos:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas não lidos'
      };
    }
  }

  /**
   * Busca alertas críticos
   */
  async findCritical(companyId?: string): Promise<CrudListResponse<Alert>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'alerts'),
          where('type', '==', 'Crítico'),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alert[];

        return {
          data: alerts,
          error: null,
          count: alerts.length,
          totalCount: alerts.length
        };
      } else {
        return await this.findWhere('type', '==', 'Crítico');
      }
    } catch (error: any) {
      console.error('Erro ao buscar alertas críticos:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas críticos'
      };
    }
  }

  /**
   * Busca alertas por usuário
   */
  async findByUser(userId: string): Promise<CrudListResponse<Alert>> {
    try {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];

      return {
        data: alerts,
        error: null,
        count: alerts.length,
        totalCount: alerts.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar alertas por usuário:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas por usuário'
      };
    }
  }

  /**
   * Busca alertas por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<Alert>> {
    try {
      return await this.findWhere('companyId', '==', companyId);
    } catch (error: any) {
      console.error('Erro ao buscar alertas por empresa:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas por empresa'
      };
    }
  }

  /**
   * Busca alertas por rota
   */
  async findByRoute(routeId: string): Promise<CrudListResponse<Alert>> {
    try {
      return await this.findWhere('routeId', '==', routeId);
    } catch (error: any) {
      console.error('Erro ao buscar alertas por rota:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas por rota'
      };
    }
  }

  /**
   * Busca alertas por veículo
   */
  async findByVehicle(vehicleId: string): Promise<CrudListResponse<Alert>> {
    try {
      return await this.findWhere('vehicleId', '==', vehicleId);
    } catch (error: any) {
      console.error('Erro ao buscar alertas por veículo:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas por veículo'
      };
    }
  }

  /**
   * Busca alertas que requerem ação
   */
  async findActionRequired(companyId?: string): Promise<CrudListResponse<Alert>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'alerts'),
          where('actionRequired', '==', true),
          where('actionTaken', '==', false),
          where('companyId', '==', companyId),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alert[];

        return {
          data: alerts,
          error: null,
          count: alerts.length,
          totalCount: alerts.length
        };
      } else {
        const q = query(
          collection(db, 'alerts'),
          where('actionRequired', '==', true),
          where('actionTaken', '==', false),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const alerts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Alert[];

        return {
          data: alerts,
          error: null,
          count: alerts.length,
          totalCount: alerts.length
        };
      }
    } catch (error: any) {
      console.error('Erro ao buscar alertas que requerem ação:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas que requerem ação'
      };
    }
  }

  /**
   * Marca alerta como lido
   */
  async markAsRead(alertId: string): Promise<CrudResponse<Alert>> {
    try {
      return await this.update(alertId, {
        isRead: true,
        readAt: new Date()
      });
    } catch (error: any) {
      console.error('Erro ao marcar alerta como lido:', error);
      return {
        data: null,
        error: error.message || 'Erro ao marcar alerta como lido'
      };
    }
  }

  /**
   * Marca múltiplos alertas como lidos
   */
  async markMultipleAsRead(alertIds: string[]): Promise<CrudResponse<boolean>> {
    try {
      const promises = alertIds.map(id => this.markAsRead(id));
      await Promise.all(promises);

      return {
        data: true,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao marcar múltiplos alertas como lidos:', error);
      return {
        data: false,
        error: error.message || 'Erro ao marcar múltiplos alertas como lidos'
      };
    }
  }

  /**
   * Marca todos os alertas de um usuário como lidos
   */
  async markAllAsReadForUser(userId: string): Promise<CrudResponse<boolean>> {
    try {
      const unreadAlerts = await this.findUnread(userId);
      
      if (unreadAlerts.error || !unreadAlerts.data.length) {
        return {
          data: true,
          error: null
        };
      }

      const alertIds = unreadAlerts.data.map(alert => alert.id);
      return await this.markMultipleAsRead(alertIds);
    } catch (error: any) {
      console.error('Erro ao marcar todos os alertas como lidos:', error);
      return {
        data: false,
        error: error.message || 'Erro ao marcar todos os alertas como lidos'
      };
    }
  }

  /**
   * Registra ação tomada em um alerta
   */
  async markActionTaken(alertId: string, actionTakenBy: string): Promise<CrudResponse<Alert>> {
    try {
      return await this.update(alertId, {
        actionTaken: true,
        actionTakenAt: new Date(),
        actionTakenBy
      });
    } catch (error: any) {
      console.error('Erro ao registrar ação tomada:', error);
      return {
        data: null,
        error: error.message || 'Erro ao registrar ação tomada'
      };
    }
  }

  /**
   * Busca alertas expirados
   */
  async findExpired(): Promise<CrudListResponse<Alert>> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'alerts'),
        where('expiresAt', '<=', Timestamp.fromDate(now))
      );
      
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];

      return {
        data: alerts,
        error: null,
        count: alerts.length,
        totalCount: alerts.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar alertas expirados:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas expirados'
      };
    }
  }

  /**
   * Remove alertas expirados
   */
  async cleanupExpired(): Promise<CrudResponse<number>> {
    try {
      const expiredAlerts = await this.findExpired();
      
      if (expiredAlerts.error || !expiredAlerts.data.length) {
        return {
          data: 0,
          error: null
        };
      }

      let deletedCount = 0;
      for (const alert of expiredAlerts.data) {
        const result = await this.delete(alert.id);
        if (!result.error) {
          deletedCount++;
        }
      }

      return {
        data: deletedCount,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao limpar alertas expirados:', error);
      return {
        data: 0,
        error: error.message || 'Erro ao limpar alertas expirados'
      };
    }
  }

  /**
   * Busca alertas com filtros avançados
   */
  async findWithFilters(filters: AlertFilters): Promise<CrudListResponse<Alert>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value !== undefined) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      const allAlerts = await this.list();
      
      if (allAlerts.error) {
        return allAlerts;
      }

      const filteredData = allAlerts.data.filter(alert => {
        if (filters.type && alert.type !== filters.type) {
          return false;
        }
        if (filters.userId && alert.userId !== filters.userId) {
          return false;
        }
        if (filters.companyId && alert.companyId !== filters.companyId) {
          return false;
        }
        if (filters.routeId && alert.routeId !== filters.routeId) {
          return false;
        }
        if (filters.vehicleId && alert.vehicleId !== filters.vehicleId) {
          return false;
        }
        if (filters.driverId && alert.driverId !== filters.driverId) {
          return false;
        }
        if (filters.passengerId && alert.passengerId !== filters.passengerId) {
          return false;
        }
        if (filters.isRead !== undefined && alert.isRead !== filters.isRead) {
          return false;
        }
        if (filters.priority && alert.priority !== filters.priority) {
          return false;
        }
        if (filters.category && alert.category !== filters.category) {
          return false;
        }
        if (filters.actionRequired !== undefined && alert.actionRequired !== filters.actionRequired) {
          return false;
        }
        if (filters.actionTaken !== undefined && alert.actionTaken !== filters.actionTaken) {
          return false;
        }
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (new Date(alert.createdAt) < fromDate) {
            return false;
          }
        }
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          if (new Date(alert.createdAt) > toDate) {
            return false;
          }
        }
        return true;
      });

      // Ordenar por data de criação (mais recentes primeiro)
      filteredData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        data: filteredData,
        error: null,
        count: filteredData.length,
        totalCount: filteredData.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar alertas com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar alertas'
      };
    }
  }

  /**
   * Obtém estatísticas dos alertas
   */
  async getStats(companyId?: string): Promise<CrudResponse<AlertStats>> {
    try {
      let alerts;
      
      if (companyId) {
        const result = await this.findByCompany(companyId);
        if (result.error) {
          return {
            data: null,
            error: result.error
          };
        }
        alerts = result.data;
      } else {
        const result = await this.list();
        if (result.error) {
          return {
            data: null,
            error: result.error
          };
        }
        alerts = result.data;
      }

      const now = new Date();

      const stats: AlertStats = {
        total: alerts.length,
        unread: alerts.filter(alert => !alert.isRead).length,
        byType: {
          Crítico: alerts.filter(alert => alert.type === 'Crítico').length,
          Atenção: alerts.filter(alert => alert.type === 'Atenção').length,
          Informativo: alerts.filter(alert => alert.type === 'Informativo').length
        },
        byPriority: {
          high: alerts.filter(alert => alert.priority === 'high').length,
          medium: alerts.filter(alert => alert.priority === 'medium').length,
          low: alerts.filter(alert => alert.priority === 'low').length
        },
        byCategory: {
          safety: alerts.filter(alert => alert.category === 'safety').length,
          maintenance: alerts.filter(alert => alert.category === 'maintenance').length,
          route: alerts.filter(alert => alert.category === 'route').length,
          passenger: alerts.filter(alert => alert.category === 'passenger').length,
          system: alerts.filter(alert => alert.category === 'system').length,
          other: alerts.filter(alert => alert.category === 'other').length
        },
        actionRequired: alerts.filter(alert => alert.actionRequired && !alert.actionTaken).length,
        expired: alerts.filter(alert => alert.expiresAt && new Date(alert.expiresAt) <= now).length
      };

      return {
        data: stats,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas dos alertas:', error);
      return {
        data: null,
        error: error.message || 'Erro ao obter estatísticas dos alertas'
      };
    }
  }

  /**
   * Cria alerta de emergência
   */
  async createEmergencyAlert(
    title: string,
    message: string,
    userId: string,
    companyId: string,
    metadata?: any
  ): Promise<CrudResponse<Alert>> {
    try {
      const alertData: Omit<Alert, 'id'> = {
        type: 'Crítico',
        title,
        message,
        userId,
        companyId,
        isRead: false,
        priority: 'high',
        category: 'safety',
        actionRequired: true,
        actionTaken: false,
        metadata,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.create(alertData);
    } catch (error: any) {
      console.error('Erro ao criar alerta de emergência:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar alerta de emergência'
      };
    }
  }

  /**
   * Cria alerta de manutenção
   */
  async createMaintenanceAlert(
    title: string,
    message: string,
    userId: string,
    companyId: string,
    vehicleId: string,
    metadata?: any
  ): Promise<CrudResponse<Alert>> {
    try {
      const alertData: Omit<Alert, 'id'> = {
        type: 'Atenção',
        title,
        message,
        userId,
        companyId,
        vehicleId,
        isRead: false,
        priority: 'medium',
        category: 'maintenance',
        actionRequired: true,
        actionTaken: false,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      };

      return await this.create(alertData);
    } catch (error: any) {
      console.error('Erro ao criar alerta de manutenção:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar alerta de manutenção'
      };
    }
  }

  /**
   * Cria alerta de rota
   */
  async createRouteAlert(
    title: string,
    message: string,
    userId: string,
    companyId: string,
    routeId: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
    metadata?: any
  ): Promise<CrudResponse<Alert>> {
    try {
      const alertData: Omit<Alert, 'id'> = {
        type: priority === 'high' ? 'Crítico' : 'Atenção',
        title,
        message,
        userId,
        companyId,
        routeId,
        isRead: false,
        priority,
        category: 'route',
        actionRequired: priority === 'high',
        actionTaken: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata
      };

      return await this.create(alertData);
    } catch (error: any) {
      console.error('Erro ao criar alerta de rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar alerta de rota'
      };
    }
  }
}

export const alertsService = new AlertsService();
export default alertsService;