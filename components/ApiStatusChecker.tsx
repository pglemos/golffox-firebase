import React, { useEffect, useState } from 'react';
import { checkApiConfiguration } from '../config';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from './icons/Icons';

interface ApiStatus {
  googleMaps: 'loading' | 'success' | 'error';
  gemini: 'success' | 'error';
  issues: string[];
}

const ApiStatusChecker: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    googleMaps: 'loading',
    gemini: 'error',
    issues: [],
  });

  useEffect(() => {
    const checkApis = () => {
      const config = checkApiConfiguration();
      
      // Verificar status do Google Maps
      let googleMapsStatus: 'loading' | 'success' | 'error' = 'loading';
      
      if (window.googleMapsApiLoaded === true) {
        googleMapsStatus = 'success';
      } else if (window.googleMapsApiLoaded === 'error') {
        googleMapsStatus = 'error';
      }
      
      // Verificar status do Gemini
      const geminiStatus = config.issues.includes('Gemini API Key não configurada') ? 'error' : 'success';
      
      setApiStatus({
        googleMaps: googleMapsStatus,
        gemini: geminiStatus,
        issues: config.issues,
      });
    };

    // Verificar imediatamente
    checkApis();
    
    // Verificar periodicamente até o Google Maps carregar
    const interval = setInterval(() => {
      if (window.googleMapsApiLoaded !== false) {
        checkApis();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'loading':
        return <div className="h-5 w-5 border-2 border-golffox-blue-light border-t-transparent rounded-full animate-spin" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Configurado';
      case 'error':
        return 'Erro';
      case 'loading':
        return 'Carregando...';
      default:
        return 'Desconhecido';
    }
  };

  const hasErrors = apiStatus.googleMaps === 'error' || apiStatus.gemini === 'error';
  const isLoading = apiStatus.googleMaps === 'loading';

  if (!hasErrors && !isLoading) {
    return null; // Não exibir se tudo estiver funcionando
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex items-center gap-2 mb-3">
        <InformationCircleIcon className="h-5 w-5 text-golffox-blue-light" />
        <h3 className="font-semibold text-golffox-gray-dark">Status das APIs</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Google Maps:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(apiStatus.googleMaps)}
            <span className={`${apiStatus.googleMaps === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
              {getStatusText(apiStatus.googleMaps)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Gemini AI:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(apiStatus.gemini)}
            <span className={`${apiStatus.gemini === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
              {getStatusText(apiStatus.gemini)}
            </span>
          </div>
        </div>
      </div>
      
      {apiStatus.issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Problemas encontrados:</p>
          <ul className="text-xs text-red-600 space-y-1">
            {apiStatus.issues.map((issue, index) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Verifique o arquivo .env.local e index.html
          </p>
        </div>
      )}
    </div>
  );
};

export default ApiStatusChecker;