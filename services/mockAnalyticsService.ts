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

export interface AlertData {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

export class MockAnalyticsService {
  private static instance: MockAnalyticsService;

  public static getInstance(): MockAnalyticsService {
    if (!MockAnalyticsService.instance) {
      MockAnalyticsService.instance = new MockAnalyticsService();
    }
    return MockAnalyticsService.instance;
  }

  // Gera métricas de performance gerais
  generatePerformanceMetrics(): PerformanceMetrics {
    return {
      totalDistance: 15420 + Math.random() * 5000,
      totalTime: 890 + Math.random() * 200,
      fuelConsumption: 1250 + Math.random() * 300,
      totalCost: 8500 + Math.random() * 2000,
      averageSpeed: 45 + Math.random() * 15,
      efficiency: 0.85 + Math.random() * 0.1
    };
  }

  // Gera dados de análise de rotas dos últimos 7 dias
  generateRouteAnalytics(): RouteAnalytics[] {
    const data: RouteAnalytics[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        routesOptimized: 15 + Math.floor(Math.random() * 25),
        distanceSaved: 120 + Math.random() * 180,
        timeSaved: 45 + Math.random() * 60,
        fuelSaved: 25 + Math.random() * 35,
        costSaved: 180 + Math.random() * 220
      });
    }

    return data;
  }

  // Gera análise por veículo
  generateVehicleAnalytics(): VehicleAnalytics[] {
    const vehicles = [
      'Caminhão A-001', 'Caminhão B-002', 'Van C-003', 
      'Caminhão D-004', 'Van E-005', 'Caminhão F-006'
    ];

    return vehicles.map((name, index) => ({
      vehicleId: `VEH-${String(index + 1).padStart(3, '0')}`,
      vehicleName: name,
      totalDistance: 2500 + Math.random() * 3000,
      totalTime: 180 + Math.random() * 120,
      fuelEfficiency: 8 + Math.random() * 4,
      maintenanceScore: 0.7 + Math.random() * 0.25,
      utilizationRate: 0.6 + Math.random() * 0.3
    }));
  }

  // Gera métricas diárias dos últimos 30 dias
  generateDailyMetrics(): DailyMetrics[] {
    const data: DailyMetrics[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        activeVehicles: 8 + Math.floor(Math.random() * 4),
        totalRoutes: 25 + Math.floor(Math.random() * 20),
        averageDeliveryTime: 35 + Math.random() * 25,
        customerSatisfaction: 4.2 + Math.random() * 0.6,
        operationalCost: 1200 + Math.random() * 800
      });
    }

    return data;
  }

  // Gera tendências mensais dos últimos 12 meses
  generateMonthlyTrends(): MonthlyTrends[] {
    const data: MonthlyTrends[] = [];
    const today = new Date();
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      
      const revenue = 25000 + Math.random() * 15000;
      const costs = 18000 + Math.random() * 8000;
      
      data.push({
        month: months[date.getMonth()],
        revenue,
        costs,
        profit: revenue - costs,
        efficiency: 0.75 + Math.random() * 0.2,
        customerGrowth: -5 + Math.random() * 15
      });
    }

    return data;
  }

  // Gera alertas do sistema
  generateAlerts(): AlertData[] {
    const alertTypes = [
      {
        type: 'warning' as const,
        title: 'Manutenção Preventiva',
        message: 'Veículo VAN-003 precisa de manutenção em 500km',
        severity: 'medium' as const
      },
      {
        type: 'error' as const,
        title: 'Atraso na Entrega',
        message: 'Rota R-045 está 25 minutos atrasada',
        severity: 'high' as const
      },
      {
        type: 'info' as const,
        title: 'Otimização Concluída',
        message: 'Nova rota otimizada economizou 15% de combustível',
        severity: 'low' as const
      },
      {
        type: 'warning' as const,
        title: 'Combustível Baixo',
        message: 'Caminhão A-001 com nível de combustível abaixo de 20%',
        severity: 'medium' as const
      }
    ];

    return alertTypes.map((alert, index) => ({
      id: `alert-${index + 1}`,
      ...alert,
      timestamp: new Date(Date.now() - Math.random() * 86400000) // Últimas 24h
    }));
  }

  // Calcula KPIs principais
  calculateKPIs(): Record<string, { value: number; change: number; trend: 'up' | 'down' | 'stable' }> {
    return {
      efficiency: {
        value: 87.5,
        change: 2.3,
        trend: 'up'
      },
      costReduction: {
        value: 15.2,
        change: -1.1,
        trend: 'down'
      },
      customerSatisfaction: {
        value: 4.6,
        change: 0.2,
        trend: 'up'
      },
      fuelSavings: {
        value: 22.8,
        change: 4.5,
        trend: 'up'
      },
      onTimeDelivery: {
        value: 94.2,
        change: 1.8,
        trend: 'up'
      },
      vehicleUtilization: {
        value: 78.9,
        change: -0.5,
        trend: 'stable'
      }
    };
  }

  // Simula carregamento de dados
  async loadAnalyticsData(): Promise<{
    performance: PerformanceMetrics;
    routeAnalytics: RouteAnalytics[];
    vehicleAnalytics: VehicleAnalytics[];
    dailyMetrics: DailyMetrics[];
    monthlyTrends: MonthlyTrends[];
    alerts: AlertData[];
    kpis: Record<string, { value: number; change: number; trend: 'up' | 'down' | 'stable' }>;
  }> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    return {
      performance: this.generatePerformanceMetrics(),
      routeAnalytics: this.generateRouteAnalytics(),
      vehicleAnalytics: this.generateVehicleAnalytics(),
      dailyMetrics: this.generateDailyMetrics(),
      monthlyTrends: this.generateMonthlyTrends(),
      alerts: this.generateAlerts(),
      kpis: this.calculateKPIs()
    };
  }

  // Formata valores para exibição
  formatValue(value: number, type: 'currency' | 'percentage' | 'distance' | 'time' | 'fuel'): string {
    switch (type) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        return `${Math.floor(value / 60)}h ${Math.floor(value % 60)}min`;
      case 'fuel':
        return `${value.toFixed(1)} L`;
      default:
        return value.toString();
    }
  }
}