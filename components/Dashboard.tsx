import React, { useState } from 'react';
import { 
  Settings, 
  Activity,
  Navigation,
  ChevronRight
} from 'lucide-react';
import { 
  BellIcon,
  DashboardIcon,
  MapIcon,
  AlertIcon,
  UserGroupIcon,
  ChartBarIcon,
  TruckIcon,
  MapPinIcon
} from './icons/Icons';
import { useNotifications } from '../hooks/useNotifications';
import { useToastNotifications } from '../hooks/useToastNotifications';
import { NotificationContainer } from './NotificationToast';
import { ThemeToggleIcon } from './ThemeToggle';
import VehicleTracker from './VehicleTracker';
import AnalyticsDashboard from './AnalyticsDashboard';
import { UserSettings } from './UserSettings';
import { MOCK_ROUTES, MOCK_VEHICLES, MOCK_ALERTS } from '../constants';
import { AlertType } from '../types';

interface InfoCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendDirection = 'neutral',
  onClick,
  className = ''
}) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
          {icon}
        </div>
        {onClick && (
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendColors[trendDirection]}`}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
};

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  icon, 
  title, 
  description, 
  onClick, 
  color 
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 text-left group"
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};

const Dashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'vehicles' | 'analytics' | 'settings'>('overview');
  
  // Hooks de notificação
  const { stats } = useNotifications();
  const { toasts, removeToast, position } = useToastNotifications();
  
  // Dados calculados
  const totalPassengers = MOCK_ROUTES.reduce((sum, route) => sum + route.passengers.onboard, 0);
  const registeredVehicles = MOCK_VEHICLES.filter(v => v.isRegistered === true);
  const activeVehicles = registeredVehicles.filter(v => v.status !== 'Parado').length;
  const criticalAlerts = MOCK_ALERTS.filter(a => a.type === AlertType.Critical).length + stats.critical;
  const hasCriticalAlerts = criticalAlerts > 0;

  const renderContent = () => {
    switch (activeView) {
      case 'vehicles':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Rastreamento de Veículos</h2>
              <button
                onClick={() => setActiveView('overview')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
            </div>
            <VehicleTracker />
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Análises</h2>
              <button
                onClick={() => setActiveView('overview')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
            </div>
            <AnalyticsDashboard />
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
              <button
                onClick={() => setActiveView('overview')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Voltar
              </button>
            </div>
            <UserSettings />
          </div>
        );
      
      default:
        return (
          <div className="space-y-8">
            {/* Header minimalista */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Visão geral das operações</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Notificações */}
                <div className="relative">
                  {hasCriticalAlerts && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">{criticalAlerts}</span>
                    </div>
                  )}
                  <BellIcon className={`w-6 h-6 ${hasCriticalAlerts ? 'text-red-500' : 'text-gray-400'}`} variant="bounce" />
                </div>
                
                {/* Toggle de tema */}
                <ThemeToggleIcon />
              </div>
            </div>

            {/* Cards de estatísticas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <InfoCard
                title="Colaboradores em Trânsito"
                value={totalPassengers.toString()}
                icon={<UserGroupIcon className="w-6 h-6 text-blue-600" variant="float" />}
                trend="+12% vs ontem"
                trendDirection="up"
              />
              
              <InfoCard
                title="Veículos Ativos"
                value={`${activeVehicles}/${registeredVehicles.length}`}
                icon={<TruckIcon className="w-6 h-6 text-green-600" variant="premium" />}
                trend="Operação normal"
                trendDirection="neutral"
              />
              
              <InfoCard
                title="Rotas do Dia"
                value={MOCK_ROUTES.length.toString()}
                icon={<MapPinIcon className="w-6 h-6 text-purple-600" variant="float" />}
                trend="+3 vs planejado"
                trendDirection="up"
              />
              
              <InfoCard
                title="Alertas Críticos"
                value={criticalAlerts.toString()}
                icon={<AlertIcon className="w-6 h-6 text-red-600" variant="pulse" />}
                trend={criticalAlerts > 0 ? "Requer atenção" : "Tudo normal"}
                trendDirection={criticalAlerts > 0 ? "down" : "neutral"}
                className={criticalAlerts > 0 ? "border-red-200 bg-red-50" : ""}
              />
            </div>

            {/* Ações rápidas */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <QuickAction
                  icon={<TruckIcon className="w-6 h-6 text-white" variant="hover" />}
                  title="Rastrear Veículos"
                  description="Monitore a localização e status dos veículos em tempo real"
                  onClick={() => setActiveView('vehicles')}
                  color="bg-blue-500"
                />
                
                <QuickAction
                  icon={<ChartBarIcon className="w-6 h-6 text-white" variant="scale" />}
                  title="Ver Análises"
                  description="Acesse relatórios e métricas de performance"
                  onClick={() => setActiveView('analytics')}
                  color="bg-purple-500"
                />
                
                <QuickAction
                  icon={<Settings className="w-6 h-6 text-white" />}
                  title="Configurações"
                  description="Gerencie preferências e configurações do sistema"
                  onClick={() => setActiveView('settings')}
                  color="bg-gray-500"
                />
              </div>
            </div>

            {/* Alerta crítico (se houver) */}
            {hasCriticalAlerts && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertIcon className="w-6 h-6 text-red-600" variant="pulse" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900">Alertas Críticos Detectados</h3>
                    <p className="text-red-700 mt-1">
                      Há {criticalAlerts} alertas que requerem atenção imediata. 
                      Verifique o sistema de monitoramento.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
      
      {/* Container de notificações toast */}
      <NotificationContainer
        notifications={toasts}
        onDismiss={removeToast}
        position={position}
        maxNotifications={3}
      />
    </div>
  );
};

export default Dashboard;