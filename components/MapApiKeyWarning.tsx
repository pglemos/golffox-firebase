import React from 'react';
import { ExclamationTriangleIcon } from './icons/Icons';

interface MapApiKeyWarningProps {
    message?: React.ReactNode;
}

const MapApiKeyWarning: React.FC<MapApiKeyWarningProps> = ({ message }) => {
  const defaultMessage = (
    <>
      A chave da API do Google Maps está ausente ou é inválida. 
      <p className="mt-2">Por favor, configure uma chave de API válida no arquivo <code>index.html</code> para habilitar os mapas.</p>
    </>
  );

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-golffox-gray-light p-4 text-center">
      <div className="max-w-lg bg-white p-6 rounded-lg shadow-lg border border-golffox-yellow/50">
        <ExclamationTriangleIcon className="h-12 w-12 text-golffox-yellow mx-auto mb-4" />
        <h3 className="text-xl font-bold text-golffox-gray-dark mb-2">Falha ao Carregar o Mapa</h3>
        <div className="text-golffox-gray-medium text-left space-y-2">
          {message || defaultMessage}
        </div>
        <a 
            href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-golffox-blue-light hover:underline mt-4 inline-block text-sm font-semibold"
        >
          → Obter uma Chave de API & Ativar APIs
        </a>
      </div>
    </div>
  );
};

export default MapApiKeyWarning;