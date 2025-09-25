import React, { useState, useEffect } from 'react';
import { useGeocoding } from '../hooks/useGeocoding';
import { GeocodingResult } from '../services/geocodingService';
import { 
  MapPin, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Navigation,
  Copy,
  ExternalLink
} from 'lucide-react';

interface AddressValidatorProps {
  onAddressSelected?: (result: GeocodingResult) => void;
  initialAddress?: string;
  placeholder?: string;
  showMap?: boolean;
}

const AddressValidator: React.FC<AddressValidatorProps> = ({
  onAddressSelected,
  initialAddress = '',
  placeholder = 'Digite o endereço para validar...',
  showMap = true
}) => {
  const [inputAddress, setInputAddress] = useState(initialAddress);
  const [showResults, setShowResults] = useState(false);
  
  const {
    results,
    validationResult,
    isLoading,
    error,
    selectedResult,
    geocodeAddress,
    validateAddress,
    reverseGeocode,
    clearResults,
    selectResult
  } = useGeocoding();

  useEffect(() => {
    if (initialAddress) {
      setInputAddress(initialAddress);
    }
  }, [initialAddress]);

  const handleSearch = async () => {
    if (!inputAddress.trim()) return;
    
    setShowResults(true);
    try {
      await validateAddress(inputAddress);
    } catch (error) {
      console.error('Erro ao validar endereço:', error);
    }
  };

  const handleResultSelect = (result: GeocodingResult) => {
    selectResult(result);
    onAddressSelected?.(result);
    setShowResults(false);
  };

  const handleReverseGeocode = async () => {
    // Simular obtenção da localização atual
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setShowResults(true);
          try {
            await reverseGeocode(latitude, longitude);
          } catch (error) {
            console.error('Erro na geocodificação reversa:', error);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          // Usar coordenadas de São Paulo como fallback
          reverseGeocode(-23.5505, -46.6333);
        }
      );
    } else {
      // Usar coordenadas de São Paulo como fallback
      await reverseGeocode(-23.5505, -46.6333);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exact':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'approximate':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'partial':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo de entrada */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Endereço para Validação
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-2.5 w-5 h-5 animate-spin text-gray-400" />
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isLoading || !inputAddress.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Validar</span>
          </button>
          <button
            onClick={handleReverseGeocode}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            title="Usar localização atual"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Resultado da validação */}
      {validationResult && (
        <div className={`p-4 rounded-lg border ${
          validationResult.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {validationResult.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              validationResult.isValid ? 'text-green-800' : 'text-red-800'
            }`}>
              {validationResult.isValid ? 'Endereço Válido' : 'Endereço Inválido'}
            </span>
          </div>

          {/* Erros */}
          {validationResult.errors.length > 0 && (
            <div className="mb-2">
              <p className="text-sm font-medium text-red-700 mb-1">Erros:</p>
              <ul className="text-sm text-red-600 space-y-1">
                {validationResult.errors.map((error, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <XCircle className="w-3 h-3" />
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Avisos */}
          {validationResult.warnings.length > 0 && (
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Avisos:</p>
              <ul className="text-sm text-yellow-600 space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Resultados da geocodificação */}
      {showResults && results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Resultados Encontrados ({results.length})
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedResult === result
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getTypeIcon(result.type)}
                      <span className="font-medium text-gray-900">
                        {result.formattedAddress}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Coordenadas:</span>
                        <br />
                        {result.coordinates.lat.toFixed(6)}, {result.coordinates.lng.toFixed(6)}
                      </div>
                      <div>
                        <span className="font-medium">Confiança:</span>
                        <br />
                        <span className={getConfidenceColor(result.confidence)}>
                          {getConfidenceText(result.confidence)} ({Math.round(result.confidence * 100)}%)
                        </span>
                      </div>
                    </div>

                    {/* Componentes do endereço */}
                    {Object.keys(result.components).length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(result.components).map(([key, value]) => (
                            value && (
                              <div key={key}>
                                <span className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                </span> {value}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(result.formattedAddress);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copiar endereço"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `https://maps.google.com/?q=${result.coordinates.lat},${result.coordinates.lng}`;
                        window.open(url, '_blank');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Abrir no Google Maps"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Endereço selecionado */}
      {selectedResult && !showResults && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Endereço Selecionado</h4>
            <button
              onClick={clearResults}
              className="text-blue-600 hover:text-blue-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-blue-800">{selectedResult.formattedAddress}</p>
          <p className="text-sm text-blue-600 mt-1">
            {selectedResult.coordinates.lat.toFixed(6)}, {selectedResult.coordinates.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressValidator;