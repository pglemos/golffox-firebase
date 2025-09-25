import { TravelTimeEstimate, TravelSegment, AlternativeRoute, TrafficCondition, TravelTimeOptions } from './travelTimeService';

export class MockTravelTimeService {
  private mockRoutes = [
    { id: '1', name: 'Rota Centro-Zona Sul', origin: 'Centro', destination: 'Zona Sul' },
    { id: '2', name: 'Rota Aeroporto-Centro', origin: 'Aeroporto', destination: 'Centro' },
    { id: '3', name: 'Rota Zona Norte-Shopping', origin: 'Zona Norte', destination: 'Shopping' },
    { id: '4', name: 'Rota Universidade-Centro', origin: 'Universidade', destination: 'Centro' },
  ];

  private generateRandomTime(base: number, variance: number): number {
    return Math.round(base + (Math.random() - 0.5) * variance);
  }

  private generateRandomDistance(base: number, variance: number): number {
    return Math.round((base + (Math.random() - 0.5) * variance) * 100) / 100;
  }

  private generateTrafficCondition(): TrafficCondition {
    const conditions: TrafficCondition[] = [TrafficCondition.LIGHT, TrafficCondition.MODERATE, TrafficCondition.HEAVY];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private generateSegments(totalDuration: number, totalDistance: number): TravelSegment[] {
    const numSegments = Math.floor(Math.random() * 3) + 2; // 2-4 segmentos
    const segments: TravelSegment[] = [];
    
    let remainingDuration = totalDuration;
    let remainingDistance = totalDistance;

    for (let i = 0; i < numSegments; i++) {
      const isLast = i === numSegments - 1;
      const duration = isLast ? remainingDuration : Math.floor(remainingDuration / (numSegments - i));
      const distance = isLast ? remainingDistance : Math.round((remainingDistance / (numSegments - i)) * 100) / 100;

      segments.push({
        from: `Ponto ${i}`,
        to: `Ponto ${i + 1}`,
        duration,
        distance,
        trafficDelay: Math.floor(Math.random() * 5), // 0-5 minutos de atraso
        passengerPickup: undefined
      });

      remainingDuration -= duration;
      remainingDistance -= distance;
    }

    return segments;
  }

  private getRandomInstruction(): string {
    const instructions = [
      'Siga em frente pela Av. Principal',
      'Vire à direita na Rua das Flores',
      'Continue pela rodovia por 5km',
      'Pegue a saída para o centro',
      'Vire à esquerda no semáforo',
      'Entre na rotatória e pegue a 2ª saída'
    ];
    return instructions[Math.floor(Math.random() * instructions.length)];
  }

  private generateAlternativeRoutes(mainDuration: number, mainDistance: number): AlternativeRoute[] {
    const numAlternatives = Math.floor(Math.random() * 2) + 1; // 1-2 alternativas
    const alternatives: AlternativeRoute[] = [];

    for (let i = 0; i < numAlternatives; i++) {
      const durationVariance = this.generateRandomTime(0, mainDuration * 0.3);
      const distanceVariance = this.generateRandomDistance(0, mainDistance * 0.2);
      const alternativeDuration = Math.max(mainDuration + durationVariance, 5);
      
      alternatives.push({
        name: `Rota Alternativa ${i + 1}`,
        duration: alternativeDuration,
        distance: Math.max(mainDistance + distanceVariance, 1),
        trafficDelay: Math.floor(Math.random() * 10), // 0-10 minutos de atraso
        savings: Math.max(mainDuration - alternativeDuration, 0) // tempo economizado
      });
    }

    return alternatives;
  }

  private getRandomRoadName(): string {
    const roads = [
      'Av. Paulista',
      'Rua Augusta',
      'Marginal Tietê',
      'Av. Faria Lima',
      'Rua da Consolação',
      'Av. Rebouças'
    ];
    return roads[Math.floor(Math.random() * roads.length)];
  }

  async calculateRouteTime(routeId: string, options?: TravelTimeOptions): Promise<TravelTimeEstimate> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const route = this.mockRoutes.find(r => r.id === routeId);
    if (!route) {
      throw new Error(`Rota ${routeId} não encontrada`);
    }

    const baseDuration = this.generateRandomTime(25, 20); // 15-35 minutos
    const baseDistance = this.generateRandomDistance(12, 8); // 8-16 km
    
    // Aplica modificadores baseados nas opções
    let duration = baseDuration;

    const trafficCondition = this.generateTrafficCondition();
    const trafficMultiplier = trafficCondition === 'heavy' ? 1.4 : trafficCondition === 'moderate' ? 1.2 : 1.0;
    duration = Math.round(duration * trafficMultiplier);

    const segments = this.generateSegments(duration, baseDistance);
    const alternatives = this.generateAlternativeRoutes(duration, baseDistance);

    return {
      routeId,
      totalDuration: duration,
      totalDistance: baseDistance,
      trafficConditions: trafficCondition,
      segments,
      alternativeRoutes: alternatives,
      estimatedArrival: new Date(Date.now() + duration * 60000)
    };
  }

  async calculatePointToPointTime(
    origin: string,
    destination: string,
    options?: TravelTimeOptions
  ): Promise<TravelTimeEstimate> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300));

    const baseDuration = this.generateRandomTime(20, 15);
    const baseDistance = this.generateRandomDistance(10, 6);
    
    let duration = baseDuration;

    const trafficCondition = this.generateTrafficCondition();
    const trafficMultiplier = trafficCondition === 'heavy' ? 1.3 : trafficCondition === 'moderate' ? 1.15 : 1.0;
    duration = Math.round(duration * trafficMultiplier);

    const segments = this.generateSegments(duration, baseDistance);
    const alternatives = this.generateAlternativeRoutes(duration, baseDistance);

    return {
      routeId: `${origin}-${destination}`,
      totalDuration: duration,
      totalDistance: baseDistance,
      trafficConditions: trafficCondition,
      segments,
      alternativeRoutes: alternatives,
      estimatedArrival: new Date(Date.now() + duration * 60000)
    };
  }

  getAvailableRoutes() {
    return this.mockRoutes;
  }

  async startTrafficMonitoring(routeIds: string[], callback: (updates: any[]) => void): Promise<void> {
    // Simula atualizações de tráfego a cada 30 segundos
    setInterval(async () => {
      const updates = [];
      for (const routeId of routeIds) {
        try {
          const estimate = await this.calculateRouteTime(routeId);
          updates.push({
            routeId,
            duration: estimate.totalDuration,
            trafficCondition: estimate.trafficConditions,
            timestamp: new Date()
          });
        } catch (error) {
          console.warn(`Erro ao atualizar rota ${routeId}:`, error);
        }
      }
      callback(updates);
    }, 30000);
  }

  stopTrafficMonitoring(): void {
    // Em uma implementação real, pararia os intervalos
    console.log('Monitoramento de tráfego interrompido');
  }
}

// Instância singleton para uso global
export const mockTravelTimeService = new MockTravelTimeService();