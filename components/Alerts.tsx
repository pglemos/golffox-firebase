import React, { useState } from 'react';
import { AlertTriangle, Info, X, RefreshCw, Filter } from 'lucide-react';
import { MOCK_ALERTS } from '../constants';
import type { Alert } from '../types';
import { AlertType } from '../types';
import { useNotifications } from '../hooks/useNotifications';

const Alerts: React.FC = () => {
  const [showMockData, setShowMockData] = useState(false);
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  
  const { 
    alerts, 
    alertsByType, 
    stats, 
    isLoading, 
    dismissAlert, 
    clearOldAlerts, 
    refresh 
  } = useNotifications({ 
    autoCheck: true, 
    checkInterval: 30000 
  });

  // Combina alertas reais com mock data se necessário
  const allAlerts = showMockData ? [...alerts, ...MOCK_ALERTS] : alerts;
  
  // Aplica filtro por tipo
  const filteredAlerts = filterType === 'all' 
    ? allAlerts 
    : allAlerts.filter(alert => alert.type === filterType);

  const sortedAlerts = [...filteredAlerts].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.Critical:
        return <AlertTriangle className="w-5 h-5" />;
      case AlertType.Warning:
        return <AlertTriangle className="w-5 h-5" />;
      case AlertType.Info:
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case AlertType.Critical:
        return 'bg-red-50 border-red-200 text-red-800';
      case AlertType.Warning:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case AlertType.Info:
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const handleDismissAlert = (alertId: string) => {
    // Só permite dismissar alertas reais (não mock data)
    if (!showMockData || !MOCK_ALERTS.find(alert => alert.id === alertId)) {
      dismissAlert(alertId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Sistema de Alertas</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total de Alertas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
          <div className="text-sm text-gray-600">Críticos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
          <div className="text-sm text-gray-600">Avisos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
          <div className="text-sm text-gray-600">Informativos</div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value={AlertType.Critical}>Críticos</option>
              <option value={AlertType.Warning}>Avisos</option>
              <option value={AlertType.Info}>Informativos</option>
            </select>
          </div>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showMockData}
              onChange={(e) => setShowMockData(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">Mostrar dados de exemplo</span>
          </label>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={clearOldAlerts}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Limpar alertas antigos
          </button>
        )}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {isLoading && alerts.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Carregando alertas...</p>
          </div>
        ) : sortedAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Info className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum alerta encontrado</h3>
            <p className="text-gray-600">
              {filterType === 'all' 
                ? 'Não há alertas no momento.' 
                : `Não há alertas do tipo ${filterType}.`}
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${getAlertStyles(alert.type)} relative`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-lg">{alert.title}</h3>
                  <p className="mt-1 text-sm opacity-90">{alert.message}</p>
                  <p className="mt-2 text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                  title="Dispensar alerta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Alerts;