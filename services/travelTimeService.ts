import { Route, Passenger } from '../types';

export interface TravelTimeEstimate {
  routeId: string;
  totalDuration: number; // em minutos
  totalDistance: number; // em metros
  segments: TravelSegment[];
  estimatedArrival: Date;
  trafficConditions: TrafficCondition;
  alternativeRoutes?: AlternativeRoute[];
}

export interface TravelSegment {
  from: string;
  to: string;
  duration: number; // em minutos
  distance: number; // em metros
  trafficDelay: number; // em minutos
  passengerPickup?: Passenger;
}

export interface AlternativeRoute {
  name: string;
  duration: number;
  distance: number;
  trafficDelay: number;
  savings: number; // tempo economizado em minutos
}

export enum TrafficCondition {
  LIGHT = 'light',
  MODERATE = 'moderate',
  HEAVY = 'heavy',
  SEVERE = 'severe'
}

export interface TravelTimeOptions {
  departureTime?: Date;
  includeTraffic?: boolean;
  includeAlternatives?: boolean;
  optimizeRoute?: boolean;
}

class TravelTimeService {
  private directionsService: google.maps.DirectionsService | null = null;
  private distanceMatrixService: google.maps.DistanceMatrixService | null = null;
  private trafficModel: google.maps.TrafficModel = google.maps.TrafficModel.BEST_GUESS;

  constructor() {
    this.initializeServices();
  }

  private initializeServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.directionsService = new google.maps.DirectionsService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }
  }

  /**
   * Calcula estimativa de tempo de viagem para uma rota completa
   */
  async calculateRouteTime(route: Route, options: TravelTimeOptions = {}): Promise<TravelTimeEstimate> {
    if (!this.directionsService) {
      throw new Error('Google Maps services not initialized');
    }

    const {
      departureTime = new Date(),
      includeTraffic = true,
      includeAlternatives = false,
      optimizeRoute = true
    } = options;

    try {
      // Preparar waypoints da rota
      const waypoints = this.prepareWaypoints(route);
      
      // Calcular rota principal
      const directionsResult = await this.getDirections(
        waypoints.origin,
        waypoints.destination,
        waypoints.stops,
        departureTime,
        includeTraffic
      );

      // Processar segmentos da rota
      const segments = await this.processRouteSegments(directionsResult, route.passengers.list);

      // Calcular condições de trânsito
      const trafficConditions = this.analyzeTrafficConditions(segments);

      // Calcular rotas alternativas se solicitado
      let alternativeRoutes: AlternativeRoute[] = [];
      if (includeAlternatives) {
        alternativeRoutes = await this.calculateAlternativeRoutes(
          waypoints.origin,
          waypoints.destination,
          departureTime
        );
      }

      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration + segment.trafficDelay, 0);
      const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
      const estimatedArrival = new Date(departureTime.getTime() + totalDuration * 60000);

      return {
        routeId: route.id,
        totalDuration,
        totalDistance,
        segments,
        estimatedArrival,
        trafficConditions,
        alternativeRoutes
      };

    } catch (error) {
      console.error('Erro ao calcular tempo de viagem:', error);
      throw new Error('Falha ao calcular estimativa de tempo de viagem');
    }
  }

  /**
   * Calcula tempo de viagem entre dois pontos específicos
   */
  async calculatePointToPointTime(
    origin: string,
    destination: string,
    departureTime: Date = new Date()
  ): Promise<{ duration: number; distance: number; trafficDelay: number }> {
    if (!this.distanceMatrixService) {
      throw new Error('Distance Matrix service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.distanceMatrixService!.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: departureTime,
          trafficModel: this.trafficModel
        },
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0].elements[0];
          
          if (element.status === google.maps.DistanceMatrixElementStatus.OK) {
            const duration = Math.round(element.duration.value / 60); // converter para minutos
            const durationInTraffic = element.duration_in_traffic 
              ? Math.round(element.duration_in_traffic.value / 60) 
              : duration;
            const distance = element.distance.value; // em metros
            const trafficDelay = Math.max(0, durationInTraffic - duration);

            resolve({
              duration: durationInTraffic,
              distance,
              trafficDelay
            });
          } else {
            reject(new Error(`Erro ao calcular distância: ${element.status}`));
          }
        } else {
          reject(new Error(`Erro no serviço de matriz de distância: ${status}`));
        }
      });
    });
  }

  /**
   * Monitora mudanças de trânsito em tempo real
   */
  async monitorTrafficChanges(routeId: string, callback: (update: TrafficUpdate) => void): Promise<void> {
    // Implementar monitoramento em tempo real
    const monitorInterval = setInterval(async () => {
      try {
        // Aqui seria implementada a lógica de monitoramento
        // Por enquanto, simular mudanças de trânsito
        const trafficUpdate: TrafficUpdate = {
          routeId,
          timestamp: new Date(),
          delayChange: Math.floor(Math.random() * 10) - 5, // -5 a +5 minutos
          newTrafficCondition: this.getRandomTrafficCondition(),
          affectedSegments: []
        };

        callback(trafficUpdate);
      } catch (error) {
        console.error('Erro no monitoramento de trânsito:', error);
      }
    }, 30000); // Verificar a cada 30 segundos

    // Armazenar referência do intervalo para poder cancelar depois
    (this as any)[`monitor_${routeId}`] = monitorInterval;
  }

  /**
   * Para o monitoramento de trânsito para uma rota específica
   */
  stopTrafficMonitoring(routeId: string): void {
    const monitorInterval = (this as any)[`monitor_${routeId}`];
    if (monitorInterval) {
      clearInterval(monitorInterval);
      delete (this as any)[`monitor_${routeId}`];
    }
  }

  // Métodos auxiliares privados

  private prepareWaypoints(route: Route) {
    const stops = route.passengers.list
      .filter(p => p.address && p.address.trim() !== '')
      .map(p => ({ location: p.address, stopover: true }));

    return {
      origin: route.origin || 'São Paulo, SP',
      destination: route.destination || 'São Paulo, SP',
      stops
    };
  }

  private async getDirections(
    origin: string,
    destination: string,
    waypoints: google.maps.DirectionsWaypoint[],
    departureTime: Date,
    includeTraffic: boolean
  ): Promise<google.maps.DirectionsResult> {
    return new Promise((resolve, reject) => {
      this.directionsService!.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        drivingOptions: includeTraffic ? {
          departureTime,
          trafficModel: this.trafficModel
        } : undefined
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(new Error(`Erro ao calcular direções: ${status}`));
        }
      });
    });
  }

  private async processRouteSegments(
    directionsResult: google.maps.DirectionsResult,
    passengers: Passenger[]
  ): Promise<TravelSegment[]> {
    const segments: TravelSegment[] = [];
    const legs = directionsResult.routes[0].legs;

    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const duration = Math.round(leg.duration.value / 60);
      const durationInTraffic = leg.duration_in_traffic 
        ? Math.round(leg.duration_in_traffic.value / 60) 
        : duration;
      const trafficDelay = Math.max(0, durationInTraffic - duration);

      // Encontrar passageiro correspondente a este segmento
      const passengerPickup = i < passengers.length ? passengers[i] : undefined;

      segments.push({
        from: leg.start_address,
        to: leg.end_address,
        duration: durationInTraffic,
        distance: leg.distance.value,
        trafficDelay,
        passengerPickup
      });
    }

    return segments;
  }

  private analyzeTrafficConditions(segments: TravelSegment[]): TrafficCondition {
    const totalDelay = segments.reduce((sum, segment) => sum + segment.trafficDelay, 0);
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    const delayPercentage = totalDuration > 0 ? (totalDelay / totalDuration) * 100 : 0;

    if (delayPercentage < 10) return TrafficCondition.LIGHT;
    if (delayPercentage < 25) return TrafficCondition.MODERATE;
    if (delayPercentage < 50) return TrafficCondition.HEAVY;
    return TrafficCondition.SEVERE;
  }

  private async calculateAlternativeRoutes(
    origin: string,
    destination: string,
    departureTime: Date
  ): Promise<AlternativeRoute[]> {
    // Implementar cálculo de rotas alternativas
    // Por enquanto, retornar rotas simuladas
    return [
      {
        name: 'Rota via Marginal',
        duration: 45,
        distance: 25000,
        trafficDelay: 8,
        savings: 5
      },
      {
        name: 'Rota via Centro',
        duration: 52,
        distance: 22000,
        trafficDelay: 12,
        savings: -2
      }
    ];
  }

  private getRandomTrafficCondition(): TrafficCondition {
    const conditions = Object.values(TrafficCondition);
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
}

export interface TrafficUpdate {
  routeId: string;
  timestamp: Date;
  delayChange: number; // mudança em minutos
  newTrafficCondition: TrafficCondition;
  affectedSegments: string[];
}

// Instância singleton do serviço (comentado para usar mock)
// export const travelTimeService = new TravelTimeService();