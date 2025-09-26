import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// Tipos baseados no schema do Supabase
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
export type VehicleUpdate = Database['public']['Tables']['vehicles']['Update'];

// Interfaces para compatibilidade com o código existente
// Usando campos de posição da tabela vehicles
export interface VehicleLocation {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;
  heading: number;
  accuracy: number;
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
  totalDistance: number;
  averageSpeed: number;
  fuelConsumption: number;
  uptime: number;
  efficiency: number;
}

export class VehicleTrackingService {
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, (event: TrackingEvent) => void> = new Map();

  /**
   * Converte dados do Supabase para o formato esperado pela aplicação
   */
  private convertVehicleFromDB(dbVehicle: VehicleRow): Vehicle {
    return {
      id: dbVehicle.id,
      plate: dbVehicle.plate,
      model: dbVehicle.model,
      driver: dbVehicle.driver_id || 'Não atribuído',
      status: dbVehicle.status as Vehicle['status'],
      capacity: 0, // Campo não existe na tabela
      currentPassengers: 0, // Campo não existe na tabela
      routeId: dbVehicle.route_id || undefined,
      lastLocation: (dbVehicle.position_lat && dbVehicle.position_lng) ? {
        id: dbVehicle.id,
        vehicleId: dbVehicle.id,
        lat: dbVehicle.position_lat,
        lng: dbVehicle.position_lng,
        timestamp: new Date(dbVehicle.updated_at),
        speed: 0,
        heading: 0,
        accuracy: 0
      } : undefined
    };
  }



  /**
   * Obtém todos os veículos com suas últimas localizações
   */
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return vehicles.map(vehicle => {
        return this.convertVehicleFromDB(vehicle);
      });
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }
  }

  /**
   * Obtém veículo por ID
   */
  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
      }

      return this.convertVehicleFromDB(vehicle);
    } catch (error) {
      console.error('Erro ao buscar veículo:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de localizações de um veículo
   * Nota: Simplificado para usar apenas a tabela vehicles
   */
  async getVehicleLocationHistory(vehicleId: string, limit: number = 50): Promise<VehicleLocation[]> {
    try {
      const vehicle = await this.getVehicle(vehicleId);
      if (!vehicle || !vehicle.lastLocation) return [];

      // Retorna apenas a localização atual do veículo
      return [{
        id: vehicle.id,
        vehicleId: vehicle.id,
        lat: vehicle.lastLocation.lat,
        lng: vehicle.lastLocation.lng,
        timestamp: vehicle.lastLocation.timestamp,
        speed: 0,
        heading: 0,
        accuracy: 0
      }];
    } catch (error) {
      console.error('Erro ao buscar histórico de localizações:', error);
      throw error;
    }
  }

  /**
   * Obtém localização atual de um veículo
   */
  async getCurrentLocation(vehicleId: string): Promise<VehicleLocation | null> {
    try {
      const vehicle = await this.getVehicle(vehicleId);
      if (!vehicle || !vehicle.lastLocation) return null;

      return {
        id: vehicle.id,
        vehicleId: vehicle.id,
        lat: vehicle.lastLocation.lat,
        lng: vehicle.lastLocation.lng,
        timestamp: vehicle.lastLocation.timestamp,
        speed: 0,
        heading: 0,
        accuracy: 0
      };
    } catch (error) {
      console.error('Erro ao buscar localização atual:', error);
      throw error;
    }
  }

  /**
   * Atualiza localização de um veículo
   */
  async updateVehicleLocation(vehicleId: string, location: Omit<VehicleLocation, 'id' | 'vehicleId' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          position_lat: location.lat,
          position_lng: location.lng,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) throw error;

      // Emite evento de atualização de localização
      this.emitEvent({
        id: `location_${Date.now()}`,
        vehicleId,
        type: 'location_update',
        data: location,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar localização do veículo:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de um veículo
   */
  async updateVehicleStatus(vehicleId: string, status: Vehicle['status']): Promise<void> {
    try {
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('status')
        .eq('id', vehicleId)
        .single();

      if (fetchError) throw fetchError;

      const oldStatus = vehicle.status;

      const { error } = await supabase
        .from('vehicles')
        .update({ status })
        .eq('id', vehicleId);

      if (error) throw error;

      // Para rastreamento se veículo ficar inativo
      if (status !== 'active') {
        this.stopTracking(vehicleId);
      }

      // Emite evento de mudança de status
      this.emitEvent({
        id: `status_${Date.now()}`,
        vehicleId,
        type: 'status_change',
        data: { oldStatus, newStatus: status },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar status do veículo:', error);
      throw error;
    }
  }

  /**
   * Inicia rastreamento de um veículo (simulação)
   */
  startTracking(vehicleId: string): void {
    if (this.trackingIntervals.has(vehicleId)) {
      return; // Já está sendo rastreado
    }

    // Simula atualizações de localização a cada 30 segundos
    const interval = setInterval(async () => {
      try {
        const vehicle = await this.getVehicle(vehicleId);
        if (!vehicle || vehicle.status !== 'active') {
          this.stopTracking(vehicleId);
          return;
        }

        // Simula movimento do veículo
        const lastLocation = vehicle.lastLocation;
        if (lastLocation) {
          const newLocation = {
            lat: lastLocation.lat + (Math.random() - 0.5) * 0.001,
            lng: lastLocation.lng + (Math.random() - 0.5) * 0.001,
            speed: 20 + Math.random() * 40,
            heading: Math.random() * 360,
            accuracy: 5 + Math.random() * 10
          };

          await this.updateVehicleLocation(vehicleId, newLocation);
        }
      } catch (error) {
        console.error(`Erro no rastreamento do veículo ${vehicleId}:`, error);
      }
    }, 30000);

    this.trackingIntervals.set(vehicleId, interval);

    // Emite evento de início de rastreamento
    this.emitEvent({
      id: `tracking_start_${Date.now()}`,
      vehicleId,
      type: 'route_start',
      data: { tracking: true },
      timestamp: new Date()
    });
  }

  /**
   * Para rastreamento de um veículo
   */
  stopTracking(vehicleId: string): void {
    const interval = this.trackingIntervals.get(vehicleId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(vehicleId);

      // Emite evento de fim de rastreamento
      this.emitEvent({
        id: `tracking_stop_${Date.now()}`,
        vehicleId,
        type: 'route_end',
        data: { tracking: false },
        timestamp: new Date()
      });
    }
  }

  /**
   * Para todos os rastreamentos
   */
  stopAllTracking(): void {
    this.trackingIntervals.forEach((interval, vehicleId) => {
      clearInterval(interval);
      this.emitEvent({
        id: `tracking_stop_all_${Date.now()}`,
        vehicleId,
        type: 'route_end',
        data: { tracking: false },
        timestamp: new Date()
      });
    });
    this.trackingIntervals.clear();
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

  /**
   * Emite evento para todos os listeners
   */
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
  async simulateEmergency(vehicleId: string, emergencyType: string = 'breakdown'): Promise<void> {
    try {
      await this.updateVehicleStatus(vehicleId, 'emergency');
      
      const vehicle = await this.getVehicle(vehicleId);
      
      this.emitEvent({
        id: `emergency_${Date.now()}`,
        vehicleId,
        type: 'emergency',
        data: { 
          type: emergencyType,
          location: vehicle?.lastLocation,
          passengers: vehicle?.currentPassengers || 0
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Erro ao simular emergência:', error);
      throw error;
    }
  }

  /**
   * Calcula distância entre dois pontos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Obtém veículos próximos a uma localização
   */
  async getNearbyVehicles(lat: number, lng: number, radiusKm: number = 5): Promise<Vehicle[]> {
    try {
      const vehicles = await this.getVehicles();
      
      return vehicles.filter(vehicle => {
        if (!vehicle.lastLocation || vehicle.status !== 'active') return false;
        
        const distance = this.calculateDistance(
          lat, lng,
          vehicle.lastLocation.lat, vehicle.lastLocation.lng
        );
        
        return distance <= radiusKm;
      });
    } catch (error) {
      console.error('Erro ao buscar veículos próximos:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas de um veículo
   */
  async getVehicleMetrics(vehicleId: string): Promise<VehicleMetrics> {
    try {
      // Busca histórico de localizações para calcular métricas
      const locations = await this.getVehicleLocationHistory(vehicleId, 100);
      
      if (locations.length === 0) {
        return {
          totalDistance: 0,
          averageSpeed: 0,
          fuelConsumption: 0,
          uptime: 0,
          efficiency: 0
        };
      }

      // Calcula distância total
      let totalDistance = 0;
      let totalSpeed = 0;
      
      for (let i = 1; i < locations.length; i++) {
        const distance = this.calculateDistance(
          locations[i-1].lat, locations[i-1].lng,
          locations[i].lat, locations[i].lng
        );
        totalDistance += distance;
        totalSpeed += locations[i].speed;
      }

      const averageSpeed = locations.length > 1 ? totalSpeed / (locations.length - 1) : 0;
      const fuelConsumption = totalDistance * 0.12; // 0.12L por km
      const uptime = locations.length > 1 ? 
        (locations[0].timestamp.getTime() - locations[locations.length - 1].timestamp.getTime()) / (1000 * 60 * 60) : 0;
      const efficiency = averageSpeed > 0 ? Math.min(100, (averageSpeed / 50) * 100) : 0;

      return {
        totalDistance,
        averageSpeed,
        fuelConsumption,
        uptime,
        efficiency
      };
    } catch (error) {
      console.error('Erro ao calcular métricas do veículo:', error);
      throw error;
    }
  }
}

// Instância singleton
export const vehicleTrackingService = new VehicleTrackingService();