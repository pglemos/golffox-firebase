import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Eye, 
  Globe, 
  Palette, 
  Shield, 
  Database, 
  Download,
  Upload,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Truck,
  BarChart3
} from 'lucide-react';

export interface UserPreferences {
  // Aparência
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  
  // Notificações
  notifications: {
    enabled: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  
  // Dashboard
  dashboard: {
    autoRefresh: boolean;
    refreshInterval: number; // em segundos
    defaultView: 'overview' | 'vehicles' | 'routes' | 'analytics';
    showWelcomeMessage: boolean;
    compactCards: boolean;
  };
  
  // Mapas
  maps: {
    defaultZoom: number;
    showTraffic: boolean;
    showSatellite: boolean;
    autoCenter: boolean;
    trackingInterval: number; // em segundos
  };
  
  // Relatórios
  reports: {
    defaultFormat: 'pdf' | 'excel' | 'csv';
    includeCharts: boolean;
    includeRawData: boolean;
    autoSave: boolean;
  };
  
  // Privacidade
  privacy: {
    shareAnalytics: boolean;
    saveSearchHistory: boolean;
    allowLocationTracking: boolean;
    dataRetention: number; // em dias
  };
}

interface UserSettingsProps {
  onClose?: () => void;
  onSettingsChange?: (settings: UserPreferences) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'light',
  language: 'pt-BR',
  fontSize: 'medium',
  compactMode: false,
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    sms: false,
    push: true
  },
  dashboard: {
    autoRefresh: true,
    refreshInterval: 30,
    defaultView: 'overview',
    showWelcomeMessage: true,
    compactCards: false
  },
  maps: {
    defaultZoom: 12,
    showTraffic: true,
    showSatellite: false,
    autoCenter: true,
    trackingInterval: 10
  },
  reports: {
    defaultFormat: 'pdf',
    includeCharts: true,
    includeRawData: false,
    autoSave: true
  },
  privacy: {
    shareAnalytics: true,
    saveSearchHistory: true,
    allowLocationTracking: true,
    dataRetention: 90
  }
};

export const UserSettings: React.FC<UserSettingsProps> = ({ 
  onClose, 
  onSettingsChange 
}) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Carregar preferências salvas
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    }
  }, []);

  // Detectar mudanças
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    const currentPreferences = JSON.stringify(preferences);
    const savedPreferencesStr = savedPreferences || JSON.stringify(defaultPreferences);
    setHasChanges(currentPreferences !== savedPreferencesStr);
  }, [preferences]);

  const updatePreference = (path: string, value: any) => {
    setPreferences(prev => {
      const newPreferences = { ...prev };
      const keys = path.split('.');
      let current: any = newPreferences;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPreferences;
    });
  };

  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    onSettingsChange?.(preferences);
    setHasChanges(false);
    
    // Mostrar feedback
    const event = new CustomEvent('showToast', {
      detail: {
        type: 'success',
        title: 'Configurações Salvas',
        message: 'Suas preferências foram salvas com sucesso!'
      }
    });
    window.dispatchEvent(event);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
  };

  const exportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'golffox-preferences.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importPreferences = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setPreferences({ ...defaultPreferences, ...imported });
      } catch (error) {
        alert('Erro ao importar configurações. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'maps', label: 'Mapas', icon: MapPin },
    { id: 'reports', label: 'Relatórios', icon: Download },
    { id: 'privacy', label: 'Privacidade', icon: Shield }
  ];

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {/* Tema */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tema</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light', label: 'Claro', icon: Sun },
            { value: 'dark', label: 'Escuro', icon: Moon },
            { value: 'auto', label: 'Automático', icon: Monitor }
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => updatePreference('theme', value)}
              className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                preferences.theme === value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className="h-6 w-6 mb-2" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Idioma */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
        <select
          value={preferences.language}
          onChange={(e) => updatePreference('language', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
      </div>

      {/* Tamanho da fonte */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho da Fonte</label>
        <select
          value={preferences.fontSize}
          onChange={(e) => updatePreference('fontSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Pequena</option>
          <option value="medium">Média</option>
          <option value="large">Grande</option>
        </select>
      </div>

      {/* Modo compacto */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Modo Compacto</label>
          <p className="text-sm text-gray-500">Reduz o espaçamento entre elementos</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.compactMode}
            onChange={(e) => updatePreference('compactMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Notificações gerais */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Ativar Notificações</label>
          <p className="text-sm text-gray-500">Receber notificações do sistema</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.notifications.enabled}
            onChange={(e) => updatePreference('notifications.enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {preferences.notifications.enabled && (
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          {[
            { key: 'sound', label: 'Som', icon: Volume2, description: 'Reproduzir som nas notificações' },
            { key: 'desktop', label: 'Desktop', icon: Monitor, description: 'Notificações na área de trabalho' },
            { key: 'email', label: 'E-mail', icon: Mail, description: 'Enviar notificações por e-mail' },
            { key: 'sms', label: 'SMS', icon: MessageSquare, description: 'Enviar notificações por SMS' },
            { key: 'push', label: 'Push', icon: Smartphone, description: 'Notificações push no dispositivo' }
          ].map(({ key, label, icon: Icon, description }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications[key as keyof typeof preferences.notifications] as boolean}
                  onChange={(e) => updatePreference(`notifications.${key}`, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDashboardTab = () => (
    <div className="space-y-6">
      {/* Auto-refresh */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-gray-700">Atualização Automática</label>
          <p className="text-sm text-gray-500">Atualizar dados automaticamente</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.dashboard.autoRefresh}
            onChange={(e) => updatePreference('dashboard.autoRefresh', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {preferences.dashboard.autoRefresh && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Intervalo de Atualização (segundos)
          </label>
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={preferences.dashboard.refreshInterval}
            onChange={(e) => updatePreference('dashboard.refreshInterval', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>10s</span>
            <span>{preferences.dashboard.refreshInterval}s</span>
            <span>5min</span>
          </div>
        </div>
      )}

      {/* Visualização padrão */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Visualização Padrão</label>
        <select
          value={preferences.dashboard.defaultView}
          onChange={(e) => updatePreference('dashboard.defaultView', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="overview">Visão Geral</option>
          <option value="vehicles">Veículos</option>
          <option value="routes">Rotas</option>
          <option value="analytics">Análises</option>
        </select>
      </div>

      {/* Outras opções */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Mostrar Mensagem de Boas-vindas</label>
            <p className="text-sm text-gray-500">Exibir mensagem ao acessar o dashboard</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dashboard.showWelcomeMessage}
              onChange={(e) => updatePreference('dashboard.showWelcomeMessage', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">Cards Compactos</label>
            <p className="text-sm text-gray-500">Usar layout compacto para os cards</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dashboard.compactCards}
              onChange={(e) => updatePreference('dashboard.compactCards', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'appearance':
        return renderAppearanceTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'dashboard':
        return renderDashboardTab();
      case 'maps':
        return <div className="text-center py-8 text-gray-500">Configurações de mapas em desenvolvimento...</div>;
      case 'reports':
        return <div className="text-center py-8 text-gray-500">Configurações de relatórios em desenvolvimento...</div>;
      case 'privacy':
        return <div className="text-center py-8 text-gray-500">Configurações de privacidade em desenvolvimento...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Alterações não salvas
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 p-4">
          <nav className="space-y-2">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </nav>

          {/* Ações */}
          <div className="mt-8 space-y-2">
            <button
              onClick={exportPreferences}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
            
            <label className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={importPreferences}
                className="hidden"
              />
            </label>

            <button
              onClick={resetPreferences}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Resetar</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </h3>
            <p className="text-sm text-gray-500">
              Personalize suas preferências para uma melhor experiência.
            </p>
          </div>

          {renderCurrentTab()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          As configurações são salvas automaticamente no seu navegador.
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={resetPreferences}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Resetar Tudo
          </button>
          <button
            onClick={savePreferences}
            disabled={!hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
};