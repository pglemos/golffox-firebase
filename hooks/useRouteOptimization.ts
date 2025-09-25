import { useState, useCallback } from 'react';
import { 
  mockRouteOptimizationService, 
  OptimizedRoute, 
  RouteOptimizationOptions, 
  MultiStopRoute,
  Coordinates 
} from '../services/mockRouteOptimizationService';
import type { Passenger } from '../types';

export interface RouteOptimizationState {
  optimizedRoute: OptimizedRoute | null;
  multiStopRoute: MultiStopRoute | null;
  isOptimizing: boolean;
  error: string | null;
  lastOptimized: Date | null;
  optimizationHistory: OptimizedRoute[];
}

export interface UseRouteOptimizationReturn {
  // Estado
  state: RouteOptimizationState;
  
  // Ações
  optimizeRoute: (options: RouteOptimizationOptions) => Promise<void>;
  calculateMultiStopRoute: (options: RouteOptimizationOptions) => Promise<void>;
  generateMockPassengers: (count?: number) => Passenger[];
  getAvailableRoutes: () => Array<{
    id: string;
    name: string;
    startLocation: Coordinates;
    destination: Coordinates;
    passengerCount: number;
  }>;
  clearResults: () => void;
  clearError: () => void;
  
  // Utilitários
  formatDistance: (meters: number) => string;
  formatDuration: (seconds: number) => string;
  formatTime: (date: Date) => string;
  calculateSavings: (route: OptimizedRoute) => {
    distanceSaved: string;
    timeSaved: string;
    fuelSaved: string;
    costSaved: string;
  };
}

export const useRouteOptimization = (): UseRouteOptimizationReturn => {
  const [state, setState] = useState<RouteOptimizationState>({
    optimizedRoute: null,
    multiStopRoute: null,
    isOptimizing: false,
    error: null,
    lastOptimized: null,
    optimizationHistory: []
  });

  const optimizeRoute = useCallback(async (options: RouteOptimizationOptions) => {
    setState(prev => ({
      ...prev,
      isOptimizing: true,
      error: null
    }));

    try {
      const optimizedRoute = await mockRouteOptimizationService.optimizeRoute(options);
      
      setState(prev => ({
        ...prev,
        optimizedRoute,
        isOptimizing: false,
        lastOptimized: new Date(),
        optimizationHistory: [optimizedRoute, ...prev.optimizationHistory.slice(0, 4)] // Mantém últimas 5
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na otimização'
      }));
    }
  }, []);

  const calculateMultiStopRoute = useCallback(async (options: RouteOptimizationOptions) => {
    setState(prev => ({
      ...prev,
      isOptimizing: true,
      error: null
    }));

    try {
      const multiStopRoute = await mockRouteOptimizationService.calculateMultiStopRoute(options);
      
      setState(prev => ({
        ...prev,
        multiStopRoute,
        isOptimizing: false,
        lastOptimized: new Date()
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido no cálculo da rota'
      }));
    }
  }, []);

  const generateMockPassengers = useCallback((count: number = 5): Passenger[] => {
    return mockRouteOptimizationService.generateMockPassengers(count);
  }, []);

  const getAvailableRoutes = useCallback(() => {
    return mockRouteOptimizationService.getAvailableRoutes();
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      optimizedRoute: null,
      multiStopRoute: null,
      error: null
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Utilitários de formatação
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }, []);

  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }, []);

  const formatTime = useCallback((date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const calculateSavings = useCallback((route: OptimizedRoute) => {
    const { optimizationSavings } = route;
    const distanceSaved = formatDistance(optimizationSavings.originalDistance - optimizationSavings.optimizedDistance);
    const timeSaved = `${Math.round(optimizationSavings.timeSaved)} min`;
    const fuelSaved = `${optimizationSavings.fuelSaved.toFixed(1)} L`;
    const costSaved = `R$ ${(optimizationSavings.fuelSaved * 5.50).toFixed(2)}`;

    return {
      distanceSaved,
      timeSaved,
      fuelSaved,
      costSaved
    };
  }, [formatDistance]);

  return {
    state,
    optimizeRoute,
    calculateMultiStopRoute,
    generateMockPassengers,
    getAvailableRoutes,
    clearResults,
    clearError,
    formatDistance,
    formatDuration,
    formatTime,
    calculateSavings
  };
};