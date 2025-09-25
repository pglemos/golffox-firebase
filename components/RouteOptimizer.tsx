import React, { useState, useEffect } from 'react';
import { useRouteOptimization } from '../hooks/useRouteOptimization';
import { RouteOptimizationOptions, Coordinates } from '../services/mockRouteOptimizationService';
import type { Passenger } from '../types';
import {
  Route,
  MapPin,
  Users,
  Clock,
  Fuel,
  DollarSign,
  TrendingUp,
  Navigation,
  Shuffle,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  Settings
} from 'lucide-react';

interface RouteOptimizerProps {
  onRouteOptimized?: (route: any) => void;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ onRouteOptimized }) => {
  const {
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
  } = useRouteOptimization();

  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [passengerCount, setPassengerCount] = useState(5);
  const [optimizeOrder, setOptimizeOrder] = useState(true);
  const [vehicleType, setVehicleType] = useState<'bus' | 'van' | 'car'>('bus');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const availableRoutes = getAvailableRoutes();

  useEffect(() => {
    // Gera passageiros mock quando o componente é montado
    const mockPassengers = generateMockPassengers(passengerCount);
    setPassengers(mockPassengers);
  }, [generateMockPassengers, passengerCount]);

  useEffect(() => {
    // Define horário padrão como agora + 30 minutos
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setDepartureTime(now.toISOString().slice(0, 16));
  }, []);

  const handleOptimizeRoute = async () => {
    if (!selectedRoute) {
      return;
    }

    const route = availableRoutes.find(r => r.id === selectedRoute);
    if (!route) return;

    const options: RouteOptimizationOptions = {
      startLocation: route.startLocation,
      passengers: passengers.slice(0, passengerCount),
      destination: route.destination,
      optimizeOrder,
      vehicleType,
      departureTime: departureTime ? new Date(departureTime) : new Date()
    };

    await optimizeRoute(options);
    
    if (state.optimizedRoute && onRouteOptimized) {
      onRouteOptimized(state.optimizedRoute);
    }
  };

  const handleCalculateMultiStop = async () => {
    if (!selectedRoute) return;

    const route = availableRoutes.find(r => r.id === selectedRoute);
    if (!route) return;

    const options: RouteOptimizationOptions = {
      startLocation: route.startLocation,
      passengers: passengers.slice(0, passengerCount),
      destination: route.destination,
      optimizeOrder,
      vehicleType,
      departureTime: departureTime ? new Date(departureTime) : new Date()
    };

    await calculateMultiStopRoute(options);
  };

  const handleRegeneratePassengers = () => {
    const newPassengers = generateMockPassengers(passengerCount);
    setPassengers(newPassengers);
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'van': return '🚐';
      case 'car': return '🚗';
      default: return '🚌';
    }
  };

  return (
    <div className="space-y-6">
      {/* Configurações */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Configurações da Rota</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Settings className="w-4 h-4" />
            <span>{showAdvanced ? 'Ocultar' : 'Avançado'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seleção de rota */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rota Base
            </label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma rota...</option>
              {availableRoutes.map(route => (
                <option key={route.id} value={route.id}>
                  {route.name} ({route.passengerCount} passageiros)
                </option>
              ))}
            </select>
          </div>

          {/* Número de passageiros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Passageiros
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="p-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 border border-gray-300 rounded bg-white min-w-[60px] text-center">
                {passengerCount}
              </span>
              <button
                onClick={() => setPassengerCount(Math.min(10, passengerCount + 1))}
                className="p-1 border border-gray-300 rounded hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleRegeneratePassengers}
                className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                title="Gerar novos passageiros"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showAdvanced && (
            <>
              {/* Tipo de veículo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Veículo
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as 'bus' | 'van' | 'car')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bus">🚌 Ônibus</option>
                  <option value="van">🚐 Van</option>
                  <option value="car">🚗 Carro</option>
                </select>
              </div>

              {/* Horário de partida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Partida
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
        </div>

        {/* Opções */}
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={optimizeOrder}
              onChange={(e) => setOptimizeOrder(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Otimizar ordem dos passageiros</span>
          </label>
        </div>

        {/* Botões de ação */}
        <div className="mt-4 flex space-x-3">
          <button
            onClick={handleOptimizeRoute}
            disabled={!selectedRoute || state.isOptimizing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Route className="w-4 h-4" />
            )}
            <span>Otimizar Rota</span>
          </button>

          <button
            onClick={handleCalculateMultiStop}
            disabled={!selectedRoute || state.isOptimizing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isOptimizing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            <span>Calcular Segmentos</span>
          </button>

          {(state.optimizedRoute || state.multiStopRoute) && (
            <button
              onClick={clearResults}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de passageiros */}
      {passengers.length > 0 && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Passageiros ({passengers.slice(0, passengerCount).length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {passengers.slice(0, passengerCount).map((passenger, index) => (
              <div key={passenger.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{passenger.name}</p>
                  <p className="text-xs text-gray-500 truncate">{passenger.cpf}</p>
                </div>
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Erro */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{state.error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Resultado da otimização */}
      {state.optimizedRoute && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Rota Otimizada</h3>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Route className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-blue-600">
                {formatDistance(state.optimizedRoute.totalDistance)}
              </div>
              <div className="text-xs text-gray-600">Distância Total</div>
            </div>

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-green-600">
                {formatDuration(state.optimizedRoute.totalDuration)}
              </div>
              <div className="text-xs text-gray-600">Tempo Total</div>
            </div>

            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Fuel className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-yellow-600">
                {calculateSavings(state.optimizedRoute).fuelSaved}
              </div>
              <div className="text-xs text-gray-600">Combustível Economizado</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-purple-600">
                {calculateSavings(state.optimizedRoute).costSaved}
              </div>
              <div className="text-xs text-gray-600">Economia</div>
            </div>
          </div>

          {/* Economia da otimização */}
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-green-800 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Benefícios da Otimização
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-green-700">Distância economizada:</span>
                <div className="font-medium">{calculateSavings(state.optimizedRoute).distanceSaved}</div>
              </div>
              <div>
                <span className="text-green-700">Tempo economizado:</span>
                <div className="font-medium">{calculateSavings(state.optimizedRoute).timeSaved}</div>
              </div>
              <div>
                <span className="text-green-700">Combustível economizado:</span>
                <div className="font-medium">{calculateSavings(state.optimizedRoute).fuelSaved}</div>
              </div>
            </div>
          </div>

          {/* Ordem dos passageiros */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Ordem de Coleta Otimizada</h4>
            <div className="space-y-2">
              {state.optimizedRoute.orderedPassengers.map((passenger, index) => {
                const pickupTime = state.optimizedRoute?.pickupTimes.find(pt => pt.passenger.id === passenger.id);
                return (
                  <div key={passenger.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{passenger.name}</div>
                      <div className="text-sm text-gray-600">{passenger.cpf}</div>
                    </div>
                    {pickupTime && (
                      <div className="text-sm text-gray-600">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {formatTime(pickupTime.estimatedPickupTime)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resultado dos segmentos */}
      {state.multiStopRoute && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Análise de Segmentos</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Eficiência:</span>
              <span className="font-bold text-green-600">{state.multiStopRoute.efficiency.toFixed(1)}%</span>
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatDistance(state.multiStopRoute.totalDistance)}
              </div>
              <div className="text-xs text-gray-600">Distância</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formatDuration(state.multiStopRoute.totalDuration)}
              </div>
              <div className="text-xs text-gray-600">Duração</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {state.multiStopRoute.estimatedFuelConsumption.toFixed(1)}L
              </div>
              <div className="text-xs text-gray-600">Combustível</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                R$ {state.multiStopRoute.estimatedCost.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Custo</div>
            </div>
          </div>

          {/* Segmentos */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Segmentos da Rota</h4>
            <div className="space-y-2">
              {state.multiStopRoute.segments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    segment.type === 'pickup' ? 'bg-green-100 text-green-600' :
                    segment.type === 'dropoff' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {segment.type === 'pickup' ? '↑' : segment.type === 'dropoff' ? '↓' : '→'}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {segment.type === 'pickup' && segment.passenger ? 
                        `Coletar: ${segment.passenger.name}` :
                        segment.type === 'dropoff' ? 'Destino Final' :
                        'Trânsito'
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDistance(segment.distance)} • {formatDuration(segment.duration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteOptimizer;