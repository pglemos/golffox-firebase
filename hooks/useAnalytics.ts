import { useState, useEffect, useCallback } from 'react';
import { 
  MockAnalyticsService, 
  PerformanceMetrics, 
  RouteAnalytics, 
  VehicleAnalytics, 
  DailyMetrics, 
  MonthlyTrends, 
  AlertData 
} from '../services/mockAnalyticsService';

interface AnalyticsState {
  performance: PerformanceMetrics | null;
  routeAnalytics: RouteAnalytics[];
  vehicleAnalytics: VehicleAnalytics[];
  dailyMetrics: DailyMetrics[];
  monthlyTrends: MonthlyTrends[];
  alerts: AlertData[];
  kpis: Record<string, { value: number; change: number; trend: 'up' | 'down' | 'stable' }>;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useAnalytics = () => {
  const [state, setState] = useState<AnalyticsState>({
    performance: null,
    routeAnalytics: [],
    vehicleAnalytics: [],
    dailyMetrics: [],
    monthlyTrends: [],
    alerts: [],
    kpis: {},
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const analyticsService = MockAnalyticsService.getInstance();

  // Carrega todos os dados de análise
  const loadAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await analyticsService.loadAnalyticsData();
      
      setState(prev => ({
        ...prev,
        ...data,
        isLoading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar dados de análise'
      }));
    }
  }, [analyticsService]);

  // Atualiza apenas as métricas de performance
  const refreshPerformanceMetrics = useCallback(async () => {
    try {
      const performance = analyticsService.generatePerformanceMetrics();
      setState(prev => ({ ...prev, performance }));
    } catch (error) {
      console.error('Erro ao atualizar métricas de performance:', error);
    }
  }, [analyticsService]);

  // Atualiza apenas os alertas
  const refreshAlerts = useCallback(async () => {
    try {
      const alerts = analyticsService.generateAlerts();
      setState(prev => ({ ...prev, alerts }));
    } catch (error) {
      console.error('Erro ao atualizar alertas:', error);
    }
  }, [analyticsService]);

  // Remove um alerta específico
  const dismissAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.filter(alert => alert.id !== alertId)
    }));
  }, []);

  // Filtra dados por período
  const filterDataByPeriod = useCallback((period: 'week' | 'month' | 'quarter') => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const filteredDailyMetrics = state.dailyMetrics.filter(metric => 
      new Date(metric.date) >= startDate
    );

    const filteredRouteAnalytics = state.routeAnalytics.filter(route => 
      new Date(route.date) >= startDate
    );

    return {
      dailyMetrics: filteredDailyMetrics,
      routeAnalytics: filteredRouteAnalytics
    };
  }, [state.dailyMetrics, state.routeAnalytics]);

  // Calcula totais e médias
  const calculateSummary = useCallback(() => {
    if (!state.performance || state.routeAnalytics.length === 0) {
      return null;
    }

    const totalRoutes = state.routeAnalytics.reduce((sum, route) => sum + route.routesOptimized, 0);
    const totalDistanceSaved = state.routeAnalytics.reduce((sum, route) => sum + route.distanceSaved, 0);
    const totalTimeSaved = state.routeAnalytics.reduce((sum, route) => sum + route.timeSaved, 0);
    const totalCostSaved = state.routeAnalytics.reduce((sum, route) => sum + route.costSaved, 0);

    const activeVehicles = state.vehicleAnalytics.length;
    const averageUtilization = state.vehicleAnalytics.reduce((sum, vehicle) => 
      sum + vehicle.utilizationRate, 0) / activeVehicles;

    return {
      totalRoutes,
      totalDistanceSaved,
      totalTimeSaved,
      totalCostSaved,
      activeVehicles,
      averageUtilization: averageUtilization * 100,
      efficiency: state.performance.efficiency * 100
    };
  }, [state.performance, state.routeAnalytics, state.vehicleAnalytics]);

  // Obtém veículo com melhor performance
  const getBestPerformingVehicle = useCallback(() => {
    if (state.vehicleAnalytics.length === 0) return null;

    return state.vehicleAnalytics.reduce((best, current) => 
      current.fuelEfficiency > best.fuelEfficiency ? current : best
    );
  }, [state.vehicleAnalytics]);

  // Obtém alertas por severidade
  const getAlertsBySeverity = useCallback(() => {
    const alertsBySeverity = {
      high: state.alerts.filter(alert => alert.severity === 'high'),
      medium: state.alerts.filter(alert => alert.severity === 'medium'),
      low: state.alerts.filter(alert => alert.severity === 'low')
    };

    return alertsBySeverity;
  }, [state.alerts]);

  // Formata valores usando o serviço
  const formatValue = useCallback((value: number, type: 'currency' | 'percentage' | 'distance' | 'time' | 'fuel') => {
    return analyticsService.formatValue(value, type);
  }, [analyticsService]);

  // Calcula tendência de crescimento
  const calculateGrowthTrend = useCallback((data: number[]) => {
    if (data.length < 2) return 0;
    
    const recent = data.slice(-3).reduce((sum, val) => sum + val, 0) / 3;
    const previous = data.slice(-6, -3).reduce((sum, val) => sum + val, 0) / 3;
    
    return previous > 0 ? ((recent - previous) / previous) * 100 : 0;
  }, []);

  // Limpa dados e redefine estado
  const clearData = useCallback(() => {
    setState({
      performance: null,
      routeAnalytics: [],
      vehicleAnalytics: [],
      dailyMetrics: [],
      monthlyTrends: [],
      alerts: [],
      kpis: {},
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }, []);

  // Carrega dados automaticamente na inicialização
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPerformanceMetrics();
      refreshAlerts();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshPerformanceMetrics, refreshAlerts]);

  return {
    // Estado
    ...state,
    
    // Ações
    loadAnalytics,
    refreshPerformanceMetrics,
    refreshAlerts,
    dismissAlert,
    clearData,
    
    // Utilitários
    filterDataByPeriod,
    calculateSummary,
    getBestPerformingVehicle,
    getAlertsBySeverity,
    formatValue,
    calculateGrowthTrend,
    
    // Status
    hasData: state.performance !== null,
    alertCount: state.alerts.length,
    highPriorityAlerts: state.alerts.filter(alert => alert.severity === 'high').length
  };
};