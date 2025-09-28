import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interfaces para dados de análise
export interface PerformanceMetrics {
  totalDistance: number;
  totalTime: number;
  fuelConsumption: number;
  totalCost: number;
  averageSpeed: number;
  efficiency: number;
}

export interface RouteAnalytics {
  date: string;
  routesOptimized: number;
  distanceSaved: number;
  timeSaved: number;
  fuelSaved: number;
  costSaved: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  totalDistance: number;
  totalTime: number;
  fuelEfficiency: number;
  maintenanceScore: number;
  utilizationRate: number;
}

export interface DailyMetrics {
  date: string;
  activeVehicles: number;
  totalRoutes: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  operationalCost: number;
}

export interface MonthlyTrends {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
  efficiency: number;
  customerGrowth: number;
}

export interface DriverAnalytics {
  driverId: string;
  driverName: string;
  totalDistance: number;
  totalRoutes: number;
  averageRating: number;
  punctualityScore: number;
  safetyScore: number;
  fuelEfficiency: number;
}

export interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  totalVehicles: number;
  activeVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  totalDistance: number;
  averageEfficiency: number;
  monthlyRevenue: number;
}

export interface AlertAnalytics {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  alertsByType: Record<string, number>;
  alertsByPriority: Record<string, number>;
}

export interface PassengerAnalytics {
  totalPassengers: number;
  activePassengers: number;
  averageRating: number;
  totalCheckIns: number;
  punctualityRate: number;
  specialNeedsPassengers: number;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalCosts: number;
  profit: number;
  profitMargin: number;
  fuelCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
}

export interface AnalyticsFilters {
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
  vehicleIds?: string[];
  driverIds?: string[];
  routeIds?: string[];
}

export interface DashboardData {
  performanceMetrics: PerformanceMetrics;
  dailyMetrics: DailyMetrics[];
  vehicleAnalytics: VehicleAnalytics[];
  driverAnalytics: DriverAnalytics[];
  alertAnalytics: AlertAnalytics;
  passengerAnalytics: PassengerAnalytics;
  financialMetrics: FinancialMetrics;
}

export class AnalyticsService {
  /**
   * Busca métricas de performance geral
   */
  async getPerformanceMetrics(filters: AnalyticsFilters): Promise<PerformanceMetrics> {
    try {
      const metrics: PerformanceMetrics = {
        totalDistance: 0,
        totalTime: 0,
        fuelConsumption: 0,
        totalCost: 0,
        averageSpeed: 0,
        efficiency: 0
      };

      // Buscar dados de rotas
      let routeQuery = collection(db, 'routes');
      const routeConstraints = [];

      if (filters.companyId) {
        routeConstraints.push(where('companyId', '==', filters.companyId));
      }

      if (routeConstraints.length > 0) {
        const routeQueryRef = query(routeQuery, ...routeConstraints);
        const routeSnapshot = await getDocs(routeQueryRef);
        
        let totalRoutes = 0;
        let totalDuration = 0;

        routeSnapshot.docs.forEach(doc => {
          const route = doc.data();
          
          // Filtrar por data se especificado
          if (filters.startDate || filters.endDate) {
            const routeDate = route.createdAt?.toDate();
            if (filters.startDate && routeDate < filters.startDate) return;
            if (filters.endDate && routeDate > filters.endDate) return;
          }

          if (route.distance) metrics.totalDistance += route.distance;
          if (route.estimatedDuration) totalDuration += route.estimatedDuration;
          if (route.estimatedCost) metrics.totalCost += route.estimatedCost;
          totalRoutes++;
        });

        metrics.totalTime = totalDuration;
        metrics.averageSpeed = metrics.totalTime > 0 ? metrics.totalDistance / (metrics.totalTime / 60) : 0;
      }

      // Buscar dados de performance de veículos
      if (filters.companyId) {
        const vehicleQuery = query(
          collection(db, 'vehiclePerformance'),
          where('companyId', '==', filters.companyId)
        );
        
        const vehicleSnapshot = await getDocs(vehicleQuery);
        let totalFuelConsumption = 0;
        let performanceCount = 0;

        vehicleSnapshot.docs.forEach(doc => {
          const performance = doc.data();
          
          // Filtrar por data se especificado
          if (filters.startDate || filters.endDate) {
            const perfDate = performance.date?.toDate();
            if (filters.startDate && perfDate < filters.startDate) return;
            if (filters.endDate && perfDate > filters.endDate) return;
          }

          if (performance.fuelConsumption) {
            totalFuelConsumption += performance.fuelConsumption;
            performanceCount++;
          }
        });

        metrics.fuelConsumption = performanceCount > 0 ? totalFuelConsumption / performanceCount : 0;
      }

      // Calcular eficiência
      metrics.efficiency = metrics.fuelConsumption > 0 ? metrics.totalDistance / metrics.fuelConsumption : 0;

      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas de performance:', error);
      return {
        totalDistance: 0,
        totalTime: 0,
        fuelConsumption: 0,
        totalCost: 0,
        averageSpeed: 0,
        efficiency: 0
      };
    }
  }

  /**
   * Busca métricas diárias
   */
  async getDailyMetrics(filters: AnalyticsFilters): Promise<DailyMetrics[]> {
    try {
      const dailyMetrics: DailyMetrics[] = [];
      
      if (!filters.companyId) return dailyMetrics;

      // Buscar rotas por dia
      const routeQuery = query(
        collection(db, 'routes'),
        where('companyId', '==', filters.companyId),
        orderBy('createdAt', 'desc')
      );
      
      const routeSnapshot = await getDocs(routeQuery);
      const routesByDate: Record<string, any[]> = {};

      routeSnapshot.docs.forEach(doc => {
        const route = doc.data();
        const routeDate = route.createdAt?.toDate();
        
        if (routeDate) {
          // Filtrar por data se especificado
          if (filters.startDate && routeDate < filters.startDate) return;
          if (filters.endDate && routeDate > filters.endDate) return;

          const dateKey = routeDate.toISOString().split('T')[0];
          if (!routesByDate[dateKey]) {
            routesByDate[dateKey] = [];
          }
          routesByDate[dateKey].push(route);
        }
      });

      // Buscar veículos ativos por dia
      const vehicleQuery = query(
        collection(db, 'vehicles'),
        where('companyId', '==', filters.companyId),
        where('status', '==', 'in_use')
      );
      
      const vehicleSnapshot = await getDocs(vehicleQuery);
      const activeVehicles = vehicleSnapshot.size;

      // Processar métricas por dia
      for (const [date, routes] of Object.entries(routesByDate)) {
        const totalRoutes = routes.length;
        const averageDeliveryTime = routes.reduce((sum, route) => {
          return sum + (route.actualDuration || route.estimatedDuration || 0);
        }, 0) / totalRoutes;

        const operationalCost = routes.reduce((sum, route) => {
          return sum + (route.actualCost || route.estimatedCost || 0);
        }, 0);

        dailyMetrics.push({
          date,
          activeVehicles,
          totalRoutes,
          averageDeliveryTime,
          customerSatisfaction: 4.5, // Valor padrão - pode ser calculado com base em avaliações
          operationalCost
        });
      }

      return dailyMetrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Erro ao buscar métricas diárias:', error);
      return [];
    }
  }

  /**
   * Busca análise de veículos
   */
  async getVehicleAnalytics(filters: AnalyticsFilters): Promise<VehicleAnalytics[]> {
    try {
      const vehicleAnalytics: VehicleAnalytics[] = [];
      
      if (!filters.companyId) return vehicleAnalytics;

      // Buscar veículos da empresa
      const vehicleQuery = query(
        collection(db, 'vehicles'),
        where('companyId', '==', filters.companyId)
      );
      
      const vehicleSnapshot = await getDocs(vehicleQuery);

      for (const vehicleDoc of vehicleSnapshot.docs) {
        const vehicle = vehicleDoc.data();
        
        // Buscar performance do veículo
        const performanceQuery = query(
          collection(db, 'vehiclePerformance'),
          where('vehicleId', '==', vehicleDoc.id)
        );
        
        const performanceSnapshot = await getDocs(performanceQuery);
        
        let totalDistance = 0;
        let totalTime = 0;
        let totalFuelConsumption = 0;
        let totalUtilization = 0;
        let performanceCount = 0;

        performanceSnapshot.docs.forEach(doc => {
          const performance = doc.data();
          
          // Filtrar por data se especificado
          if (filters.startDate || filters.endDate) {
            const perfDate = performance.date?.toDate();
            if (filters.startDate && perfDate < filters.startDate) return;
            if (filters.endDate && perfDate > filters.endDate) return;
          }

          totalDistance += performance.totalDistance || 0;
          totalTime += performance.totalTime || 0;
          totalFuelConsumption += performance.fuelConsumption || 0;
          totalUtilization += performance.utilizationRate || 0;
          performanceCount++;
        });

        const fuelEfficiency = totalFuelConsumption > 0 ? totalDistance / totalFuelConsumption : 0;
        const utilizationRate = performanceCount > 0 ? totalUtilization / performanceCount : 0;
        const maintenanceScore = this.calculateMaintenanceScore(vehicle);

        vehicleAnalytics.push({
          vehicleId: vehicleDoc.id,
          vehicleName: `${vehicle.brand} ${vehicle.model} - ${vehicle.plate}`,
          totalDistance,
          totalTime,
          fuelEfficiency,
          maintenanceScore,
          utilizationRate
        });
      }

      return vehicleAnalytics.sort((a, b) => b.totalDistance - a.totalDistance);
    } catch (error) {
      console.error('Erro ao buscar análise de veículos:', error);
      return [];
    }
  }

  /**
   * Busca análise de motoristas
   */
  async getDriverAnalytics(filters: AnalyticsFilters): Promise<DriverAnalytics[]> {
    try {
      const driverAnalytics: DriverAnalytics[] = [];
      
      if (!filters.companyId) return driverAnalytics;

      // Buscar motoristas da empresa
      const driverQuery = query(
        collection(db, 'drivers'),
        where('companyId', '==', filters.companyId)
      );
      
      const driverSnapshot = await getDocs(driverQuery);

      for (const driverDoc of driverSnapshot.docs) {
        const driver = driverDoc.data();
        
        // Buscar performance do motorista
        const performanceQuery = query(
          collection(db, 'driverPerformance'),
          where('driverId', '==', driverDoc.id)
        );
        
        const performanceSnapshot = await getDocs(performanceQuery);
        
        let totalDistance = 0;
        let totalRoutes = 0;
        let totalRating = 0;
        let totalPunctuality = 0;
        let totalSafety = 0;
        let totalFuelEfficiency = 0;
        let performanceCount = 0;

        performanceSnapshot.docs.forEach(doc => {
          const performance = doc.data();
          
          // Filtrar por data se especificado
          if (filters.startDate || filters.endDate) {
            const perfDate = performance.date?.toDate();
            if (filters.startDate && perfDate < filters.startDate) return;
            if (filters.endDate && perfDate > filters.endDate) return;
          }

          totalDistance += performance.totalDistance || 0;
          totalRoutes += performance.routesCompleted || 0;
          totalRating += performance.customerRating || 0;
          totalPunctuality += performance.punctualityScore || 0;
          totalSafety += performance.safetyScore || 0;
          
          // Calcular eficiência de combustível
          if (performance.totalDistance && performance.fuelConsumption) {
            totalFuelEfficiency += performance.totalDistance / performance.fuelConsumption;
          }
          
          performanceCount++;
        });

        const averageRating = performanceCount > 0 ? totalRating / performanceCount : 0;
        const punctualityScore = performanceCount > 0 ? totalPunctuality / performanceCount : 0;
        const safetyScore = performanceCount > 0 ? totalSafety / performanceCount : 0;
        const fuelEfficiency = performanceCount > 0 ? totalFuelEfficiency / performanceCount : 0;

        driverAnalytics.push({
          driverId: driverDoc.id,
          driverName: driver.name,
          totalDistance,
          totalRoutes,
          averageRating,
          punctualityScore,
          safetyScore,
          fuelEfficiency
        });
      }

      return driverAnalytics.sort((a, b) => b.totalDistance - a.totalDistance);
    } catch (error) {
      console.error('Erro ao buscar análise de motoristas:', error);
      return [];
    }
  }

  /**
   * Busca análise de alertas
   */
  async getAlertAnalytics(filters: AnalyticsFilters): Promise<AlertAnalytics> {
    try {
      const analytics: AlertAnalytics = {
        totalAlerts: 0,
        criticalAlerts: 0,
        resolvedAlerts: 0,
        averageResolutionTime: 0,
        alertsByType: {},
        alertsByPriority: {}
      };

      if (!filters.companyId) return analytics;

      // Buscar alertas da empresa
      const alertQuery = query(
        collection(db, 'alerts'),
        where('companyId', '==', filters.companyId)
      );
      
      const alertSnapshot = await getDocs(alertQuery);
      
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      alertSnapshot.docs.forEach(doc => {
        const alert = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const alertDate = alert.createdAt?.toDate();
          if (filters.startDate && alertDate < filters.startDate) return;
          if (filters.endDate && alertDate > filters.endDate) return;
        }

        analytics.totalAlerts++;

        // Contar por tipo
        const type = alert.type || 'unknown';
        analytics.alertsByType[type] = (analytics.alertsByType[type] || 0) + 1;

        // Contar por prioridade
        const priority = alert.priority || 'medium';
        analytics.alertsByPriority[priority] = (analytics.alertsByPriority[priority] || 0) + 1;

        // Contar críticos
        if (priority === 'critical' || priority === 'high') {
          analytics.criticalAlerts++;
        }

        // Contar resolvidos e calcular tempo de resolução
        if (alert.status === 'resolved' && alert.resolvedAt) {
          analytics.resolvedAlerts++;
          const resolutionTime = alert.resolvedAt.toDate().getTime() - alert.createdAt.toDate().getTime();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      });

      // Calcular tempo médio de resolução em horas
      analytics.averageResolutionTime = resolvedCount > 0 
        ? totalResolutionTime / resolvedCount / (1000 * 60 * 60)
        : 0;

      return analytics;
    } catch (error) {
      console.error('Erro ao buscar análise de alertas:', error);
      return {
        totalAlerts: 0,
        criticalAlerts: 0,
        resolvedAlerts: 0,
        averageResolutionTime: 0,
        alertsByType: {},
        alertsByPriority: {}
      };
    }
  }

  /**
   * Busca análise de passageiros
   */
  async getPassengerAnalytics(filters: AnalyticsFilters): Promise<PassengerAnalytics> {
    try {
      const analytics: PassengerAnalytics = {
        totalPassengers: 0,
        activePassengers: 0,
        averageRating: 0,
        totalCheckIns: 0,
        punctualityRate: 0,
        specialNeedsPassengers: 0
      };

      if (!filters.companyId) return analytics;

      // Buscar passageiros da empresa
      const passengerQuery = query(
        collection(db, 'passengers'),
        where('companyId', '==', filters.companyId)
      );
      
      const passengerSnapshot = await getDocs(passengerQuery);
      
      let totalRating = 0;
      let ratingCount = 0;
      let punctualCheckIns = 0;
      let totalCheckIns = 0;

      passengerSnapshot.docs.forEach(doc => {
        const passenger = doc.data();
        
        analytics.totalPassengers++;

        if (passenger.status === 'active') {
          analytics.activePassengers++;
        }

        if (passenger.specialNeeds && passenger.specialNeeds.length > 0) {
          analytics.specialNeedsPassengers++;
        }

        // Calcular rating médio (se disponível)
        if (passenger.rating) {
          totalRating += passenger.rating;
          ratingCount++;
        }
      });

      // Buscar dados de check-ins
      const checkInQuery = query(
        collection(db, 'passengerCheckIns'),
        where('companyId', '==', filters.companyId)
      );
      
      const checkInSnapshot = await getDocs(checkInQuery);
      
      checkInSnapshot.docs.forEach(doc => {
        const checkIn = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const checkInDate = checkIn.timestamp?.toDate();
          if (filters.startDate && checkInDate < filters.startDate) return;
          if (filters.endDate && checkInDate > filters.endDate) return;
        }

        totalCheckIns++;

        // Verificar pontualidade (se chegou no horário esperado)
        if (checkIn.onTime) {
          punctualCheckIns++;
        }
      });

      analytics.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      analytics.totalCheckIns = totalCheckIns;
      analytics.punctualityRate = totalCheckIns > 0 ? (punctualCheckIns / totalCheckIns) * 100 : 0;

      return analytics;
    } catch (error) {
      console.error('Erro ao buscar análise de passageiros:', error);
      return {
        totalPassengers: 0,
        activePassengers: 0,
        averageRating: 0,
        totalCheckIns: 0,
        punctualityRate: 0,
        specialNeedsPassengers: 0
      };
    }
  }

  /**
   * Busca métricas financeiras
   */
  async getFinancialMetrics(filters: AnalyticsFilters): Promise<FinancialMetrics> {
    try {
      const metrics: FinancialMetrics = {
        totalRevenue: 0,
        totalCosts: 0,
        profit: 0,
        profitMargin: 0,
        fuelCosts: 0,
        maintenanceCosts: 0,
        operationalCosts: 0
      };

      if (!filters.companyId) return metrics;

      // Buscar dados financeiros de rotas
      const routeQuery = query(
        collection(db, 'routes'),
        where('companyId', '==', filters.companyId)
      );
      
      const routeSnapshot = await getDocs(routeQuery);
      
      routeSnapshot.docs.forEach(doc => {
        const route = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const routeDate = route.createdAt?.toDate();
          if (filters.startDate && routeDate < filters.startDate) return;
          if (filters.endDate && routeDate > filters.endDate) return;
        }

        if (route.revenue) metrics.totalRevenue += route.revenue;
        if (route.actualCost || route.estimatedCost) {
          metrics.operationalCosts += route.actualCost || route.estimatedCost;
        }
      });

      // Buscar custos de combustível
      const fuelQuery = query(
        collection(db, 'fuelExpenses'),
        where('companyId', '==', filters.companyId)
      );
      
      const fuelSnapshot = await getDocs(fuelQuery);
      
      fuelSnapshot.docs.forEach(doc => {
        const expense = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const expenseDate = expense.date?.toDate();
          if (filters.startDate && expenseDate < filters.startDate) return;
          if (filters.endDate && expenseDate > filters.endDate) return;
        }

        if (expense.amount) metrics.fuelCosts += expense.amount;
      });

      // Buscar custos de manutenção
      const maintenanceQuery = query(
        collection(db, 'maintenanceExpenses'),
        where('companyId', '==', filters.companyId)
      );
      
      const maintenanceSnapshot = await getDocs(maintenanceQuery);
      
      maintenanceSnapshot.docs.forEach(doc => {
        const expense = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const expenseDate = expense.date?.toDate();
          if (filters.startDate && expenseDate < filters.startDate) return;
          if (filters.endDate && expenseDate > filters.endDate) return;
        }

        if (expense.amount) metrics.maintenanceCosts += expense.amount;
      });

      // Calcular totais
      metrics.totalCosts = metrics.fuelCosts + metrics.maintenanceCosts + metrics.operationalCosts;
      metrics.profit = metrics.totalRevenue - metrics.totalCosts;
      metrics.profitMargin = metrics.totalRevenue > 0 ? (metrics.profit / metrics.totalRevenue) * 100 : 0;

      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas financeiras:', error);
      return {
        totalRevenue: 0,
        totalCosts: 0,
        profit: 0,
        profitMargin: 0,
        fuelCosts: 0,
        maintenanceCosts: 0,
        operationalCosts: 0
      };
    }
  }

  /**
   * Busca dados completos do dashboard
   */
  async getDashboardData(filters: AnalyticsFilters): Promise<DashboardData> {
    try {
      const [
        performanceMetrics,
        dailyMetrics,
        vehicleAnalytics,
        driverAnalytics,
        alertAnalytics,
        passengerAnalytics,
        financialMetrics
      ] = await Promise.all([
        this.getPerformanceMetrics(filters),
        this.getDailyMetrics(filters),
        this.getVehicleAnalytics(filters),
        this.getDriverAnalytics(filters),
        this.getAlertAnalytics(filters),
        this.getPassengerAnalytics(filters),
        this.getFinancialMetrics(filters)
      ]);

      return {
        performanceMetrics,
        dailyMetrics,
        vehicleAnalytics,
        driverAnalytics,
        alertAnalytics,
        passengerAnalytics,
        financialMetrics
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  /**
   * Busca tendências mensais
   */
  async getMonthlyTrends(filters: AnalyticsFilters): Promise<MonthlyTrends[]> {
    try {
      const trends: MonthlyTrends[] = [];
      
      if (!filters.companyId) return trends;

      // Buscar dados dos últimos 12 meses
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      const monthlyData: Record<string, any> = {};

      // Buscar dados financeiros por mês
      const routeQuery = query(
        collection(db, 'routes'),
        where('companyId', '==', filters.companyId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const routeSnapshot = await getDocs(routeQuery);
      
      routeSnapshot.docs.forEach(doc => {
        const route = doc.data();
        const routeDate = route.createdAt?.toDate();
        
        if (routeDate) {
          const monthKey = `${routeDate.getFullYear()}-${String(routeDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              revenue: 0,
              costs: 0,
              routes: 0,
              distance: 0
            };
          }

          monthlyData[monthKey].revenue += route.revenue || 0;
          monthlyData[monthKey].costs += route.actualCost || route.estimatedCost || 0;
          monthlyData[monthKey].routes++;
          monthlyData[monthKey].distance += route.distance || 0;
        }
      });

      // Converter para array e calcular métricas
      for (const [month, data] of Object.entries(monthlyData)) {
        const profit = data.revenue - data.costs;
        const efficiency = data.distance > 0 ? data.revenue / data.distance : 0;

        trends.push({
          month,
          revenue: data.revenue,
          costs: data.costs,
          profit,
          efficiency,
          customerGrowth: 0 // Pode ser calculado comparando com mês anterior
        });
      }

      return trends.sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Erro ao buscar tendências mensais:', error);
      return [];
    }
  }

  // Métodos auxiliares privados

  private calculateMaintenanceScore(vehicle: any): number {
    // Calcular score de manutenção baseado em vários fatores
    let score = 100;

    // Reduzir score baseado na idade do veículo
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - (vehicle.year || currentYear);
    score -= vehicleAge * 2;

    // Reduzir score baseado na quilometragem
    if (vehicle.kilometers) {
      const kmPenalty = Math.floor(vehicle.kilometers / 10000) * 5;
      score -= kmPenalty;
    }

    // Reduzir score se manutenção está atrasada
    if (vehicle.nextMaintenanceDate) {
      const nextMaintenance = new Date(vehicle.nextMaintenanceDate);
      const now = new Date();
      if (nextMaintenance < now) {
        const daysOverdue = Math.floor((now.getTime() - nextMaintenance.getTime()) / (1000 * 60 * 60 * 24));
        score -= daysOverdue * 2;
      }
    }

    return Math.max(0, Math.min(100, score));
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;