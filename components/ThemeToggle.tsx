import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useUserSettings } from '../hooks/useUserSettings';

export const ThemeToggle: React.FC = () => {
  const { preferences, updatePreference } = useUserSettings();

  const themes = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
    { value: 'auto', icon: Monitor, label: 'Automático' }
  ];

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updatePreference('theme', theme);
  };

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => handleThemeChange(value as 'light' | 'dark' | 'auto')}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${preferences.theme === value
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
            }
          `}
          title={`Tema ${label}`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export const ThemeToggleCompact: React.FC = () => {
  const { preferences, updatePreference } = useUserSettings();

  const getNextTheme = (current: string) => {
    switch (current) {
      case 'light': return 'dark';
      case 'dark': return 'auto';
      case 'auto': return 'light';
      default: return 'light';
    }
  };

  const getCurrentIcon = () => {
    switch (preferences.theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Monitor;
      default: return Sun;
    }
  };

  const getCurrentLabel = () => {
    switch (preferences.theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'auto': return 'Automático';
      default: return 'Claro';
    }
  };

  const handleToggle = () => {
    const nextTheme = getNextTheme(preferences.theme);
    updatePreference('theme', nextTheme);
  };

  const Icon = getCurrentIcon();

  return (
    <button
      onClick={handleToggle}
      className="
        flex items-center space-x-2 px-3 py-2 rounded-lg
        bg-gray-100 dark:bg-gray-800 
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-200
        border border-gray-200 dark:border-gray-700
      "
      title={`Tema atual: ${getCurrentLabel()}. Clique para alternar.`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{getCurrentLabel()}</span>
    </button>
  );
};

export const ThemeToggleIcon: React.FC = () => {
  const { preferences, updatePreference } = useUserSettings();

  const getNextTheme = (current: string) => {
    switch (current) {
      case 'light': return 'dark';
      case 'dark': return 'auto';
      case 'auto': return 'light';
      default: return 'light';
    }
  };

  const getCurrentIcon = () => {
    switch (preferences.theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Monitor;
      default: return Sun;
    }
  };

  const getCurrentLabel = () => {
    switch (preferences.theme) {
      case 'light': return 'Claro';
      case 'dark': return 'Escuro';
      case 'auto': return 'Automático';
      default: return 'Claro';
    }
  };

  const handleToggle = () => {
    const nextTheme = getNextTheme(preferences.theme);
    updatePreference('theme', nextTheme);
  };

  const Icon = getCurrentIcon();

  return (
    <button
      onClick={handleToggle}
      className="
        p-2 rounded-lg
        bg-gray-100 dark:bg-gray-800 
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-200
        border border-gray-200 dark:border-gray-700
      "
      title={`Tema atual: ${getCurrentLabel()}. Clique para alternar.`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};