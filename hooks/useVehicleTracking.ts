import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  mockVehicleTrackingService, 
  Vehicle, 
  VehicleLocation, 
  TrackingEvent, 
  VehicleMetrics 
} from '../services/mockVehicleTrackingService';

export interface VehicleTrackingState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  locationHistory: VehicleLocation[];
  metrics: VehicleMetrics | null;
  events: TrackingEvent[];
  isTracking: boolean;
  loading: boolean;
  error: string | null;
}

export interface UseVehicleTrackingReturn {
  // Estado
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  locationHistory: VehicleLocation[];
  metrics: VehicleMetrics | null;
  events: TrackingEvent[];
  isTracking: boolean;
  loading: boolean;
  error: string | null;

  // Ações
  selectVehicle: (vehicleId: string | null) => void;
  startTracking: (vehicleId: string) => void;
  stopTracking: (vehicleId: string) => void;
  startAllTracking: () => void;
  stopAllTracking: () => void;
  updateVehicleStatus: (vehicleId: string, status: Vehicle['status']) => void;
  simulateEmergency: (vehicleId: string, type?: string) => void;
  refreshVehicles: () => void;
  clearEvents: () => void;
  getNearbyVehicles: (lat: number, lng: number, radius?: number) => Vehicle[];

  // Utilitários
  formatSpeed: (speed: number) => string;
  formatDistance: (distance: number) => string;
  formatDuration: (hours: number) => string;
  getStatusColor: (status: Vehicle['status']) => string;
  getStatusLabel: (status: Vehicle['status']) => string;
}

export const useVehicleTracking = (): UseVehicleTrackingReturn => {
  const [state, setState] = useState<VehicleTrackingState>({
    vehicles: [],
    selectedVehicle: null,
    locationHistory: [],
    metrics: null,
    events: [],
    isTracking: false,
    loading: true,
    error: null
  });

  const eventListenerId = useRef<string>(`listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const trackingVehicles = useRef<Set<string>>(new Set());

  // Carrega veículos iniciais
  useEffect(() => {
    loadVehicles();
    
    // Adiciona listener para eventos
    mockVehicleTrackingService.addEventListener(eventListenerId.current, handleTrackingEvent);

    return () => {
      // Cleanup
      mockVehicleTrackingService.removeEventListener(eventListenerId.current);
      mockVehicleTrackingService.stopAllTracking();
    };
  }, []);

  // Atualiza histórico quando veículo selecionado muda
  useEffect(() => {
    if (state.selectedVehicle) {
      loadLocationHistory(state.selectedVehicle.id);
      loadMetrics(state.selectedVehicle.id);
    } else {
      setState(prev => ({
        ...prev,
        locationHistory: [],
        metrics: null
      }));
    }
  }, [state.selectedVehicle]);

  const loadVehicles = useCallback(() => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const vehicles = mockVehicleTrackingService.getVehicles();
      setState(prev => ({ 
        ...prev, 
        vehicles, 
        loading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao carregar veículos', 
        loading: false 
      }));
    }
  }, []);

  const loadLocationHistory = useCallback((vehicleId: string) => {
    try {
      const history = mockVehicleTrackingService.getVehicleLocationHistory(vehicleId, 100);
      setState(prev => ({ ...prev, locationHistory: history }));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  const loadMetrics = useCallback((vehicleId: string) => {
    try {
      const metrics = mockVehicleTrackingService.getVehicleMetrics(vehicleId);
      setState(prev => ({ ...prev, metrics }));
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  }, []);

  const handleTrackingEvent = useCallback((event: TrackingEvent) => {
    setState(prev => {
      const newEvents = [event, ...prev.events].slice(0, 50); // Mantém últimos 50 eventos
      
      // Atualiza veículo se necessário
      let updatedVehicles = prev.vehicles;
      if (event.type === 'location_update' || event.type === 'status_change') {
        const updatedVehicle = mockVehicleTrackingService.getVehicle(event.vehicleId);
        if (updatedVehicle) {
          updatedVehicles = prev.vehicles.map(v => 
            v.id === event.vehicleId ? updatedVehicle : v
          );
        }
      }

      // Atualiza veículo selecionado se for o mesmo
      let updatedSelectedVehicle = prev.selectedVehicle;
      if (prev.selectedVehicle?.id === event.vehicleId) {
        updatedSelectedVehicle = mockVehicleTrackingService.getVehicle(event.vehicleId) || null;
      }

      return {
        ...prev,
        vehicles: updatedVehicles,
        selectedVehicle: updatedSelectedVehicle,
        events: newEvents
      };
    });

    // Atualiza histórico se for o veículo selecionado
    if (event.type === 'location_update' && state.selectedVehicle?.id === event.vehicleId) {
      loadLocationHistory(event.vehicleId);
      loadMetrics(event.vehicleId);
    }
  }, [state.selectedVehicle, loadLocationHistory, loadMetrics]);

  const selectVehicle = useCallback((vehicleId: string | null) => {
    const vehicle = vehicleId ? mockVehicleTrackingService.getVehicle(vehicleId) : null;
    setState(prev => ({ ...prev, selectedVehicle: vehicle }));
  }, []);

  const startTracking = useCallback((vehicleId: string) => {
    try {
      mockVehicleTrackingService.startTracking(vehicleId, 3000); // Atualiza a cada 3 segundos
      trackingVehicles.current.add(vehicleId);
      setState(prev => ({ ...prev, isTracking: trackingVehicles.current.size > 0 }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao iniciar rastreamento' }));
    }
  }, []);

  const stopTracking = useCallback((vehicleId: string) => {
    try {
      mockVehicleTrackingService.stopTracking(vehicleId);
      trackingVehicles.current.delete(vehicleId);
      setState(prev => ({ ...prev, isTracking: trackingVehicles.current.size > 0 }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao parar rastreamento' }));
    }
  }, []);

  const startAllTracking = useCallback(() => {
    try {
      const activeVehicles = state.vehicles.filter(v => v.status === 'active');
      activeVehicles.forEach(vehicle => {
        mockVehicleTrackingService.startTracking(vehicle.id, 3000);
        trackingVehicles.current.add(vehicle.id);
      });
      setState(prev => ({ ...prev, isTracking: true }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao iniciar rastreamento geral' }));
    }
  }, [state.vehicles]);

  const stopAllTracking = useCallback(() => {
    try {
      mockVehicleTrackingService.stopAllTracking();
      trackingVehicles.current.clear();
      setState(prev => ({ ...prev, isTracking: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao parar rastreamento geral' }));
    }
  }, []);

  const updateVehicleStatus = useCallback((vehicleId: string, status: Vehicle['status']) => {
    try {
      mockVehicleTrackingService.updateVehicleStatus(vehicleId, status);
      
      // Para rastreamento se status não for ativo
      if (status !== 'active') {
        stopTracking(vehicleId);
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao atualizar status do veículo' }));
    }
  }, [stopTracking]);

  const simulateEmergency = useCallback((vehicleId: string, type: string = 'breakdown') => {
    try {
      mockVehicleTrackingService.simulateEmergency(vehicleId, type);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Erro ao simular emergência' }));
    }
  }, []);

  const refreshVehicles = useCallback(() => {
    loadVehicles();
  }, [loadVehicles]);

  const clearEvents = useCallback(() => {
    setState(prev => ({ ...prev, events: [] }));
  }, []);

  const getNearbyVehicles = useCallback((lat: number, lng: number, radius: number = 5) => {
    return mockVehicleTrackingService.getNearbyVehicles(lat, lng, radius);
  }, []);

  // Utilitários
  const formatSpeed = useCallback((speed: number): string => {
    return `${Math.round(speed)} km/h`;
  }, []);

  const formatDistance = useCallback((distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  }, []);

  const formatDuration = useCallback((hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} h`;
  }, []);

  const getStatusColor = useCallback((status: Vehicle['status']): string => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      case 'maintenance': return 'text-yellow-600';
      case 'emergency': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }, []);

  const getStatusLabel = useCallback((status: Vehicle['status']): string => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'maintenance': return 'Manutenção';
      case 'emergency': return 'Emergência';
      default: return 'Desconhecido';
    }
  }, []);

  return {
    // Estado
    vehicles: state.vehicles,
    selectedVehicle: state.selectedVehicle,
    locationHistory: state.locationHistory,
    metrics: state.metrics,
    events: state.events,
    isTracking: state.isTracking,
    loading: state.loading,
    error: state.error,

    // Ações
    selectVehicle,
    startTracking,
    stopTracking,
    startAllTracking,
    stopAllTracking,
    updateVehicleStatus,
    simulateEmergency,
    refreshVehicles,
    clearEvents,
    getNearbyVehicles,

    // Utilitários
    formatSpeed,
    formatDistance,
    formatDuration,
    getStatusColor,
    getStatusLabel
  };
};