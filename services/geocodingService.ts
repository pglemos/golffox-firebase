export interface GeocodingResult {
  address: string;
  formattedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  components: {
    streetNumber?: string;
    street?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  confidence: number; // 0-1, onde 1 é máxima confiança
  type: 'exact' | 'approximate' | 'partial';
}

export interface AddressValidationResult {
  isValid: boolean;
  originalAddress: string;
  suggestions: GeocodingResult[];
  errors: string[];
  warnings: string[];
}

export interface GeocodingOptions {
  country?: string;
  region?: string;
  language?: string;
  strictBounds?: boolean;
  maxResults?: number;
}

export class GeocodingService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Geocodifica um endereço usando a API do Google Maps
   */
  async geocodeAddress(
    address: string, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      throw new Error('API key do Google Maps não configurada');
    }

    const params = new URLSearchParams({
      address: address,
      key: this.apiKey,
      language: options.language || 'pt-BR',
      region: options.region || 'BR'
    });

    if (options.country) {
      params.append('components', `country:${options.country}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Erro na geocodificação: ${data.status}`);
      }

      return data.results.slice(0, options.maxResults || 5).map((result: any) => 
        this.parseGeocodingResult(result)
      );
    } catch (error) {
      console.error('Erro ao geocodificar endereço:', error);
      throw error;
    }
  }

  /**
   * Geocodificação reversa - converte coordenadas em endereço
   */
  async reverseGeocode(
    lat: number, 
    lng: number, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      throw new Error('API key do Google Maps não configurada');
    }

    const params = new URLSearchParams({
      latlng: `${lat},${lng}`,
      key: this.apiKey,
      language: options.language || 'pt-BR',
      region: options.region || 'BR'
    });

    try {
      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Erro na geocodificação reversa: ${data.status}`);
      }

      return data.results.slice(0, options.maxResults || 3).map((result: any) => 
        this.parseGeocodingResult(result)
      );
    } catch (error) {
      console.error('Erro ao fazer geocodificação reversa:', error);
      throw error;
    }
  }

  /**
   * Valida um endereço e retorna sugestões de correção
   */
  async validateAddress(
    address: string, 
    options: GeocodingOptions = {}
  ): Promise<AddressValidationResult> {
    const result: AddressValidationResult = {
      isValid: false,
      originalAddress: address,
      suggestions: [],
      errors: [],
      warnings: []
    };

    // Validações básicas
    if (!address || address.trim().length < 5) {
      result.errors.push('Endereço muito curto ou vazio');
      return result;
    }

    // Verificar caracteres especiais problemáticos
    if (/[<>{}[\]\\|`~!@#$%^&*()+=]/.test(address)) {
      result.warnings.push('Endereço contém caracteres especiais que podem causar problemas');
    }

    try {
      const geocodingResults = await this.geocodeAddress(address, options);
      
      if (geocodingResults.length === 0) {
        result.errors.push('Endereço não encontrado');
        return result;
      }

      result.suggestions = geocodingResults;
      
      // Verificar qualidade dos resultados
      const bestResult = geocodingResults[0];
      
      if (bestResult.confidence >= 0.8) {
        result.isValid = true;
      } else if (bestResult.confidence >= 0.6) {
        result.isValid = true;
        result.warnings.push('Endereço encontrado com baixa precisão');
      } else {
        result.errors.push('Endereço encontrado mas com precisão muito baixa');
      }

      // Verificar se o endereço está completo
      if (!bestResult.components.streetNumber) {
        result.warnings.push('Número do endereço não especificado');
      }

      if (!bestResult.components.postalCode) {
        result.warnings.push('CEP não encontrado');
      }

    } catch (error) {
      result.errors.push(`Erro ao validar endereço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  /**
   * Calcula a distância entre dois pontos usando a fórmula de Haversine
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Verifica se um endereço está dentro de uma área específica
   */
  isWithinBounds(
    coordinates: { lat: number; lng: number },
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    }
  ): boolean {
    return (
      coordinates.lat >= bounds.southwest.lat &&
      coordinates.lat <= bounds.northeast.lat &&
      coordinates.lng >= bounds.southwest.lng &&
      coordinates.lng <= bounds.northeast.lng
    );
  }

  /**
   * Normaliza um endereço para formato padrão
   */
  normalizeAddress(address: string): string {
    return address
      .trim()
      .replace(/\s+/g, ' ') // Múltiplos espaços para um só
      .replace(/,\s*,/g, ',') // Vírgulas duplas
      .replace(/^\s*,|,\s*$/g, '') // Vírgulas no início/fim
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase()); // Primeira letra maiúscula
  }

  private parseGeocodingResult(result: any): GeocodingResult {
    const components: any = {};
    
    result.address_components?.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        components.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        components.street = component.long_name;
      } else if (types.includes('sublocality') || types.includes('neighborhood')) {
        components.neighborhood = component.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        components.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        components.state = component.short_name;
      } else if (types.includes('postal_code')) {
        components.postalCode = component.long_name;
      } else if (types.includes('country')) {
        components.country = component.short_name;
      }
    });

    // Determinar tipo e confiança baseado na precisão
    let type: 'exact' | 'approximate' | 'partial' = 'approximate';
    let confidence = 0.7;

    if (result.geometry?.location_type === 'ROOFTOP') {
      type = 'exact';
      confidence = 0.95;
    } else if (result.geometry?.location_type === 'RANGE_INTERPOLATED') {
      type = 'approximate';
      confidence = 0.85;
    } else if (result.geometry?.location_type === 'GEOMETRIC_CENTER') {
      type = 'approximate';
      confidence = 0.75;
    } else {
      type = 'partial';
      confidence = 0.6;
    }

    return {
      address: result.formatted_address,
      formattedAddress: result.formatted_address,
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      },
      components,
      confidence,
      type
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Instância singleton para uso global
export const geocodingService = new GeocodingService();