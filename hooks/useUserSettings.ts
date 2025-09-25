import { useState, useEffect, useCallback } from 'react';
import { UserPreferences } from '../components/UserSettings';

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

export const useUserSettings = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Carregar preferências do localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detectar mudanças não salvas
  useEffect(() => {
    if (isLoading) return;
    
    const savedPreferences = localStorage.getItem('userPreferences');
    const currentPreferences = JSON.stringify(preferences);
    const savedPreferencesStr = savedPreferences || JSON.stringify(defaultPreferences);
    
    setHasUnsavedChanges(currentPreferences !== savedPreferencesStr);
  }, [preferences, isLoading]);

  // Aplicar tema ao documento
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      if (preferences.theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
      } else {
        root.classList.toggle('dark', preferences.theme === 'dark');
      }
    };

    applyTheme();

    // Escutar mudanças no tema do sistema
    if (preferences.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', applyTheme);
      
      return () => mediaQuery.removeEventListener('change', applyTheme);
    }
  }, [preferences.theme]);

  // Aplicar tamanho da fonte
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    
    switch (preferences.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }
  }, [preferences.fontSize]);

  // Aplicar modo compacto
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('compact-mode', preferences.compactMode);
  }, [preferences.compactMode]);

  // Salvar preferências
  const savePreferences = useCallback((newPreferences?: UserPreferences) => {
    const preferencesToSave = newPreferences || preferences;
    
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferencesToSave));
      
      if (newPreferences) {
        setPreferences(newPreferences);
      }
      
      setHasUnsavedChanges(false);
      
      // Disparar evento personalizado para notificação
      const event = new CustomEvent('userSettingsChanged', {
        detail: preferencesToSave
      });
      window.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      return false;
    }
  }, [preferences]);

  // Atualizar preferência específica
  const updatePreference = useCallback((path: string, value: any) => {
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
  }, []);

  // Resetar para padrões
  const resetToDefaults = useCallback(() => {
    setPreferences(defaultPreferences);
    localStorage.removeItem('userPreferences');
    setHasUnsavedChanges(false);
  }, []);

  // Exportar configurações
  const exportSettings = useCallback(() => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `golffox-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [preferences]);

  // Importar configurações
  const importSettings = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          const mergedPreferences = { ...defaultPreferences, ...imported };
          setPreferences(mergedPreferences);
          resolve(true);
        } catch (error) {
          console.error('Erro ao importar configurações:', error);
          resolve(false);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  // Verificar se notificações estão habilitadas
  const areNotificationsEnabled = useCallback(() => {
    return preferences.notifications.enabled;
  }, [preferences.notifications.enabled]);

  // Verificar se deve mostrar notificação específica
  const shouldShowNotification = useCallback((type: 'desktop' | 'sound' | 'email' | 'sms' | 'push') => {
    return preferences.notifications.enabled && preferences.notifications[type];
  }, [preferences.notifications]);

  // Obter configurações de dashboard
  const getDashboardSettings = useCallback(() => {
    return preferences.dashboard;
  }, [preferences.dashboard]);

  // Obter configurações de mapa
  const getMapSettings = useCallback(() => {
    return preferences.maps;
  }, [preferences.maps]);

  // Obter configurações de relatórios
  const getReportSettings = useCallback(() => {
    return preferences.reports;
  }, [preferences.reports]);

  // Verificar se deve auto-refresh
  const shouldAutoRefresh = useCallback(() => {
    return preferences.dashboard.autoRefresh;
  }, [preferences.dashboard.autoRefresh]);

  // Obter intervalo de refresh
  const getRefreshInterval = useCallback(() => {
    return preferences.dashboard.refreshInterval * 1000; // converter para ms
  }, [preferences.dashboard.refreshInterval]);

  // Verificar permissões de privacidade
  const hasPrivacyPermission = useCallback((type: 'analytics' | 'searchHistory' | 'locationTracking') => {
    switch (type) {
      case 'analytics':
        return preferences.privacy.shareAnalytics;
      case 'searchHistory':
        return preferences.privacy.saveSearchHistory;
      case 'locationTracking':
        return preferences.privacy.allowLocationTracking;
      default:
        return false;
    }
  }, [preferences.privacy]);

  // Obter estatísticas de uso
  const getUsageStats = useCallback(() => {
    const settingsCount = Object.keys(preferences).length;
    const customizedSettings = Object.entries(preferences).filter(([key, value]) => {
      const defaultValue = defaultPreferences[key as keyof UserPreferences];
      return JSON.stringify(value) !== JSON.stringify(defaultValue);
    }).length;

    return {
      totalSettings: settingsCount,
      customizedSettings,
      customizationPercentage: Math.round((customizedSettings / settingsCount) * 100)
    };
  }, [preferences]);

  return {
    // Estado
    preferences,
    isLoading,
    hasUnsavedChanges,
    
    // Ações principais
    updatePreference,
    savePreferences,
    resetToDefaults,
    
    // Import/Export
    exportSettings,
    importSettings,
    
    // Helpers específicos
    areNotificationsEnabled,
    shouldShowNotification,
    getDashboardSettings,
    getMapSettings,
    getReportSettings,
    shouldAutoRefresh,
    getRefreshInterval,
    hasPrivacyPermission,
    getUsageStats,
    
    // Constantes
    defaultPreferences
  };
};