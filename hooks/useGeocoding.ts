import { useState, useCallback, useRef } from 'react';
import { mockGeocodingService } from '../services/mockGeocodingService';
import { GeocodingResult, AddressValidationResult, GeocodingOptions } from '../services/geocodingService';

export interface GeocodingState {
  results: GeocodingResult[];
  validationResult: AddressValidationResult | null;
  isLoading: boolean;
  error: string | null;
  lastQuery: string;
}

export interface UseGeocodingReturn extends GeocodingState {
  geocodeAddress: (address: string, options?: GeocodingOptions) => Promise<GeocodingResult[]>;
  validateAddress: (address: string, options?: GeocodingOptions) => Promise<AddressValidationResult>;
  reverseGeocode: (lat: number, lng: number, options?: GeocodingOptions) => Promise<GeocodingResult[]>;
  clearResults: () => void;
  selectResult: (result: GeocodingResult) => void;
  selectedResult: GeocodingResult | null;
}

export const useGeocoding = (): UseGeocodingReturn => {
  const [state, setState] = useState<GeocodingState>({
    results: [],
    validationResult: null,
    isLoading: false,
    error: null,
    lastQuery: ''
  });

  const [selectedResult, setSelectedResult] = useState<GeocodingResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const geocodeAddress = useCallback(async (
    address: string, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    
    setState(prev => ({ 
      ...prev, 
      lastQuery: address,
      validationResult: null 
    }));

    try {
      const results = await mockGeocodingService.geocodeAddress(address, options);
      
      setState(prev => ({ 
        ...prev, 
        results,
        isLoading: false 
      }));

      // Auto-selecionar o primeiro resultado se houver apenas um
      if (results.length === 1) {
        setSelectedResult(results[0]);
      } else {
        setSelectedResult(null);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao geocodificar endereço';
      setError(errorMessage);
      setState(prev => ({ 
        ...prev, 
        results: [],
        isLoading: false 
      }));
      throw error;
    }
  }, [setLoading, setError]);

  const validateAddress = useCallback(async (
    address: string, 
    options: GeocodingOptions = {}
  ): Promise<AddressValidationResult> => {
    setLoading(true);
    setError(null);
    
    setState(prev => ({ 
      ...prev, 
      lastQuery: address 
    }));

    try {
      const validationResult = await mockGeocodingService.validateAddress(address, options);
      
      setState(prev => ({ 
        ...prev, 
        validationResult,
        results: validationResult.suggestions,
        isLoading: false 
      }));

      // Auto-selecionar o primeiro resultado válido
      if (validationResult.isValid && validationResult.suggestions.length > 0) {
        setSelectedResult(validationResult.suggestions[0]);
      } else {
        setSelectedResult(null);
      }

      return validationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao validar endereço';
      setError(errorMessage);
      setState(prev => ({ 
        ...prev, 
        validationResult: null,
        results: [],
        isLoading: false 
      }));
      throw error;
    }
  }, [setLoading, setError]);

  const reverseGeocode = useCallback(async (
    lat: number, 
    lng: number, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> => {
    setLoading(true);
    setError(null);
    
    setState(prev => ({ 
      ...prev, 
      lastQuery: `${lat}, ${lng}`,
      validationResult: null 
    }));

    try {
      const results = await mockGeocodingService.reverseGeocode(lat, lng, options);
      
      setState(prev => ({ 
        ...prev, 
        results,
        isLoading: false 
      }));

      // Auto-selecionar o primeiro resultado
      if (results.length > 0) {
        setSelectedResult(results[0]);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer geocodificação reversa';
      setError(errorMessage);
      setState(prev => ({ 
        ...prev, 
        results: [],
        isLoading: false 
      }));
      throw error;
    }
  }, [setLoading, setError]);

  const clearResults = useCallback(() => {
    // Cancelar requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setState({
      results: [],
      validationResult: null,
      isLoading: false,
      error: null,
      lastQuery: ''
    });
    
    setSelectedResult(null);
  }, []);

  const selectResult = useCallback((result: GeocodingResult) => {
    setSelectedResult(result);
  }, []);

  return {
    ...state,
    selectedResult,
    geocodeAddress,
    validateAddress,
    reverseGeocode,
    clearResults,
    selectResult
  };
};