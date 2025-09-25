import type { Passenger } from '../types';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface OptimizedRoute {
  waypoints: Coordinates[];
  orderedPassengers: Passenger[];
  totalDistance: number; // em metros
  totalDuration: number; // em segundos
  polylinePath: Coordinates[];
  pickupTimes: { passenger: Passenger; estimatedPickupTime: Date }[];
  optimizationSavings: {
    originalDistance: number;
    optimizedDistance: number;
    timeSaved: number; // em minutos
    fuelSaved: number; // em litros
  };
}

export interface RouteOptimizationOptions {
  startLocation: Coordinates;
  passengers: Passenger[];
  destination: Coordinates;
  optimizeOrder?: boolean;
  vehicleType?: 'bus' | 'van' | 'car';
  maxCapacity?: number;
  departureTime?: Date;
}

export interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  distance: number;
  duration: number;
  passenger?: Passenger;
  type: 'pickup' | 'dropoff' | 'transit';
}

export interface MultiStopRoute {
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  estimatedFuelConsumption: number;
  estimatedCost: number;
  efficiency: number; // 0-100%
}

class MockRouteOptimizationService {
  private readonly AVERAGE_SPEED = 30; // km/h em área urbana
  private readonly FUEL_CONSUMPTION = 0.12; // litros por km
  private readonly FUEL_PRICE = 5.50; // R$ por litro
  
  // Endereços mock para demonstração
  private readonly MOCK_LOCATIONS: Coordinates[] = [
    { lat: -23.5505, lng: -46.6333 }, // São Paulo Centro
    { lat: -23.5475, lng: -46.6361 }, // República
    { lat: -23.5558, lng: -46.6396 }, // Liberdade
    { lat: -23.5629, lng: -46.6544 }, // Vila Madalena
    { lat: -23.5489, lng: -46.6388 }, // Consolação
    { lat: -23.5506, lng: -46.6167 }, // Mooca
    { lat: -23.5733, lng: -46.6417 }, // Pinheiros
    { lat: -23.5955, lng: -46.6856 }, // Morumbi
    { lat: -23.5322, lng: -46.6267 }, // Santana
    { lat: -23.5815, lng: -46.6875 }  // Butantã
  ];

  /**
   * Calcula distância entre dois pontos usando fórmula de Haversine
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Gera passageiros mock com posições aleatórias
   */
  generateMockPassengers(count: number = 5): Passenger[] {
    const passengers: Passenger[] = [];
    const names = [
      'Ana Silva', 'João Santos', 'Maria Oliveira', 'Pedro Costa', 'Carla Souza',
      'Lucas Ferreira', 'Juliana Lima', 'Rafael Alves', 'Fernanda Rocha', 'Bruno Martins'
    ];

    for (let i = 0; i < count; i++) {
      const location = this.MOCK_LOCATIONS[i % this.MOCK_LOCATIONS.length];
      passengers.push({
        id: `passenger-${i + 1}`,
        name: names[i % names.length],
        position: {
          lat: location.lat + (Math.random() - 0.5) * 0.01, // Variação pequena
          lng: location.lng + (Math.random() - 0.5) * 0.01
        },
        pickupTime: new Date(Date.now() + Math.random() * 3600000).toISOString(), // Próxima hora
        photoUrl: `https://via.placeholder.com/150?text=${names[i % names.length].charAt(0)}`,
        cpf: `${Math.floor(Math.random() * 100000000000).toString().padStart(11, '0')}`,
        address: `Endereço ${i + 1}, São Paulo, SP`
      });
    }

    return passengers;
  }

  /**
   * Algoritmo de otimização usando Nearest Neighbor com melhorias
   */
  private optimizePassengerOrder(
    start: Coordinates,
    passengers: Passenger[],
    destination: Coordinates
  ): { orderedPassengers: Passenger[]; totalDistance: number } {
    if (passengers.length === 0) {
      const distance = this.calculateDistance(start.lat, start.lng, destination.lat, destination.lng);
      return { orderedPassengers: [], totalDistance: distance };
    }

    const unvisited = [...passengers];
    const ordered: Passenger[] = [];
    let currentLocation = start;
    let totalDistance = 0;

    // Algoritmo Nearest Neighbor
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        unvisited[0].position.lat,
        unvisited[0].position.lng
      );

      // Encontra o passageiro mais próximo
      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          unvisited[i].position.lat,
          unvisited[i].position.lng
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Adiciona à rota otimizada
      const nearestPassenger = unvisited.splice(nearestIndex, 1)[0];
      ordered.push(nearestPassenger);
      totalDistance += nearestDistance;
      currentLocation = nearestPassenger.position;
    }

    // Adiciona distância até o destino final
    totalDistance += this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      destination.lat,
      destination.lng
    );

    return { orderedPassengers: ordered, totalDistance };
  }

  /**
   * Calcula rota não otimizada (ordem original)
   */
  private calculateOriginalRoute(
    start: Coordinates,
    passengers: Passenger[],
    destination: Coordinates
  ): number {
    let totalDistance = 0;
    let currentLocation = start;

    for (const passenger of passengers) {
      totalDistance += this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        passenger.position.lat,
        passenger.position.lng
      );
      currentLocation = passenger.position;
    }

    // Distância até o destino final
    totalDistance += this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      destination.lat,
      destination.lng
    );

    return totalDistance;
  }

  /**
   * Gera polyline simplificada entre pontos
   */
  private generatePolyline(waypoints: Coordinates[]): Coordinates[] {
    const polyline: Coordinates[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];
      
      // Adiciona pontos intermediários para simular uma rota
      const steps = 5;
      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        polyline.push({
          lat: start.lat + (end.lat - start.lat) * ratio,
          lng: start.lng + (end.lng - start.lng) * ratio
        });
      }
    }

    return polyline;
  }

  /**
   * Calcula horários estimados de coleta
   */
  private calculatePickupTimes(
    orderedPassengers: Passenger[],
    totalDistance: number,
    departureTime: Date = new Date()
  ): { passenger: Passenger; estimatedPickupTime: Date }[] {
    const pickupTimes: { passenger: Passenger; estimatedPickupTime: Date }[] = [];
    let cumulativeTime = 0;

    for (let i = 0; i < orderedPassengers.length; i++) {
      // Estima tempo baseado na distância percorrida até este ponto
      const distanceRatio = i / orderedPassengers.length;
      const timeToPickup = (totalDistance / 1000) * distanceRatio * (60 / this.AVERAGE_SPEED); // minutos
      
      const estimatedTime = new Date(departureTime.getTime() + (cumulativeTime + timeToPickup) * 60000);
      
      pickupTimes.push({
        passenger: orderedPassengers[i],
        estimatedPickupTime: estimatedTime
      });

      cumulativeTime += timeToPickup + 2; // 2 minutos para embarque
    }

    return pickupTimes;
  }

  /**
   * Otimiza rota com múltiplos pontos de parada
   */
  async optimizeRoute(options: RouteOptimizationOptions): Promise<OptimizedRoute> {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

    const { startLocation, passengers, destination, optimizeOrder = true, departureTime } = options;

    if (passengers.length === 0) {
      throw new Error('Nenhum passageiro fornecido para otimização');
    }

    // Calcula rota original (não otimizada)
    const originalDistance = this.calculateOriginalRoute(startLocation, passengers, destination);

    // Calcula rota otimizada
    const { orderedPassengers, totalDistance } = optimizeOrder
      ? this.optimizePassengerOrder(startLocation, passengers, destination)
      : { orderedPassengers: passengers, totalDistance: originalDistance };

    // Gera waypoints
    const waypoints: Coordinates[] = [
      startLocation,
      ...orderedPassengers.map(p => p.position),
      destination
    ];

    // Gera polyline
    const polylinePath = this.generatePolyline(waypoints);

    // Calcula duração total
    const totalDuration = (totalDistance / 1000) * (3600 / this.AVERAGE_SPEED); // segundos

    // Calcula horários de coleta
    const pickupTimes = this.calculatePickupTimes(orderedPassengers, totalDistance, departureTime);

    // Calcula economia da otimização
    const distanceSaved = originalDistance - totalDistance;
    const timeSaved = (distanceSaved / 1000) * (60 / this.AVERAGE_SPEED); // minutos
    const fuelSaved = (distanceSaved / 1000) * this.FUEL_CONSUMPTION; // litros

    return {
      waypoints,
      orderedPassengers,
      totalDistance,
      totalDuration,
      polylinePath,
      pickupTimes,
      optimizationSavings: {
        originalDistance,
        optimizedDistance: totalDistance,
        timeSaved,
        fuelSaved
      }
    };
  }

  /**
   * Calcula rota com múltiplas paradas e segmentos detalhados
   */
  async calculateMultiStopRoute(options: RouteOptimizationOptions): Promise<MultiStopRoute> {
    const optimizedRoute = await this.optimizeRoute(options);
    const segments: RouteSegment[] = [];

    let currentLocation = options.startLocation;

    // Segmentos de coleta
    for (let i = 0; i < optimizedRoute.orderedPassengers.length; i++) {
      const passenger = optimizedRoute.orderedPassengers[i];
      const distance = this.calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        passenger.position.lat,
        passenger.position.lng
      );
      const duration = (distance / 1000) * (3600 / this.AVERAGE_SPEED);

      segments.push({
        from: currentLocation,
        to: passenger.position,
        distance,
        duration,
        passenger,
        type: 'pickup'
      });

      currentLocation = passenger.position;
    }

    // Segmento final até o destino
    const finalDistance = this.calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      options.destination.lat,
      options.destination.lng
    );
    const finalDuration = (finalDistance / 1000) * (3600 / this.AVERAGE_SPEED);

    segments.push({
      from: currentLocation,
      to: options.destination,
      distance: finalDistance,
      duration: finalDuration,
      type: 'dropoff'
    });

    const totalDistance = segments.reduce((sum, segment) => sum + segment.distance, 0);
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    const estimatedFuelConsumption = (totalDistance / 1000) * this.FUEL_CONSUMPTION;
    const estimatedCost = estimatedFuelConsumption * this.FUEL_PRICE;
    
    // Calcula eficiência baseada na otimização
    const originalDistance = this.calculateOriginalRoute(
      options.startLocation,
      options.passengers,
      options.destination
    );
    const efficiency = Math.max(0, Math.min(100, ((originalDistance - totalDistance) / originalDistance) * 100));

    return {
      segments,
      totalDistance,
      totalDuration,
      estimatedFuelConsumption,
      estimatedCost,
      efficiency
    };
  }

  /**
   * Obtém rotas disponíveis para demonstração
   */
  getAvailableRoutes(): Array<{
    id: string;
    name: string;
    startLocation: Coordinates;
    destination: Coordinates;
    passengerCount: number;
  }> {
    return [
      {
        id: 'route-centro-morumbi',
        name: 'Centro → Morumbi',
        startLocation: { lat: -23.5505, lng: -46.6333 },
        destination: { lat: -23.5955, lng: -46.6856 },
        passengerCount: 5
      },
      {
        id: 'route-vila-madalena-santana',
        name: 'Vila Madalena → Santana',
        startLocation: { lat: -23.5629, lng: -46.6544 },
        destination: { lat: -23.5322, lng: -46.6267 },
        passengerCount: 7
      },
      {
        id: 'route-pinheiros-mooca',
        name: 'Pinheiros → Mooca',
        startLocation: { lat: -23.5733, lng: -46.6417 },
        destination: { lat: -23.5506, lng: -46.6167 },
        passengerCount: 4
      }
    ];
  }
}

// Singleton instance
export const mockRouteOptimizationService = new MockRouteOptimizationService();
export default mockRouteOptimizationService;