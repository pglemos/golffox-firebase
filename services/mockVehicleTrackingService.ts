// Mock service para rastreamento em tempo real de veículos
export interface VehicleLocation {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number; // km/h
  heading: number; // graus (0-360)
  accuracy: number; // metros
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  status: 'active' | 'inactive' | 'maintenance' | 'emergency';
  capacity: number;
  currentPassengers: number;
  routeId?: string;
  lastLocation?: VehicleLocation;
}

export interface TrackingEvent {
  id: string;
  vehicleId: string;
  type: 'location_update' | 'status_change' | 'emergency' | 'route_start' | 'route_end';
  data: any;
  timestamp: Date;
}

export interface VehicleMetrics {
  totalDistance: number; // km
  averageSpeed: number; // km/h
  fuelConsumption: number; // litros
  uptime: number; // horas
  efficiency: number; // %
}

export class MockVehicleTrackingService {
  private vehicles: Map<string, Vehicle> = new Map();
  private locations: Map<string, VehicleLocation[]> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, (event: TrackingEvent) => void> = new Map();

  constructor() {
    this.initializeMockVehicles();
  }

  private initializeMockVehicles() {
    const mockVehicles: Vehicle[] = [
      {
        id: 'v1',
        plate: 'ABC-1234',
        model: 'Mercedes Sprinter',
        driver: 'João Silva',
        status: 'active',
        capacity: 20,
        currentPassengers: 12,
        routeId: 'route-1'
      },
      {
        id: 'v2',
        plate: 'DEF-5678',
        model: 'Iveco Daily',
        driver: 'Maria Santos',
        status: 'active',
        capacity: 16,
        currentPassengers: 8,
        routeId: 'route-2'
      },
      {
        id: 'v3',
        plate: 'GHI-9012',
        model: 'Volkswagen Crafter',
        driver: 'Pedro Costa',
        status: 'inactive',
        capacity: 18,
        currentPassengers: 0
      },
      {
        id: 'v4',
        plate: 'JKL-3456',
        model: 'Ford Transit',
        driver: 'Ana Oliveira',
        status: 'maintenance',
        capacity: 15,
        currentPassengers: 0
      }
    ];

    mockVehicles.forEach(vehicle => {
      this.vehicles.set(vehicle.id, vehicle);
      this.locations.set(vehicle.id, []);
      
      // Gera localização inicial para veículos ativos
      if (vehicle.status === 'active') {
        const initialLocation = this.generateRandomLocation(vehicle.id);
        vehicle.lastLocation = initialLocation;
        this.locations.get(vehicle.id)?.push(initialLocation);
      }
    });
  }

  private generateRandomLocation(vehicleId: string): VehicleLocation {
    // Coordenadas base de São Paulo
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    
    // Variação aleatória dentro de um raio de ~10km
    const latVariation = (Math.random() - 0.5) * 0.2;
    const lngVariation = (Math.random() - 0.5) * 0.2;

    return {
      id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId,
      lat: baseLat + latVariation,
      lng: baseLng + lngVariation,
      timestamp: new Date(),
      speed: Math.random() * 60 + 10, // 10-70 km/h
      heading: Math.random() * 360,
      accuracy: Math.random() * 10 + 5 // 5-15 metros
    };
  }

  /**
   * Inicia rastreamento em tempo real de um veículo
   */
  startTracking(vehicleId: string, intervalMs: number = 5000): void {
    if (this.trackingIntervals.has(vehicleId)) {
      this.stopTracking(vehicleId);
    }

    const interval = setInterval(() => {
      const vehicle = this.vehicles.get(vehicleId);
      if (vehicle && vehicle.status === 'active') {
        const newLocation = this.generateRandomLocation(vehicleId);
        
        // Atualiza localização do veículo
        vehicle.lastLocation = newLocation;
        this.locations.get(vehicleId)?.push(newLocation);
        
        // Mantém apenas as últimas 100 localizações
        const locations = this.locations.get(vehicleId);
        if (locations && locations.length > 100) {
          locations.splice(0, locations.length - 100);
        }

        // Emite evento de atualização
        this.emitEvent({
          id: `event_${Date.now()}`,
          vehicleId,
          type: 'location_update',
          data: newLocation,
          timestamp: new Date()
        });
      }
    }, intervalMs);

    this.trackingIntervals.set(vehicleId, interval);
  }

  /**
   * Para rastreamento de um veículo
   */
  stopTracking(vehicleId: string): void {
    const interval = this.trackingIntervals.get(vehicleId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(vehicleId);
    }
  }

  /**
   * Para todos os rastreamentos
   */
  stopAllTracking(): void {
    this.trackingIntervals.forEach((interval, vehicleId) => {
      clearInterval(interval);
    });
    this.trackingIntervals.clear();
  }

  /**
   * Obtém todos os veículos
   */
  getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  /**
   * Obtém veículo por ID
   */
  getVehicle(vehicleId: string): Vehicle | undefined {
    return this.vehicles.get(vehicleId);
  }

  /**
   * Obtém histórico de localizações de um veículo
   */
  getVehicleLocationHistory(vehicleId: string, limit: number = 50): VehicleLocation[] {
    const locations = this.locations.get(vehicleId) || [];
    return locations.slice(-limit);
  }

  /**
   * Obtém localização atual de um veículo
   */
  getCurrentLocation(vehicleId: string): VehicleLocation | undefined {
    const vehicle = this.vehicles.get(vehicleId);
    return vehicle?.lastLocation;
  }

  /**
   * Atualiza status de um veículo
   */
  updateVehicleStatus(vehicleId: string, status: Vehicle['status']): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      const oldStatus = vehicle.status;
      vehicle.status = status;

      // Para rastreamento se veículo ficar inativo
      if (status !== 'active') {
        this.stopTracking(vehicleId);
      }

      // Emite evento de mudança de status
      this.emitEvent({
        id: `event_${Date.now()}`,
        vehicleId,
        type: 'status_change',
        data: { oldStatus, newStatus: status },
        timestamp: new Date()
      });
    }
  }

  /**
   * Calcula métricas de um veículo
   */
  getVehicleMetrics(vehicleId: string): VehicleMetrics {
    const locations = this.locations.get(vehicleId) || [];
    
    if (locations.length < 2) {
      return {
        totalDistance: 0,
        averageSpeed: 0,
        fuelConsumption: 0,
        uptime: 0,
        efficiency: 0
      };
    }

    let totalDistance = 0;
    let totalSpeed = 0;
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      // Calcula distância usando fórmula de Haversine simplificada
      const distance = this.calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      totalDistance += distance;
      totalSpeed += curr.speed;
    }

    const averageSpeed = totalSpeed / locations.length;
    const fuelConsumption = totalDistance * 0.35; // ~0.35L por km
    const uptime = locations.length * 5 / 60; // 5 segundos por localização convertido para horas
    const efficiency = Math.min(100, (averageSpeed / 50) * 100); // Eficiência baseada na velocidade

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      averageSpeed: Math.round(averageSpeed * 100) / 100,
      fuelConsumption: Math.round(fuelConsumption * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      efficiency: Math.round(efficiency)
    };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Adiciona listener para eventos de rastreamento
   */
  addEventListener(id: string, callback: (event: TrackingEvent) => void): void {
    this.eventListeners.set(id, callback);
  }

  /**
   * Remove listener de eventos
   */
  removeEventListener(id: string): void {
    this.eventListeners.delete(id);
  }

  private emitEvent(event: TrackingEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Erro ao emitir evento de rastreamento:', error);
      }
    });
  }

  /**
   * Simula emergência em um veículo
   */
  simulateEmergency(vehicleId: string, emergencyType: string = 'breakdown'): void {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      this.updateVehicleStatus(vehicleId, 'emergency');
      
      this.emitEvent({
        id: `emergency_${Date.now()}`,
        vehicleId,
        type: 'emergency',
        data: { 
          type: emergencyType,
          location: vehicle.lastLocation,
          passengers: vehicle.currentPassengers
        },
        timestamp: new Date()
      });
    }
  }

  /**
   * Obtém veículos próximos a uma localização
   */
  getNearbyVehicles(lat: number, lng: number, radiusKm: number = 5): Vehicle[] {
    return this.getVehicles().filter(vehicle => {
      if (!vehicle.lastLocation || vehicle.status !== 'active') return false;
      
      const distance = this.calculateDistance(
        lat, lng,
        vehicle.lastLocation.lat, vehicle.lastLocation.lng
      );
      
      return distance <= radiusKm;
    });
  }
}

// Instância singleton
export const mockVehicleTrackingService = new MockVehicleTrackingService();