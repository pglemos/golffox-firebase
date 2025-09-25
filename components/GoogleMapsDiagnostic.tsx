import React, { useState, useEffect } from 'react';
import { GOOGLE_MAPS_CONFIG } from '../config';

interface DiagnosticInfo {
  apiKeyPresent: boolean;
  apiKeyValue: string;
  scriptsLoaded: {
    googleMaps: boolean;
    markerClusterer: boolean;
  };
  windowObjects: {
    google: boolean;
    googleMapsApiLoaded: any;
    markerClustererApiLoaded: boolean;
  };
  errors: string[];
}

const GoogleMapsDiagnostic: React.FC = () => {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const runDiagnostic = () => {
    const errors: string[] = [];
    
    // Verificar chave da API
    const apiKeyPresent = !!(GOOGLE_MAPS_CONFIG.apiKey && GOOGLE_MAPS_CONFIG.apiKey.trim() !== '');
    if (!apiKeyPresent) {
      errors.push('Chave da API do Google Maps não configurada');
    }

    // Verificar scripts carregados
    const googleMapsScript = document.querySelector('script[src*="maps.googleapis.com"]');
    const markerClustererScript = document.querySelector('script[src*="markerclusterer"]');

    // Verificar objetos no window
    const windowObjects = {
      google: !!(window as any).google,
      googleMapsApiLoaded: (window as any).googleMapsApiLoaded,
      markerClustererApiLoaded: !!(window as any).markerClustererApiLoaded,
    };

    if (!windowObjects.google) {
      errors.push('Objeto window.google não encontrado');
    }

    if (windowObjects.googleMapsApiLoaded === 'error') {
      errors.push('Erro no carregamento da API do Google Maps');
    }

    setDiagnosticInfo({
      apiKeyPresent,
      apiKeyValue: GOOGLE_MAPS_CONFIG.apiKey ? `${GOOGLE_MAPS_CONFIG.apiKey.substring(0, 10)}...` : 'Não configurada',
      scriptsLoaded: {
        googleMaps: !!googleMapsScript,
        markerClusterer: !!markerClustererScript,
      },
      windowObjects,
      errors,
    });
  };

  useEffect(() => {
    runDiagnostic();
    const interval = setInterval(runDiagnostic, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm z-50"
      >
        🔍 Diagnóstico Maps
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Diagnóstico Google Maps</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {diagnosticInfo && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Chave da API:</span>
            <span className={diagnosticInfo.apiKeyPresent ? 'text-green-600' : 'text-red-600'}>
              {diagnosticInfo.apiKeyPresent ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="text-xs text-gray-600">
            {diagnosticInfo.apiKeyValue}
          </div>

          <div className="flex justify-between">
            <span>Script Google Maps:</span>
            <span className={diagnosticInfo.scriptsLoaded.googleMaps ? 'text-green-600' : 'text-red-600'}>
              {diagnosticInfo.scriptsLoaded.googleMaps ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Script MarkerClusterer:</span>
            <span className={diagnosticInfo.scriptsLoaded.markerClusterer ? 'text-green-600' : 'text-red-600'}>
              {diagnosticInfo.scriptsLoaded.markerClusterer ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>window.google:</span>
            <span className={diagnosticInfo.windowObjects.google ? 'text-green-600' : 'text-red-600'}>
              {diagnosticInfo.windowObjects.google ? '✓' : '✗'}
            </span>
          </div>

          <div className="flex justify-between">
            <span>API Status:</span>
            <span className={
              diagnosticInfo.windowObjects.googleMapsApiLoaded === true ? 'text-green-600' :
              diagnosticInfo.windowObjects.googleMapsApiLoaded === 'error' ? 'text-red-600' :
              'text-yellow-600'
            }>
              {diagnosticInfo.windowObjects.googleMapsApiLoaded === true ? 'Carregada' :
               diagnosticInfo.windowObjects.googleMapsApiLoaded === 'error' ? 'Erro' :
               diagnosticInfo.windowObjects.googleMapsApiLoaded === 'loading' ? 'Carregando' :
               'Não carregada'}
            </span>
          </div>

          {diagnosticInfo.errors.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
              <div className="font-semibold text-red-800 text-xs">Erros:</div>
              {diagnosticInfo.errors.map((error, index) => (
                <div key={index} className="text-red-700 text-xs">• {error}</div>
              ))}
            </div>
          )}

          <button
            onClick={runDiagnostic}
            className="w-full mt-3 bg-blue-500 text-white px-3 py-1 rounded text-xs"
          >
            Atualizar Diagnóstico
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsDiagnostic;