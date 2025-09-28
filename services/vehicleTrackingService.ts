import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  GeoPoint
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interfaces para compatibilidade com o código existente
export interface VehicleLocation {
  id: string;
  vehicleId: string;
  lat: number;
  lng: number;
  timestamp: Date;
  speed: number;
  heading: number;
  accuracy: number;
  companyId: string;
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
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackingEvent {
  id: string;
  vehicleId: string;
  type: 'location_update' | 'status_change' | 'emergency' | 'route_start' | 'route_end';
  data: any;
  timestamp: Date;
  companyId: string;
}

export interface VehicleMetrics {
  totalDistance: number;
  averageSpeed: number;
  fuelConsumption: number;
  uptime: number;
  efficiency: number;
  lastUpdated: Date;
}

export interface VehicleFilters {
  companyId?: string;
  status?: string;
  routeId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface LocationUpdate {
  vehicleId: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  accuracy: number;
  timestamp?: Date;
  companyId: string;
}

export interface VehicleStatistics {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  maintenanceVehicles: number;
  emergencyVehicles: number;
  averageSpeed: number;
  totalDistance: number;
  averageUptime: number;
}

export interface GeofenceArea {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // em metros
  type: 'pickup' | 'dropoff' | 'restricted' | 'maintenance';
  companyId: string;
  isActive: boolean;
}

export interface GeofenceEvent {
  id: string;
  vehicleId: string;
  geofenceId: string;
  type: 'enter' | 'exit';
  timestamp: Date;
  location: { lat: number; lng: number };
  companyId: string;
}

export class VehicleTrackingService {
  private locationListeners: Map<string, () => void> = new Map();

  /**
   * Busca veículos com filtros
   */
  async findVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
    try {
      const vehicleCollection = collection(db, 'vehicles');
      const constraints = [];

      if (filters.companyId) {
        constraints.push(where('companyId', '==', filters.companyId));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.routeId) {
        constraints.push(where('routeId', '==', filters.routeId));
      }

      if (filters.driverId) {
        constraints.push(where('driverId', '==', filters.driverId));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const vehicleQuery = constraints.length > 0 
        ? query(vehicleCollection, ...constraints)
        : vehicleCollection;

      const snapshot = await getDocs(vehicleQuery);
      const vehicles: Vehicle[] = [];

      for (const docSnapshot of snapshot.docs) {
        const vehicleData = docSnapshot.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const vehicleDate = vehicleData.createdAt?.toDate();
          if (filters.startDate && vehicleDate < filters.startDate) continue;
          if (filters.endDate && vehicleDate > filters.endDate) continue;
        }

        // Filtrar por termo de busca
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (!vehicleData.plate?.toLowerCase().includes(searchLower) &&
              !vehicleData.model?.toLowerCase().includes(searchLower) &&
              !vehicleData.driver?.toLowerCase().includes(searchLower)) {
            continue;
          }
        }

        // Buscar última localização
        const lastLocation = await this.getVehicleLastLocation(docSnapshot.id);

        vehicles.push({
          id: docSnapshot.id,
          plate: vehicleData.plate,
          model: vehicleData.model,
          driver: vehicleData.driver,
          status: vehicleData.status,
          capacity: vehicleData.capacity,
          currentPassengers: vehicleData.currentPassengers || 0,
          routeId: vehicleData.routeId,
          lastLocation,
          companyId: vehicleData.companyId,
          createdAt: vehicleData.createdAt?.toDate() || new Date(),
          updatedAt: vehicleData.updatedAt?.toDate() || new Date()
        });
      }

      return vehicles;
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
      return [];
    }
  }

  /**
   * Busca veículo por ID
   */
  async findVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const docRef = doc(db, 'vehicles', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const vehicleData = docSnap.data();
      const lastLocation = await this.getVehicleLastLocation(id);

      return {
        id: docSnap.id,
        plate: vehicleData.plate,
        model: vehicleData.model,
        driver: vehicleData.driver,
        status: vehicleData.status,
        capacity: vehicleData.capacity,
        currentPassengers: vehicleData.currentPassengers || 0,
        routeId: vehicleData.routeId,
        lastLocation,
        companyId: vehicleData.companyId,
        createdAt: vehicleData.createdAt?.toDate() || new Date(),
        updatedAt: vehicleData.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar veículo por ID:', error);
      return null;
    }
  }

  /**
   * Atualiza localização do veículo
   */
  async updateVehicleLocation(locationUpdate: LocationUpdate): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Criar registro de localização
      const locationRef = doc(collection(db, 'vehicleLocations'));
      batch.set(locationRef, {
        vehicleId: locationUpdate.vehicleId,
        position: new GeoPoint(locationUpdate.lat, locationUpdate.lng),
        lat: locationUpdate.lat,
        lng: locationUpdate.lng,
        speed: locationUpdate.speed,
        heading: locationUpdate.heading,
        accuracy: locationUpdate.accuracy,
        timestamp: locationUpdate.timestamp ? Timestamp.fromDate(locationUpdate.timestamp) : Timestamp.now(),
        companyId: locationUpdate.companyId,
        createdAt: Timestamp.now()
      });

      // Atualizar última localização no veículo
      const vehicleRef = doc(db, 'vehicles', locationUpdate.vehicleId);
      batch.update(vehicleRef, {
        lastLocationUpdate: Timestamp.now(),
        lastLat: locationUpdate.lat,
        lastLng: locationUpdate.lng,
        lastSpeed: locationUpdate.speed,
        lastHeading: locationUpdate.heading,
        updatedAt: Timestamp.now()
      });

      // Criar evento de tracking
      const eventRef = doc(collection(db, 'trackingEvents'));
      batch.set(eventRef, {
        vehicleId: locationUpdate.vehicleId,
        type: 'location_update',
        data: {
          lat: locationUpdate.lat,
          lng: locationUpdate.lng,
          speed: locationUpdate.speed,
          heading: locationUpdate.heading,
          accuracy: locationUpdate.accuracy
        },
        timestamp: Timestamp.now(),
        companyId: locationUpdate.companyId,
        createdAt: Timestamp.now()
      });

      await batch.commit();

      // Verificar geofences
      await this.checkGeofences(locationUpdate);
    } catch (error) {
      console.error('Erro ao atualizar localização do veículo:', error);
      throw error;
    }
  }

  /**
   * Busca última localização do veículo
   */
  async getVehicleLastLocation(vehicleId: string): Promise<VehicleLocation | undefined> {
    try {
      const locationQuery = query(
        collection(db, 'vehicleLocations'),
        where('vehicleId', '==', vehicleId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(locationQuery);
      
      if (snapshot.empty) {
        return undefined;
      }

      const locationDoc = snapshot.docs[0];
      const locationData = locationDoc.data();

      return {
        id: locationDoc.id,
        vehicleId: locationData.vehicleId,
        lat: locationData.lat,
        lng: locationData.lng,
        timestamp: locationData.timestamp?.toDate() || new Date(),
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        companyId: locationData.companyId
      };
    } catch (error) {
      console.error('Erro ao buscar última localização:', error);
      return undefined;
    }
  }

  /**
   * Busca histórico de localizações
   */
  async getVehicleLocationHistory(
    vehicleId: string, 
    startDate: Date, 
    endDate: Date,
    limitCount: number = 100
  ): Promise<VehicleLocation[]> {
    try {
      const locationQuery = query(
        collection(db, 'vehicleLocations'),
        where('vehicleId', '==', vehicleId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(locationQuery);
      const locations: VehicleLocation[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        locations.push({
          id: doc.id,
          vehicleId: data.vehicleId,
          lat: data.lat,
          lng: data.lng,
          timestamp: data.timestamp?.toDate() || new Date(),
          speed: data.speed,
          heading: data.heading,
          accuracy: data.accuracy,
          companyId: data.companyId
        });
      });

      return locations;
    } catch (error) {
      console.error('Erro ao buscar histórico de localizações:', error);
      return [];
    }
  }

  /**
   * Inicia monitoramento em tempo real de um veículo
   */
  startVehicleTracking(vehicleId: string, callback: (location: VehicleLocation) => void): () => void {
    try {
      const locationQuery = query(
        collection(db, 'vehicleLocations'),
        where('vehicleId', '==', vehicleId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );

      const unsubscribe = onSnapshot(locationQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const location: VehicleLocation = {
              id: change.doc.id,
              vehicleId: data.vehicleId,
              lat: data.lat,
              lng: data.lng,
              timestamp: data.timestamp?.toDate() || new Date(),
              speed: data.speed,
              heading: data.heading,
              accuracy: data.accuracy,
              companyId: data.companyId
            };
            callback(location);
          }
        });
      });

      this.locationListeners.set(vehicleId, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Erro ao iniciar tracking do veículo:', error);
      return () => {};
    }
  }

  /**
   * Para monitoramento de um veículo
   */
  stopVehicleTracking(vehicleId: string): void {
    const unsubscribe = this.locationListeners.get(vehicleId);
    if (unsubscribe) {
      unsubscribe();
      this.locationListeners.delete(vehicleId);
    }
  }

  /**
   * Para todos os monitoramentos
   */
  stopAllTracking(): void {
    this.locationListeners.forEach(unsubscribe => unsubscribe());
    this.locationListeners.clear();
  }

  /**
   * Atualiza status do veículo
   */
  async updateVehicleStatus(vehicleId: string, status: Vehicle['status'], companyId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Atualizar status do veículo
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      batch.update(vehicleRef, {
        status,
        updatedAt: Timestamp.now()
      });

      // Criar evento de tracking
      const eventRef = doc(collection(db, 'trackingEvents'));
      batch.set(eventRef, {
        vehicleId,
        type: 'status_change',
        data: { status },
        timestamp: Timestamp.now(),
        companyId,
        createdAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao atualizar status do veículo:', error);
      throw error;
    }
  }

  /**
   * Busca métricas do veículo
   */
  async getVehicleMetrics(vehicleId: string, startDate: Date, endDate: Date): Promise<VehicleMetrics> {
    try {
      const locations = await this.getVehicleLocationHistory(vehicleId, startDate, endDate, 1000);
      
      if (locations.length === 0) {
        return {
          totalDistance: 0,
          averageSpeed: 0,
          fuelConsumption: 0,
          uptime: 0,
          efficiency: 0,
          lastUpdated: new Date()
        };
      }

      // Calcular distância total
      let totalDistance = 0;
      let totalSpeed = 0;
      let validSpeedReadings = 0;

      for (let i = 1; i < locations.length; i++) {
        const prev = locations[i];
        const curr = locations[i - 1];
        
        // Calcular distância usando fórmula de Haversine
        const distance = this.calculateDistance(
          prev.lat, prev.lng,
          curr.lat, curr.lng
        );
        
        totalDistance += distance;
        
        if (curr.speed > 0) {
          totalSpeed += curr.speed;
          validSpeedReadings++;
        }
      }

      const averageSpeed = validSpeedReadings > 0 ? totalSpeed / validSpeedReadings : 0;
      
      // Calcular uptime (tempo entre primeira e última localização)
      const firstLocation = locations[locations.length - 1];
      const lastLocation = locations[0];
      const uptime = (lastLocation.timestamp.getTime() - firstLocation.timestamp.getTime()) / (1000 * 60 * 60); // em horas

      // Estimativa de consumo de combustível (baseado na distância e eficiência média)
      const fuelConsumption = totalDistance * 0.08; // 8L/100km estimado

      // Calcular eficiência (km/h por litro)
      const efficiency = fuelConsumption > 0 ? averageSpeed / fuelConsumption : 0;

      return {
        totalDistance,
        averageSpeed,
        fuelConsumption,
        uptime,
        efficiency,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Erro ao calcular métricas do veículo:', error);
      return {
        totalDistance: 0,
        averageSpeed: 0,
        fuelConsumption: 0,
        uptime: 0,
        efficiency: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Busca estatísticas de veículos
   */
  async getVehicleStatistics(companyId: string): Promise<VehicleStatistics> {
    try {
      const vehicleQuery = query(
        collection(db, 'vehicles'),
        where('companyId', '==', companyId)
      );

      const snapshot = await getDocs(vehicleQuery);
      
      let totalVehicles = 0;
      let activeVehicles = 0;
      let inactiveVehicles = 0;
      let maintenanceVehicles = 0;
      let emergencyVehicles = 0;
      let totalSpeed = 0;
      let totalDistance = 0;
      let totalUptime = 0;
      let validReadings = 0;

      for (const vehicleDoc of snapshot.docs) {
        const vehicle = vehicleDoc.data();
        totalVehicles++;

        switch (vehicle.status) {
          case 'active':
            activeVehicles++;
            break;
          case 'inactive':
            inactiveVehicles++;
            break;
          case 'maintenance':
            maintenanceVehicles++;
            break;
          case 'emergency':
            emergencyVehicles++;
            break;
        }

        // Calcular métricas dos últimos 7 dias
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        try {
          const metrics = await this.getVehicleMetrics(vehicleDoc.id, startDate, endDate);
          if (metrics.averageSpeed > 0) {
            totalSpeed += metrics.averageSpeed;
            totalDistance += metrics.totalDistance;
            totalUptime += metrics.uptime;
            validReadings++;
          }
        } catch (error) {
          // Ignorar erros individuais de métricas
        }
      }

      const averageSpeed = validReadings > 0 ? totalSpeed / validReadings : 0;
      const averageUptime = validReadings > 0 ? totalUptime / validReadings : 0;

      return {
        totalVehicles,
        activeVehicles,
        inactiveVehicles,
        maintenanceVehicles,
        emergencyVehicles,
        averageSpeed,
        totalDistance,
        averageUptime
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de veículos:', error);
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        inactiveVehicles: 0,
        maintenanceVehicles: 0,
        emergencyVehicles: 0,
        averageSpeed: 0,
        totalDistance: 0,
        averageUptime: 0
      };
    }
  }

  /**
   * Busca eventos de tracking
   */
  async getTrackingEvents(
    vehicleId: string, 
    startDate: Date, 
    endDate: Date,
    eventType?: TrackingEvent['type']
  ): Promise<TrackingEvent[]> {
    try {
      let eventQuery = query(
        collection(db, 'trackingEvents'),
        where('vehicleId', '==', vehicleId),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );

      if (eventType) {
        eventQuery = query(
          collection(db, 'trackingEvents'),
          where('vehicleId', '==', vehicleId),
          where('type', '==', eventType),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
      }

      const snapshot = await getDocs(eventQuery);
      const events: TrackingEvent[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        events.push({
          id: doc.id,
          vehicleId: data.vehicleId,
          type: data.type,
          data: data.data,
          timestamp: data.timestamp?.toDate() || new Date(),
          companyId: data.companyId
        });
      });

      return events;
    } catch (error) {
      console.error('Erro ao buscar eventos de tracking:', error);
      return [];
    }
  }

  /**
   * Cria alerta de emergência
   */
  async createEmergencyAlert(vehicleId: string, location: { lat: number; lng: number }, companyId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Atualizar status do veículo
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      batch.update(vehicleRef, {
        status: 'emergency',
        updatedAt: Timestamp.now()
      });

      // Criar evento de emergência
      const eventRef = doc(collection(db, 'trackingEvents'));
      batch.set(eventRef, {
        vehicleId,
        type: 'emergency',
        data: { location },
        timestamp: Timestamp.now(),
        companyId,
        createdAt: Timestamp.now()
      });

      // Criar alerta
      const alertRef = doc(collection(db, 'alerts'));
      batch.set(alertRef, {
        type: 'emergency',
        title: 'Emergência de Veículo',
        message: `Veículo ${vehicleId} acionou alerta de emergência`,
        vehicleId,
        location,
        severity: 'critical',
        status: 'unread',
        companyId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao criar alerta de emergência:', error);
      throw error;
    }
  }

  /**
   * Verifica geofences
   */
  private async checkGeofences(locationUpdate: LocationUpdate): Promise<void> {
    try {
      const geofencesQuery = query(
        collection(db, 'geofences'),
        where('companyId', '==', locationUpdate.companyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(geofencesQuery);
      
      for (const geofenceDoc of snapshot.docs) {
        const geofence = geofenceDoc.data() as GeofenceArea;
        
        const distance = this.calculateDistance(
          locationUpdate.lat, locationUpdate.lng,
          geofence.center.lat, geofence.center.lng
        );

        const isInside = distance <= geofence.radius;
        
        // Verificar se houve entrada ou saída da geofence
        // (implementação simplificada - em produção seria necessário manter estado anterior)
        if (isInside) {
          await this.createGeofenceEvent(
            locationUpdate.vehicleId,
            geofenceDoc.id,
            'enter',
            { lat: locationUpdate.lat, lng: locationUpdate.lng },
            locationUpdate.companyId
          );
        }
      }
    } catch (error) {
      console.error('Erro ao verificar geofences:', error);
    }
  }

  /**
   * Cria evento de geofence
   */
  private async createGeofenceEvent(
    vehicleId: string,
    geofenceId: string,
    type: 'enter' | 'exit',
    location: { lat: number; lng: number },
    companyId: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'geofenceEvents'), {
        vehicleId,
        geofenceId,
        type,
        location,
        timestamp: Timestamp.now(),
        companyId,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao criar evento de geofence:', error);
    }
  }

  /**
   * Calcula distância entre dois pontos (fórmula de Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Converte graus para radianos
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const vehicleTrackingService = new VehicleTrackingService();
export default vehicleTrackingService;