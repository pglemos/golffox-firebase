import { GeocodingResult, AddressValidationResult, GeocodingOptions } from './geocodingService';

export class MockGeocodingService {
  private mockAddresses = [
    {
      input: 'Av. Paulista, 1000, São Paulo, SP',
      result: {
        address: 'Av. Paulista, 1000, Bela Vista, São Paulo - SP, 01310-100, Brasil',
        formattedAddress: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100, Brasil',
        coordinates: { lat: -23.5631, lng: -46.6554 },
        components: {
          streetNumber: '1000',
          street: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01310-100',
          country: 'BR'
        },
        confidence: 0.95,
        type: 'exact' as const
      }
    },
    {
      input: 'Rua Augusta, 500, São Paulo',
      result: {
        address: 'Rua Augusta, 500, Consolação, São Paulo - SP, 01305-000, Brasil',
        formattedAddress: 'R. Augusta, 500 - Consolação, São Paulo - SP, 01305-000, Brasil',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        components: {
          streetNumber: '500',
          street: 'Rua Augusta',
          neighborhood: 'Consolação',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01305-000',
          country: 'BR'
        },
        confidence: 0.92,
        type: 'exact' as const
      }
    },
    {
      input: 'Centro, São Paulo',
      result: {
        address: 'Centro, São Paulo - SP, Brasil',
        formattedAddress: 'Centro, São Paulo - SP, Brasil',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        components: {
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          country: 'BR'
        },
        confidence: 0.75,
        type: 'approximate' as const
      }
    },
    {
      input: 'Aeroporto de Guarulhos',
      result: {
        address: 'Aeroporto Internacional de São Paulo/Guarulhos - Governador André Franco Montoro, Guarulhos - SP, Brasil',
        formattedAddress: 'Aeroporto de Guarulhos - Guarulhos, SP, Brasil',
        coordinates: { lat: -23.4356, lng: -46.4731 },
        components: {
          street: 'Aeroporto Internacional de São Paulo/Guarulhos',
          city: 'Guarulhos',
          state: 'SP',
          country: 'BR'
        },
        confidence: 0.88,
        type: 'exact' as const
      }
    }
  ];

  private generateRandomCoordinates(baseCoords: { lat: number; lng: number }, variance: number = 0.01) {
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * variance,
      lng: baseCoords.lng + (Math.random() - 0.5) * variance
    };
  }

  private findBestMatch(address: string): GeocodingResult | null {
    const normalizedInput = this.normalizeAddress(address);
    
    // Procurar correspondência exata
    for (const mock of this.mockAddresses) {
      if (this.normalizeAddress(mock.input) === normalizedInput) {
        return mock.result;
      }
    }

    // Procurar correspondência parcial
    for (const mock of this.mockAddresses) {
      const mockNormalized = this.normalizeAddress(mock.input);
      if (mockNormalized.includes(normalizedInput) || normalizedInput.includes(mockNormalized)) {
        return {
          ...mock.result,
          confidence: Math.max(0.6, mock.result.confidence - 0.2),
          type: 'approximate' as const
        };
      }
    }

    return null;
  }

  private generateMockResult(address: string): GeocodingResult {
    // Gerar resultado mock baseado no endereço fornecido
    const parts = address.split(',').map(p => p.trim());
    const baseCoords = { lat: -23.5505, lng: -46.6333 }; // São Paulo como base
    
    return {
      address: address,
      formattedAddress: this.formatAddress(address),
      coordinates: this.generateRandomCoordinates(baseCoords),
      components: this.parseAddressParts(parts),
      confidence: Math.random() * 0.4 + 0.5, // 0.5 - 0.9
      type: Math.random() > 0.7 ? 'exact' : 'approximate'
    };
  }

  private parseAddressParts(parts: string[]) {
    const components: any = {};
    
    parts.forEach((part, index) => {
      if (index === 0 && /\d/.test(part)) {
        // Primeira parte com número - provavelmente rua e número
        const match = part.match(/^(.+?)\s*,?\s*(\d+)$/);
        if (match) {
          components.street = match[1];
          components.streetNumber = match[2];
        } else {
          components.street = part;
        }
      } else if (index === 1) {
        components.neighborhood = part;
      } else if (index === 2) {
        components.city = part;
      } else if (index === 3 && part.length === 2) {
        components.state = part.toUpperCase();
      } else if (/^\d{5}-?\d{3}$/.test(part)) {
        components.postalCode = part;
      }
    });

    components.country = 'BR';
    return components;
  }

  private formatAddress(address: string): string {
    return address
      .split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .join(', ');
  }

  async geocodeAddress(
    address: string, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));

    if (!address || address.trim().length < 3) {
      return [];
    }

    const results: GeocodingResult[] = [];
    
    // Tentar encontrar correspondência nos dados mock
    const bestMatch = this.findBestMatch(address);
    if (bestMatch) {
      results.push(bestMatch);
    }

    // Adicionar resultado gerado se não encontrou correspondência ou se quer mais resultados
    if (results.length === 0 || (options.maxResults && results.length < options.maxResults)) {
      const mockResult = this.generateMockResult(address);
      results.push(mockResult);
    }

    // Gerar resultados adicionais se solicitado
    const maxResults = options.maxResults || 3;
    while (results.length < maxResults && results.length < 5) {
      const variation = this.generateAddressVariation(address, results.length);
      results.push(variation);
    }

    return results.slice(0, maxResults);
  }

  async reverseGeocode(
    lat: number, 
    lng: number, 
    options: GeocodingOptions = {}
  ): Promise<GeocodingResult[]> {
    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 600 + 300));

    // Encontrar endereço mock mais próximo
    let closestAddress = this.mockAddresses[0].result;
    let minDistance = this.calculateDistance(
      { lat, lng }, 
      closestAddress.coordinates
    );

    for (const mock of this.mockAddresses) {
      const distance = this.calculateDistance({ lat, lng }, mock.result.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        closestAddress = mock.result;
      }
    }

    // Gerar variação baseada nas coordenadas
    const result: GeocodingResult = {
      ...closestAddress,
      coordinates: { lat, lng },
      confidence: Math.max(0.7, 1 - minDistance / 10), // Reduzir confiança com distância
      address: `Endereço próximo a ${closestAddress.address}`,
      formattedAddress: `Próximo a ${closestAddress.formattedAddress}`
    };

    return [result];
  }

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
    if (!address || address.trim().length < 3) {
      result.errors.push('Endereço muito curto ou vazio');
      return result;
    }

    if (address.length > 200) {
      result.errors.push('Endereço muito longo');
      return result;
    }

    // Verificar caracteres especiais problemáticos
    if (/[<>{}[\]\\|`~!@#$%^&*()+=]/.test(address)) {
      result.warnings.push('Endereço contém caracteres especiais que podem causar problemas');
    }

    // Verificar se parece com um endereço brasileiro
    if (!/brasil|br|sp|rj|mg|rs|pr|sc|go|mt|ms|ba|pe|ce|pa|am|ro|ac|ap|rr|to|al|se|pb|rn|pi|ma|df/i.test(address)) {
      result.warnings.push('Endereço pode não estar no Brasil');
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

      // Verificar completude do endereço
      if (!bestResult.components.streetNumber) {
        result.warnings.push('Número do endereço não especificado');
      }

      if (!bestResult.components.postalCode) {
        result.warnings.push('CEP não encontrado');
      }

      if (!bestResult.components.city) {
        result.warnings.push('Cidade não identificada');
      }

    } catch (error) {
      result.errors.push(`Erro ao validar endereço: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  private generateAddressVariation(baseAddress: string, index: number): GeocodingResult {
    const variations = [
      'Próximo a',
      'Nas proximidades de',
      'Região de',
      'Área de'
    ];

    const variation = variations[index % variations.length];
    const baseCoords = { lat: -23.5505, lng: -46.6333 };
    
    return {
      address: `${variation} ${baseAddress}`,
      formattedAddress: `${variation} ${this.formatAddress(baseAddress)}`,
      coordinates: this.generateRandomCoordinates(baseCoords, 0.02),
      components: this.parseAddressParts(baseAddress.split(',')),
      confidence: Math.max(0.4, 0.8 - index * 0.1),
      type: 'approximate'
    };
  }

  private calculateDistance(
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

  private normalizeAddress(address: string): string {
    return address
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,]/g, '');
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Instância singleton para uso global
export const mockGeocodingService = new MockGeocodingService();