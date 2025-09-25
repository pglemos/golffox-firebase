import { useState, useEffect, useCallback, useRef } from 'react';
import { Route } from '../types';
import { mockTravelTimeService } from '../services/mockTravelTimeService';
import { 
  TravelTimeEstimate, 
  TravelTimeOptions, 
  TrafficUpdate,
  TrafficCondition 
} from '../services/travelTimeService';

export interface TravelTimeState {
  estimates: Map<string, TravelTimeEstimate>;
  loading: Set<string>;
  errors: Map<string, string>;
  lastUpdated: Map<string, Date>;
}

export interface TravelTimeActions {
  calculateRouteTime: (route: Route, options?: TravelTimeOptions) => Promise<void>;
  calculatePointToPointTime: (origin: string, destination: string) => Promise<TravelTimeEstimate | null>;
  startTrafficMonitoring: (routeId: string) => void;
  stopTrafficMonitoring: (routeId: string) => void;
  clearEstimate: (routeId: string) => void;
  clearAllEstimates: () => void;
  refreshEstimate: (routeId: string) => Promise<void>;
}

export interface TravelTimeHookReturn extends TravelTimeState, TravelTimeActions {
  isLoading: (routeId: string) => boolean;
  getEstimate: (routeId: string) => TravelTimeEstimate | undefined;
  getError: (routeId: string) => string | undefined;
  hasEstimate: (routeId: string) => boolean;
  getTotalActiveMonitors: () => number;
  getTrafficSummary: () => TrafficSummary;
}

export interface TrafficSummary {
  totalRoutes: number;
  averageDelay: number;
  worstTrafficCondition: TrafficCondition;
  routesWithHeavyTraffic: number;
}

export const useTravelTime = (): TravelTimeHookReturn => {
  const [estimates, setEstimates] = useState<Map<string, TravelTimeEstimate>>(new Map());
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [lastUpdated, setLastUpdated] = useState<Map<string, Date>>(new Map());
  
  const activeMonitors = useRef<Set<string>>(new Set());
  const routeRefs = useRef<Map<string, Route>>(new Map());
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Função principal para calcular tempo de viagem
  const calculateRouteTime = useCallback(async (route: Route, options: TravelTimeOptions = {}) => {
    const routeId = route.id;
    setLoading(prev => new Set([...prev, routeId]));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(routeId);
      return newErrors;
    });

    // Armazenar referência da rota
    routeRefs.current.set(routeId, route);

    try {
      const estimate = await mockTravelTimeService.calculateRouteTime(routeId, options);
      
      setEstimates(prev => new Map([...prev, [routeId, estimate]]));
      setLastUpdated(prev => new Map([...prev, [routeId, new Date()]]));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrors(prev => new Map([...prev, [routeId, errorMessage]]));
    } finally {
      setLoading(prev => {
        const newLoading = new Set(prev);
        newLoading.delete(routeId);
        return newLoading;
      });
    }
  }, []);

  // Função para calcular tempo entre dois pontos
  const calculatePointToPointTime = useCallback(async (origin: string, destination: string) => {
    try {
      return await mockTravelTimeService.calculatePointToPointTime(origin, destination);
    } catch (error) {
      console.error('Erro ao calcular tempo ponto a ponto:', error);
      return null;
    }
  }, []);

  // Função para iniciar monitoramento de tráfego
  const startTrafficMonitoring = useCallback((routeId: string) => {
    if (activeMonitors.current.has(routeId)) {
      return; // Já está sendo monitorado
    }

    activeMonitors.current.add(routeId);
    
    // Simular atualizações periódicas
    const interval = setInterval(async () => {
      try {
        const estimate = await mockTravelTimeService.calculateRouteTime(routeId);
        setEstimates(prev => new Map([...prev, [routeId, estimate]]));
        setLastUpdated(prev => new Map([...prev, [routeId, new Date()]]));
      } catch (error) {
        console.warn(`Erro ao atualizar monitoramento da rota ${routeId}:`, error);
      }
    }, 30000); // Atualizar a cada 30 segundos

    // Armazenar referência do interval para poder parar depois
    intervalRefs.current.set(routeId, interval);
  }, []);

  // Função para parar monitoramento de tráfego
  const stopTrafficMonitoring = useCallback((routeId: string) => {
    if (!activeMonitors.current.has(routeId)) {
      return; // Não está sendo monitorado
    }

    // Limpar o interval
    const interval = intervalRefs.current.get(routeId);
    if (interval) {
      clearInterval(interval);
      intervalRefs.current.delete(routeId);
    }

    activeMonitors.current.delete(routeId);
    mockTravelTimeService.stopTrafficMonitoring();
  }, []);

  // Função para limpar estimativa específica
  const clearEstimate = useCallback((routeId: string) => {
    setEstimates(prev => {
      const newEstimates = new Map(prev);
      newEstimates.delete(routeId);
      return newEstimates;
    });
    
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(routeId);
      return newErrors;
    });
    
    setLastUpdated(prev => {
      const newLastUpdated = new Map(prev);
      newLastUpdated.delete(routeId);
      return newLastUpdated;
    });

    // Parar monitoramento se ativo
    stopTrafficMonitoring(routeId);
    routeRefs.current.delete(routeId);
  }, [stopTrafficMonitoring]);

  // Função para limpar todas as estimativas
  const clearAllEstimates = useCallback(() => {
    // Parar todos os monitoramentos e limpar intervalos
    intervalRefs.current.forEach((interval, routeId) => {
      clearInterval(interval);
      mockTravelTimeService.stopTrafficMonitoring();
    });
    
    activeMonitors.current.clear();
    routeRefs.current.clear();
    intervalRefs.current.clear();
    setEstimates(new Map());
    setErrors(new Map());
    setLastUpdated(new Map());
    setLoading(new Set());
  }, []);

  // Função para atualizar estimativa existente
  const refreshEstimate = useCallback(async (routeId: string) => {
    const route = routeRefs.current.get(routeId);
    if (!route) {
      setErrors(prev => new Map(prev).set(routeId, 'Rota não encontrada para atualização'));
      return;
    }

    await calculateRouteTime(route, { includeTraffic: true });
  }, [calculateRouteTime]);

  // Funções auxiliares
  const isLoading = useCallback((routeId: string) => loading.has(routeId), [loading]);
  
  const getEstimate = useCallback((routeId: string) => estimates.get(routeId), [estimates]);
  
  const getError = useCallback((routeId: string) => errors.get(routeId), [errors]);
  
  const hasEstimate = useCallback((routeId: string) => estimates.has(routeId), [estimates]);
  
  const getTotalActiveMonitors = useCallback(() => activeMonitors.current.size, []);

  const getTrafficSummary = useCallback((): TrafficSummary => {
    const allEstimates = Array.from(estimates.values());
    
    if (allEstimates.length === 0) {
      return {
        totalRoutes: 0,
        averageDelay: 0,
        worstTrafficCondition: TrafficCondition.LIGHT,
        routesWithHeavyTraffic: 0
      };
    }

    const totalDelay = allEstimates.reduce((sum, estimate) => {
      return sum + estimate.segments.reduce((segSum, segment) => segSum + segment.trafficDelay, 0);
    }, 0);

    const averageDelay = totalDelay / allEstimates.length;

    const trafficConditions = allEstimates.map(e => e.trafficConditions);
    const worstTrafficCondition = trafficConditions.includes(TrafficCondition.SEVERE) 
      ? TrafficCondition.SEVERE
      : trafficConditions.includes(TrafficCondition.HEAVY)
      ? TrafficCondition.HEAVY
      : trafficConditions.includes(TrafficCondition.MODERATE)
      ? TrafficCondition.MODERATE
      : TrafficCondition.LIGHT;

    const routesWithHeavyTraffic = allEstimates.filter(
      e => e.trafficConditions === TrafficCondition.HEAVY || e.trafficConditions === TrafficCondition.SEVERE
    ).length;

    return {
      totalRoutes: allEstimates.length,
      averageDelay,
      worstTrafficCondition,
      routesWithHeavyTraffic
    };
  }, [estimates]);

  // Cleanup ao desmontar o componente
  useEffect(() => {
    return () => {
      clearAllEstimates();
    };
  }, [clearAllEstimates]);

  return {
    // Estado
    estimates,
    loading,
    errors,
    lastUpdated,
    
    // Ações
    calculateRouteTime,
    calculatePointToPointTime,
    startTrafficMonitoring,
    stopTrafficMonitoring,
    clearEstimate,
    clearAllEstimates,
    refreshEstimate,
    
    // Funções auxiliares
    isLoading,
    getEstimate,
    getError,
    hasEstimate,
    getTotalActiveMonitors,
    getTrafficSummary
  };
};