import React, { useState } from 'react';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { Vehicle, TrackingEvent } from '../services/mockVehicleTrackingService';
import { 
  Truck, 
  Play, 
  Pause, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Settings, 
  RefreshCw,
  Trash2,
  Navigation,
  Clock,
  Fuel,
  Users,
  TrendingUp
} from 'lucide-react';

const VehicleTracker: React.FC = () => {
  const {
    vehicles,
    selectedVehicle,
    locationHistory,
    metrics,
    events,
    isTracking,
    loading,
    error,
    selectVehicle,
    startTracking,
    stopTracking,
    startAllTracking,
    stopAllTracking,
    updateVehicleStatus,
    simulateEmergency,
    refreshVehicles,
    clearEvents,
    formatSpeed,
    formatDistance,
    formatDuration,
    getStatusColor,
    getStatusLabel
  } = useVehicleTracking();

  const [showEvents, setShowEvents] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'vehicles' | 'tracking' | 'metrics'>('vehicles');

  const handleStatusChange = (vehicleId: string, newStatus: Vehicle['status']) => {
    updateVehicleStatus(vehicleId, newStatus);
  };

  const getEventIcon = (event: TrackingEvent) => {
    switch (event.type) {
      case 'location_update': return <MapPin className="w-4 h-4 text-blue-500" />;
      case 'status_change': return <Settings className="w-4 h-4 text-yellow-500" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'route_start': return <Play className="w-4 h-4 text-green-500" />;
      case 'route_end': return <Pause className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatEventTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando veículos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles principais */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">Rastreamento de Veículos</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isTracking ? 'Rastreando' : 'Parado'}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshVehicles}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
          
          {isTracking ? (
            <button
              onClick={stopAllTracking}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Parar Todos</span>
            </button>
          ) : (
            <button
              onClick={startAllTracking}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Rastrear Todos</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'vehicles', label: 'Veículos', icon: Truck },
            { id: 'tracking', label: 'Rastreamento', icon: Navigation },
            { id: 'metrics', label: 'Métricas', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedTab(id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      {selectedTab === 'vehicles' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de veículos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Frota ({vehicles.length} veículos)</h3>
            <div className="space-y-3">
              {vehicles.map(vehicle => (
                <div
                  key={vehicle.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedVehicle?.id === vehicle.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => selectVehicle(vehicle.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Truck className={`w-5 h-5 ${getStatusColor(vehicle.status)}`} />
                      <div>
                        <div className="font-medium">{vehicle.plate}</div>
                        <div className="text-sm text-gray-600">{vehicle.model}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getStatusColor(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.currentPassengers}/{vehicle.capacity} passageiros
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Motorista: {vehicle.driver}
                    </div>
                    <div className="flex space-x-2">
                      {vehicle.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startTracking(vehicle.id);
                          }}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateEmergency(vehicle.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalhes do veículo selecionado */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedVehicle ? `Detalhes - ${selectedVehicle.plate}` : 'Selecione um veículo'}
            </h3>
            
            {selectedVehicle ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={selectedVehicle.status}
                      onChange={(e) => handleStatusChange(selectedVehicle.id, e.target.value as Vehicle['status'])}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="maintenance">Manutenção</option>
                      <option value="emergency">Emergência</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Capacidade</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {selectedVehicle.currentPassengers}/{selectedVehicle.capacity} passageiros
                    </div>
                  </div>
                </div>

                {selectedVehicle.lastLocation && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Última Localização</label>
                    <div className="mt-1 text-sm text-gray-900">
                      <div>Lat: {selectedVehicle.lastLocation.lat.toFixed(6)}</div>
                      <div>Lng: {selectedVehicle.lastLocation.lng.toFixed(6)}</div>
                      <div>Velocidade: {formatSpeed(selectedVehicle.lastLocation.speed)}</div>
                      <div>Atualizado: {formatEventTime(selectedVehicle.lastLocation.timestamp)}</div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => startTracking(selectedVehicle.id)}
                    disabled={selectedVehicle.status !== 'active'}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Rastrear</span>
                  </button>
                  <button
                    onClick={() => stopTracking(selectedVehicle.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Parar</span>
                  </button>
                  <button
                    onClick={() => simulateEmergency(selectedVehicle.id)}
                    className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Emergência</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecione um veículo para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'tracking' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Histórico de localizações */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Histórico de Localizações
                {selectedVehicle && ` - ${selectedVehicle.plate}`}
              </h3>
              {locationHistory.length > 0 && (
                <span className="text-sm text-gray-500">
                  {locationHistory.length} pontos
                </span>
              )}
            </div>
            
            {selectedVehicle ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {locationHistory.length > 0 ? (
                  locationHistory.slice().reverse().map((location, index) => (
                    <div key={location.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium">
                            {formatEventTime(location.timestamp)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatSpeed(location.speed)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma localização registrada</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Navigation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecione um veículo para ver o histórico</p>
              </div>
            )}
          </div>

          {/* Eventos em tempo real */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Eventos em Tempo Real</h3>
              <div className="flex space-x-2">
                <button
                  onClick={clearEvents}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-500">
                  {events.length} eventos
                </span>
              </div>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <div key={`${event.id}-${index}`} className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getEventIcon(event)}
                      <span className="text-sm font-medium">
                        {formatEventTime(event.timestamp)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {vehicles.find(v => v.id === event.vehicleId)?.plate}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {event.type === 'location_update' && 'Localização atualizada'}
                      {event.type === 'status_change' && `Status alterado: ${event.data.oldStatus} → ${event.data.newStatus}`}
                      {event.type === 'emergency' && `Emergência: ${event.data.type}`}
                      {event.type === 'route_start' && 'Rota iniciada'}
                      {event.type === 'route_end' && 'Rota finalizada'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum evento registrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'metrics' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Métricas de Performance
            {selectedVehicle && ` - ${selectedVehicle.plate}`}
          </h3>
          
          {selectedVehicle && metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
                  <Navigation className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDistance(metrics.totalDistance)}
                </div>
                <div className="text-sm text-gray-600">Distância Total</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatSpeed(metrics.averageSpeed)}
                </div>
                <div className="text-sm text-gray-600">Velocidade Média</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-3">
                  <Fuel className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.fuelConsumption.toFixed(1)}L
                </div>
                <div className="text-sm text-gray-600">Combustível</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatDuration(metrics.uptime)}
                </div>
                <div className="text-sm text-gray-600">Tempo Ativo</div>
              </div>

              <div className="md:col-span-2 lg:col-span-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Eficiência</span>
                    <span className="text-sm text-gray-600">{metrics.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${metrics.efficiency}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {selectedVehicle 
                  ? 'Aguardando dados de rastreamento...' 
                  : 'Selecione um veículo para ver as métricas'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleTracker;