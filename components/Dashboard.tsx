import React, { useState } from 'react';
import { MOCK_ROUTES, MOCK_VEHICLES, MOCK_ALERTS } from '../constants';
import { UserGroupIcon, TruckIcon, ChartBarIcon, ExclamationTriangleIcon } from './icons/Icons';
import { AlertType } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { NotificationContainer } from './NotificationToast';
import NotificationDemo from './NotificationDemo';
import TravelTimeEstimator from './TravelTimeEstimator';
import AddressValidator from './AddressValidator';
import RouteOptimizer from './RouteOptimizer';
import VehicleTracker from './VehicleTracker';
import AnalyticsDashboard from './AnalyticsDashboard';
import { ReportExporter } from './ReportExporter';
import { InteractiveCharts } from './InteractiveCharts';
import { AdvancedFilters, FilterOptions } from './AdvancedFilters';
import { UserSettings } from './UserSettings';
import { ThemeToggleIcon } from './ThemeToggle';
import { useAdvancedFilters } from '../hooks/useAdvancedFilters';
import { useUserSettings } from '../hooks/useUserSettings';
import { Bell, BellRing, Settings, Clock, Route, MapPin, Navigation, Truck, BarChart3, Download, Activity, Filter, User } from 'lucide-react';

const InfoCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  borderColor: string;
  isAlert?: boolean;
  onClick?: () => void;
}> = ({ title, value, icon, borderColor, isAlert, onClick }) => (
  <div 
    className={`bg-golffox-white rounded-lg shadow-md p-4 sm:p-6 flex flex-col justify-between border-t-4 ${borderColor} ${isAlert ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <h3 className="text-sm sm:text-lg font-medium text-golffox-gray-medium">{title}</h3>
      <div className={`${isAlert && parseInt(value) > 0 ? 'text-red-600 animate-pulse' : 'text-golffox-orange-primary'}`}>
        {icon}
      </div>
    </div>
    <p className={`text-2xl sm:text-4xl font-bold mt-2 ${isAlert && parseInt(value) > 0 ? 'text-red-600' : 'text-golffox-gray-dark'}`}>
      {value}
    </p>
  </div>
);

const Dashboard: React.FC = () => {
  const [showNotificationDemo, setShowNotificationDemo] = useState(false);
  const [showTravelTimeEstimator, setShowTravelTimeEstimator] = useState(false);
  const [showAddressValidator, setShowAddressValidator] = useState(false);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [showVehicleTracker, setShowVehicleTracker] = useState(false);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [showReportExporter, setShowReportExporter] = useState(false);
  const [showInteractiveCharts, setShowInteractiveCharts] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);
  
  // Hooks de notificação
  const { stats, hasCriticalAlerts, alertsByType } = useNotifications({ autoCheck: true });
  const { toasts, removeToast, showInfo, position } = useToastNotifications();

  // Preparar dados para filtros
  const allData = [
    ...MOCK_VEHICLES.map(v => ({
      id: v.id,
      name: v.driver,
      description: `${v.model} - ${v.plate}`,
      date: new Date().toISOString(),
      vehicleType: v.model.includes('Van') ? 'Van' : v.model.includes('Ônibus') ? 'Ônibus' : 'Outros',
      region: v.location?.split(',')[0] || 'Centro',
      status: v.status,
      driver: v.driver,
      priority: v.status === 'Emergência' ? 'Crítica' : v.status === 'Manutenção' ? 'Alta' : 'Média',
      efficiency: Math.random() * 100
    })),
    ...MOCK_ROUTES.map(r => ({
      id: r.id,
      name: r.name,
      description: `${r.origin} → ${r.destination}`,
      date: new Date().toISOString(),
      vehicleType: 'Van',
      region: r.origin?.split(',')[0] || 'Centro',
      status: r.status,
      driver: r.driver,
      priority: r.passengers.onboard > 8 ? 'Alta' : 'Média',
      efficiency: (r.passengers.onboard / r.passengers.capacity) * 100
    }))
  ];

  // Hook de filtros avançados com configurações do usuário
  const { preferences } = useUserSettings();
  const {
    filters,
    filteredData,
    filterStats,
    availableOptions,
    updateFilters,
    resetFilters
  } = useAdvancedFilters(allData);

  // Dados combinados (mock + real)
  const totalPassengers = MOCK_ROUTES.reduce((sum, route) => sum + route.passengers.onboard, 0);
  const registeredVehicles = MOCK_VEHICLES.filter(v => v.isRegistered === true);
  const activeVehicles = registeredVehicles.filter(v => v.status !== 'Parado').length;
  const criticalAlerts = MOCK_ALERTS.filter(a => a.type === AlertType.Critical).length + stats.critical;

  const handleCriticalAlertsClick = () => {
    if (hasCriticalAlerts) {
      showInfo('Alertas Críticos', `Há ${stats.critical} alertas críticos que requerem atenção imediata.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com controles de notificação */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-golffox-gray-dark">Dashboard</h2>
        <div className="flex items-center space-x-4">
          {/* Toggle de tema */}
          <ThemeToggleIcon />
          
          {/* Indicador de notificações */}
          <div className="relative">
            {hasCriticalAlerts && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{stats.critical}</span>
              </div>
            )}
            <Bell className={`w-6 h-6 ${hasCriticalAlerts ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
          </div>
          
          {/* Botão para validador de endereços */}
          <button
            onClick={() => setShowAddressValidator(!showAddressValidator)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>Validar Endereço</span>
          </button>
          
          {/* Botão para estimador de tempo */}
          <button
            onClick={() => setShowTravelTimeEstimator(!showTravelTimeEstimator)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span>Tempo de Viagem</span>
          </button>
          
          {/* Botão para otimização de rotas */}
          <button
            onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            <span>Otimizar Rotas</span>
          </button>
          
          {/* Botão para rastreamento de veículos */}
          <button
            onClick={() => setShowVehicleTracker(!showVehicleTracker)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Truck className="w-4 h-4" />
            <span>Rastrear Veículos</span>
          </button>
          
          {/* Botão para dashboard de análises */}
          <button
            onClick={() => setShowAnalyticsDashboard(!showAnalyticsDashboard)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Análises</span>
          </button>

          {/* Botão para exportação de relatórios */}
          <button
            onClick={() => setShowReportExporter(!showReportExporter)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Relatórios</span>
          </button>

          {/* Botão para gráficos interativos */}
          <button
            onClick={() => setShowInteractiveCharts(!showInteractiveCharts)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>Gráficos</span>
          </button>

          {/* Botão para filtros avançados */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {filterStats.filtered < filterStats.total && (
              <span className="bg-teal-800 text-white text-xs rounded-full px-2 py-1">
                {filterStats.filtered}/{filterStats.total}
              </span>
            )}
          </button>
          
          {/* Botão para configurações do usuário */}
          <button
            onClick={() => setShowUserSettings(!showUserSettings)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Configurações</span>
          </button>
          
          {/* Botão para demo de notificações */}
          <button
            onClick={() => setShowNotificationDemo(!showNotificationDemo)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Demo Notificações</span>
          </button>
        </div>
      </div>

      {/* Cards de informação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <InfoCard
          title="Colaboradores em Trânsito"
          value={totalPassengers.toString()}
          icon={<UserGroupIcon className="h-8 w-8" />}
          borderColor="border-golffox-orange-primary"
        />
        <InfoCard
          title="Veículos Ativos"
          value={`${activeVehicles}/${registeredVehicles.length}`}
          icon={<TruckIcon className="h-8 w-8" />}
          borderColor="border-golffox-blue-light"
        />
        <InfoCard
          title="Rotas do Dia"
          value={MOCK_ROUTES.length.toString()}
          icon={<ChartBarIcon className="h-8 w-8" />}
          borderColor="border-golffox-blue-dark"
        />
        <InfoCard
          title="Alertas Críticos"
          value={criticalAlerts.toString()}
          icon={<ExclamationTriangleIcon className="h-8 w-8" />}
          borderColor="border-golffox-red"
          isAlert={true}
          onClick={handleCriticalAlertsClick}
        />
      </div>

      {/* Estatísticas de notificações em tempo real */}
      {stats.total > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sistema de Notificações Ativo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <div className="text-sm text-gray-600">Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
              <div className="text-sm text-gray-600">Avisos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
              <div className="text-sm text-gray-600">Informativos</div>
            </div>
          </div>
        </div>
      )}

      {/* Validador de endereços (condicional) */}
      {showAddressValidator && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Validação e Geocodificação de Endereços</h3>
            <MapPin className="w-6 h-6 text-purple-600" />
          </div>
          <AddressValidator 
            onAddressSelected={(result) => {
              console.log('Endereço selecionado:', result);
            }}
            placeholder="Digite um endereço para validar e geocodificar..."
          />
        </div>
      )}

      {/* Estimador de tempo de viagem (condicional) */}
      {showTravelTimeEstimator && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Estimativa de Tempo de Viagem</h3>
            <Route className="w-6 h-6 text-green-600" />
          </div>
          <TravelTimeEstimator />
        </div>
      )}

      {/* Otimizador de rotas (condicional) */}
      {showRouteOptimizer && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Otimização de Rotas</h3>
            <Navigation className="w-6 h-6 text-orange-600" />
          </div>
          <RouteOptimizer />
        </div>
      )}

      {/* Rastreamento de veículos (condicional) */}
      {showVehicleTracker && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Rastreamento em Tempo Real</h3>
            <Truck className="w-6 h-6 text-indigo-600" />
          </div>
          <VehicleTracker />
        </div>
      )}

      {/* Dashboard de análises (condicional) */}
      {showAnalyticsDashboard && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-golffox-gray-dark">Dashboard de Análises</h3>
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <AnalyticsDashboard />
        </div>
      )}

      {/* Demo de notificações */}
      {showNotificationDemo && <NotificationDemo />}

      {/* Filtros Avançados */}
      {showAdvancedFilters && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-6 w-6 text-teal-600" />
              <h2 className="text-xl font-semibold text-gray-900">Filtros Avançados</h2>
              <span className="text-sm text-gray-500">
                ({filterStats.filtered} de {filterStats.total} itens)
              </span>
            </div>
            <button
              onClick={resetFilters}
              className="text-sm text-teal-600 hover:text-teal-800 transition-colors"
            >
              Resetar Filtros
            </button>
          </div>
          <AdvancedFilters
            onFiltersChange={updateFilters}
            initialFilters={filters}
            availableOptions={availableOptions}
          />
          
          {/* Resultados dos filtros */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resultados Filtrados ({filteredData.length} itens)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.slice(0, 12).map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      item.status === 'Manutenção' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'Emergência' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.region}</span>
                    <span>{item.priority}</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-teal-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(item.efficiency, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Eficiência: {Math.round(item.efficiency)}%
                  </div>
                </div>
              ))}
            </div>
            
            {filteredData.length > 12 && (
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-500">
                  Mostrando 12 de {filteredData.length} resultados
                </span>
              </div>
            )}
            
            {filteredData.length === 0 && (
              <div className="text-center py-8">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum resultado encontrado com os filtros aplicados.</p>
                <button
                  onClick={resetFilters}
                  className="mt-2 text-teal-600 hover:text-teal-800 transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exportação de Relatórios */}
      {showReportExporter && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Exportação de Relatórios</h2>
          </div>
          <ReportExporter onClose={() => setShowReportExporter(false)} />
        </div>
      )}

      {/* Gráficos Interativos */}
      {showInteractiveCharts && (
        <div className="mb-6">
          <InteractiveCharts onClose={() => setShowInteractiveCharts(false)} />
        </div>
      )}

      {/* Visão geral */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-lg sm:text-xl font-bold text-golffox-gray-dark mb-3 sm:mb-4">Visão Geral Rápida</h3>
        <p className="text-sm sm:text-base text-golffox-gray-medium mb-4">
          Bem-vindo ao painel de gestão da Golffox. Aqui você pode monitorar todas as operações em tempo real. 
          Utilize o menu para navegar entre as seções de mapa, rotas, alertas e relatórios detalhados.
        </p>
        
        {hasCriticalAlerts && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                Atenção: Há {stats.critical} alertas críticos que requerem ação imediata.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Configurações do usuário */}
      {showUserSettings && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-golffox-dark">Configurações do Usuário</h2>
            <button
              onClick={() => setShowUserSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <UserSettings />
        </div>
      )}

      {/* Container de notificações toast */}
      <NotificationContainer
        notifications={toasts}
        onDismiss={removeToast}
        position={position}
        maxNotifications={5}
      />
    </div>
  );
};

export default Dashboard;