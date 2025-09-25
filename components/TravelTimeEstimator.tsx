import React, { useState, useEffect } from 'react';
import { Route } from '../types';
import { useTravelTime } from '../hooks/useTravelTime';
import { mockTravelTimeService } from '../services/mockTravelTimeService';
import { TrafficCondition } from '../services/travelTimeService';
import { 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Navigation,
  Users,
  Route as RouteIcon,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface TravelTimeEstimatorProps {
  routes: Route[];
  onRouteSelect?: (routeId: string) => void;
  showTrafficMonitoring?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em segundos
}

const TravelTimeEstimator: React.FC<TravelTimeEstimatorProps> = ({
  routes,
  onRouteSelect,
  showTrafficMonitoring = true,
  autoRefresh = false,
  refreshInterval = 300 // 5 minutos
}) => {
  const {
    calculateRouteTime,
    startTrafficMonitoring,
    stopTrafficMonitoring,
    refreshEstimate,
    clearAllEstimates,
    isLoading,
    getEstimate,
    getError,
    hasEstimate,
    getTotalActiveMonitors,
    getTrafficSummary
  } = useTravelTime();

  // Usar rotas do serviço mock
  const availableRoutes = mockTravelTimeService.getAvailableRoutes();

  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [monitoringRoutes, setMonitoringRoutes] = useState<Set<string>>(new Set());

  // Auto-refresh das estimativas
  useEffect(() => {
    if (!autoRefresh || selectedRoutes.size === 0) return;

    const interval = setInterval(() => {
      selectedRoutes.forEach(routeId => {
        refreshEstimate(routeId);
      });
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, selectedRoutes, refreshEstimate]);

  // Calcular estimativa para uma rota
  const handleCalculateRoute = async (route: Route) => {
    setSelectedRoutes(prev => new Set(prev).add(route.id));
    await calculateRouteTime(route);
  };

  // Alternar monitoramento de trânsito
  const toggleTrafficMonitoring = (routeId: string) => {
    if (monitoringRoutes.has(routeId)) {
      stopTrafficMonitoring(routeId);
      setMonitoringRoutes(prev => {
        const newSet = new Set(prev);
        newSet.delete(routeId);
        return newSet;
      });
    } else {
      startTrafficMonitoring(routeId);
      setMonitoringRoutes(prev => new Set(prev).add(routeId));
    }
  };

  // Obter ícone de condição de trânsito
  const getTrafficIcon = (condition: TrafficCondition) => {
    switch (condition) {
      case TrafficCondition.LIGHT:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case TrafficCondition.MODERATE:
        return <Minus className="w-4 h-4 text-yellow-500" />;
      case TrafficCondition.HEAVY:
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case TrafficCondition.SEVERE:
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Obter cor de fundo baseada na condição de trânsito
  const getTrafficBgColor = (condition: TrafficCondition) => {
    switch (condition) {
      case TrafficCondition.LIGHT:
        return 'bg-green-50 border-green-200';
      case TrafficCondition.MODERATE:
        return 'bg-yellow-50 border-yellow-200';
      case TrafficCondition.HEAVY:
        return 'bg-orange-50 border-orange-200';
      case TrafficCondition.SEVERE:
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Formatar duração em texto legível
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Formatar distância
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const trafficSummary = getTrafficSummary();

  return (
    <div className="space-y-6">
      {/* Cabeçalho com resumo */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Estimativas de Tempo de Viagem</h2>
          <div className="flex items-center space-x-4">
            {showTrafficMonitoring && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Navigation className="w-4 h-4" />
                <span>{getTotalActiveMonitors()} rotas monitoradas</span>
              </div>
            )}
            <button
              onClick={clearAllEstimates}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Limpar Tudo</span>
            </button>
          </div>
        </div>

        {/* Resumo de trânsito */}
        {trafficSummary.totalRoutes > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{trafficSummary.totalRoutes}</div>
              <div className="text-sm text-gray-600">Rotas Calculadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatDuration(Math.round(trafficSummary.averageDelay))}</div>
              <div className="text-sm text-gray-600">Atraso Médio</div>
            </div>
            <div className="text-center flex flex-col items-center">
              <div className="flex items-center space-x-2">
                {getTrafficIcon(trafficSummary.worstTrafficCondition)}
                <span className="text-lg font-semibold capitalize">{trafficSummary.worstTrafficCondition}</span>
              </div>
              <div className="text-sm text-gray-600">Pior Condição</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{trafficSummary.routesWithHeavyTraffic}</div>
              <div className="text-sm text-gray-600">Trânsito Pesado</div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de rotas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {routes.map(route => {
          const estimate = getEstimate(route.id);
          const error = getError(route.id);
          const loading = isLoading(route.id);
          const isMonitoring = monitoringRoutes.has(route.id);

          return (
            <div
              key={route.id}
              className={`bg-white rounded-lg shadow-md border-2 transition-all ${
                estimate ? getTrafficBgColor(estimate.trafficConditions) : 'border-gray-200'
              }`}
            >
              {/* Cabeçalho da rota */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{route.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{route.passengers.list.length} passageiros</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RouteIcon className="w-4 h-4" />
                        <span>{route.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!hasEstimate(route.id) && (
                      <button
                        onClick={() => handleCalculateRoute(route)}
                        disabled={loading}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>{loading ? 'Calculando...' : 'Calcular'}</span>
                      </button>
                    )}
                    
                    {hasEstimate(route.id) && showTrafficMonitoring && (
                      <button
                        onClick={() => toggleTrafficMonitoring(route.id)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          isMonitoring 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Navigation className="w-4 h-4" />
                        <span>{isMonitoring ? 'Monitorando' : 'Monitorar'}</span>
                      </button>
                    )}
                    
                    {hasEstimate(route.id) && (
                      <button
                        onClick={() => refreshEstimate(route.id)}
                        disabled={loading}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Conteúdo da estimativa */}
              <div className="p-4">
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {estimate && (
                  <div className="space-y-4">
                    {/* Informações principais */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatDuration(estimate.totalDuration)}
                        </div>
                        <div className="text-sm text-gray-600">Tempo Total</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">
                          {formatDistance(estimate.totalDistance)}
                        </div>
                        <div className="text-sm text-gray-600">Distância</div>
                      </div>
                    </div>

                    {/* Condição de trânsito */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-2">
                        {getTrafficIcon(estimate.trafficConditions)}
                        <span className="font-medium capitalize">{estimate.trafficConditions}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Chegada: {estimate.estimatedArrival.toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    {/* Segmentos da rota */}
                    {estimate.segments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Segmentos da Rota</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {estimate.segments.map((segment, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-3 h-3 text-gray-500" />
                                <span className="truncate max-w-32">
                                  {segment.passengerPickup?.name || `Parada ${index + 1}`}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-600">
                                <span>{formatDuration(segment.duration)}</span>
                                {segment.trafficDelay > 0 && (
                                  <span className="text-red-500">+{formatDuration(segment.trafficDelay)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rotas alternativas */}
                    {estimate.alternativeRoutes && estimate.alternativeRoutes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Rotas Alternativas</h4>
                        <div className="space-y-2">
                          {estimate.alternativeRoutes.map((altRoute, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded text-sm">
                              <span className="font-medium">{altRoute.name}</span>
                              <div className="flex items-center space-x-2">
                                <span>{formatDuration(altRoute.duration)}</span>
                                {altRoute.savings > 0 ? (
                                  <span className="text-green-600 flex items-center">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    -{formatDuration(altRoute.savings)}
                                  </span>
                                ) : altRoute.savings < 0 ? (
                                  <span className="text-red-600 flex items-center">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    +{formatDuration(Math.abs(altRoute.savings))}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!estimate && !error && !loading && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Clique em &quot;Calcular&quot; para obter a estimativa de tempo</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {routes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <RouteIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Nenhuma rota disponível</p>
          <p className="text-sm">Adicione rotas para calcular estimativas de tempo</p>
        </div>
      )}
    </div>
  );
};

export default TravelTimeEstimator;