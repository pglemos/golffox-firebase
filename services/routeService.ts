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
  QueryDocumentSnapshot,
  DocumentData,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interfaces para compatibilidade com o código existente
export interface Passenger {
  id: string;
  name: string;
  email: string;
  address: string;
  status: 'Ativo' | 'Inativo';
  companyId: string;
}

export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime?: string;
  status: 'No Horário' | 'Atrasado' | 'Com Problema';
  driverId?: string;
  vehicleId?: string;
  passengers: Passenger[];
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteHistory {
  id: string;
  routeId: string;
  driverId: string;
  startedAt: Date;
  completedAt?: Date;
  totalDistance?: number;
  totalTime?: number;
  fuelConsumption?: number;
  notes?: string;
  companyId: string;
}

export interface RoutePassenger {
  id: string;
  routeId: string;
  passengerId: string;
  pickupTime?: string;
  dropoffTime?: string;
  status: 'pending' | 'picked_up' | 'dropped_off' | 'no_show';
  pickupLocation?: string;
  dropoffLocation?: string;
  notes?: string;
  companyId: string;
}

export interface RouteOptimizationResult {
  optimizedRoute: Route;
  estimatedTime: number;
  estimatedDistance: number;
  estimatedFuelConsumption: number;
  waypoints: Array<{
    location: string;
    coordinates: { lat: number; lng: number };
    type: 'pickup' | 'dropoff';
    passengerId?: string;
    estimatedTime: string;
  }>;
  savings: {
    timeSaved: number;
    distanceSaved: number;
    fuelSaved: number;
    costSaved: number;
  };
}

export interface RouteFilters {
  companyId?: string;
  driverId?: string;
  vehicleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export interface RouteStatistics {
  totalRoutes: number;
  activeRoutes: number;
  completedRoutes: number;
  delayedRoutes: number;
  averageCompletionTime: number;
  totalDistance: number;
  totalPassengers: number;
  onTimePerformance: number;
}

export interface CreateRouteData {
  name: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  endTime?: string;
  driverId?: string;
  vehicleId?: string;
  passengerIds?: string[];
  companyId: string;
  estimatedDuration?: number;
  estimatedDistance?: number;
  notes?: string;
}

export interface UpdateRouteData {
  name?: string;
  startLocation?: string;
  endLocation?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  driverId?: string;
  vehicleId?: string;
  notes?: string;
}

export class RouteService {
  /**
   * Busca todas as rotas com filtros
   */
  async findRoutes(filters: RouteFilters = {}): Promise<Route[]> {
    try {
      const routeCollection = collection(db, 'routes');
      const constraints = [];

      if (filters.companyId) {
        constraints.push(where('companyId', '==', filters.companyId));
      }

      if (filters.driverId) {
        constraints.push(where('driverId', '==', filters.driverId));
      }

      if (filters.vehicleId) {
        constraints.push(where('vehicleId', '==', filters.vehicleId));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const routeQuery = constraints.length > 0 
        ? query(routeCollection, ...constraints)
        : routeCollection;

      const snapshot = await getDocs(routeQuery);
      const routes: Route[] = [];

      for (const docSnapshot of snapshot.docs) {
        const routeData = docSnapshot.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const routeDate = routeData.createdAt?.toDate();
          if (filters.startDate && routeDate < filters.startDate) continue;
          if (filters.endDate && routeDate > filters.endDate) continue;
        }

        // Filtrar por termo de busca
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          if (!routeData.name?.toLowerCase().includes(searchLower) &&
              !routeData.startLocation?.toLowerCase().includes(searchLower) &&
              !routeData.endLocation?.toLowerCase().includes(searchLower)) {
            continue;
          }
        }

        // Buscar passageiros da rota
        const passengers = await this.getRoutePassengers(docSnapshot.id);

        routes.push({
          id: docSnapshot.id,
          name: routeData.name,
          startLocation: routeData.startLocation,
          endLocation: routeData.endLocation,
          startTime: routeData.startTime,
          endTime: routeData.endTime,
          status: routeData.status || 'No Horário',
          driverId: routeData.driverId,
          vehicleId: routeData.vehicleId,
          passengers,
          companyId: routeData.companyId,
          createdAt: routeData.createdAt?.toDate() || new Date(),
          updatedAt: routeData.updatedAt?.toDate() || new Date()
        });
      }

      return routes;
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      return [];
    }
  }

  /**
   * Busca uma rota por ID
   */
  async findRouteById(id: string): Promise<Route | null> {
    try {
      const docRef = doc(db, 'routes', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const routeData = docSnap.data();
      const passengers = await this.getRoutePassengers(id);

      return {
        id: docSnap.id,
        name: routeData.name,
        startLocation: routeData.startLocation,
        endLocation: routeData.endLocation,
        startTime: routeData.startTime,
        endTime: routeData.endTime,
        status: routeData.status || 'No Horário',
        driverId: routeData.driverId,
        vehicleId: routeData.vehicleId,
        passengers,
        companyId: routeData.companyId,
        createdAt: routeData.createdAt?.toDate() || new Date(),
        updatedAt: routeData.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Erro ao buscar rota por ID:', error);
      return null;
    }
  }

  /**
   * Cria uma nova rota
   */
  async createRoute(data: CreateRouteData): Promise<string> {
    try {
      const routeData = {
        name: data.name,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'No Horário',
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        companyId: data.companyId,
        estimatedDuration: data.estimatedDuration,
        estimatedDistance: data.estimatedDistance,
        notes: data.notes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'routes'), routeData);

      // Adicionar passageiros se especificados
      if (data.passengerIds && data.passengerIds.length > 0) {
        await this.addPassengersToRoute(docRef.id, data.passengerIds, data.companyId);
      }

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma rota
   */
  async updateRoute(id: string, data: UpdateRouteData): Promise<void> {
    try {
      const docRef = doc(db, 'routes', id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
      throw error;
    }
  }

  /**
   * Exclui uma rota
   */
  async deleteRoute(id: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Excluir rota
      const routeRef = doc(db, 'routes', id);
      batch.delete(routeRef);

      // Excluir passageiros da rota
      const routePassengersQuery = query(
        collection(db, 'routePassengers'),
        where('routeId', '==', id)
      );
      const routePassengersSnapshot = await getDocs(routePassengersQuery);
      
      routePassengersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Excluir histórico da rota
      const routeHistoryQuery = query(
        collection(db, 'routeHistory'),
        where('routeId', '==', id)
      );
      const routeHistorySnapshot = await getDocs(routeHistoryQuery);
      
      routeHistorySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao excluir rota:', error);
      throw error;
    }
  }

  /**
   * Busca passageiros de uma rota
   */
  async getRoutePassengers(routeId: string): Promise<Passenger[]> {
    try {
      const routePassengersQuery = query(
        collection(db, 'routePassengers'),
        where('routeId', '==', routeId)
      );
      const routePassengersSnapshot = await getDocs(routePassengersQuery);
      
      const passengers: Passenger[] = [];

      for (const routePassengerDoc of routePassengersSnapshot.docs) {
        const routePassengerData = routePassengerDoc.data();
        
        // Buscar dados do passageiro
        const passengerDoc = await getDoc(doc(db, 'passengers', routePassengerData.passengerId));
        
        if (passengerDoc.exists()) {
          const passengerData = passengerDoc.data();
          passengers.push({
            id: passengerDoc.id,
            name: passengerData.name,
            email: passengerData.email,
            address: passengerData.address,
            status: passengerData.status === 'active' ? 'Ativo' : 'Inativo',
            companyId: passengerData.companyId
          });
        }
      }

      return passengers;
    } catch (error) {
      console.error('Erro ao buscar passageiros da rota:', error);
      return [];
    }
  }

  /**
   * Adiciona passageiros a uma rota
   */
  async addPassengersToRoute(routeId: string, passengerIds: string[], companyId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const passengerId of passengerIds) {
        const routePassengerRef = doc(collection(db, 'routePassengers'));
        batch.set(routePassengerRef, {
          routeId,
          passengerId,
          status: 'pending',
          companyId,
          createdAt: Timestamp.now()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Erro ao adicionar passageiros à rota:', error);
      throw error;
    }
  }

  /**
   * Remove passageiros de uma rota
   */
  async removePassengersFromRoute(routeId: string, passengerIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const passengerId of passengerIds) {
        const routePassengersQuery = query(
          collection(db, 'routePassengers'),
          where('routeId', '==', routeId),
          where('passengerId', '==', passengerId)
        );
        
        const snapshot = await getDocs(routePassengersQuery);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Erro ao remover passageiros da rota:', error);
      throw error;
    }
  }

  /**
   * Inicia uma rota (cria entrada no histórico)
   */
  async startRoute(routeId: string, driverId: string, companyId: string): Promise<string> {
    try {
      const historyData = {
        routeId,
        driverId,
        companyId,
        startedAt: Timestamp.now(),
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'routeHistory'), historyData);

      // Atualizar status da rota
      await this.updateRoute(routeId, { status: 'Em Andamento' });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao iniciar rota:', error);
      throw error;
    }
  }

  /**
   * Finaliza uma rota
   */
  async completeRoute(
    routeId: string, 
    historyId: string, 
    data: {
      totalDistance?: number;
      totalTime?: number;
      fuelConsumption?: number;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Atualizar histórico da rota
      const historyRef = doc(db, 'routeHistory', historyId);
      batch.update(historyRef, {
        completedAt: Timestamp.now(),
        totalDistance: data.totalDistance,
        totalTime: data.totalTime,
        fuelConsumption: data.fuelConsumption,
        notes: data.notes,
        updatedAt: Timestamp.now()
      });

      // Atualizar status da rota
      const routeRef = doc(db, 'routes', routeId);
      batch.update(routeRef, {
        status: 'Concluída',
        endTime: new Date().toISOString(),
        updatedAt: Timestamp.now()
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao finalizar rota:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de rotas
   */
  async getRouteHistory(filters: RouteFilters = {}): Promise<RouteHistory[]> {
    try {
      const historyCollection = collection(db, 'routeHistory');
      const constraints = [];

      if (filters.companyId) {
        constraints.push(where('companyId', '==', filters.companyId));
      }

      if (filters.driverId) {
        constraints.push(where('driverId', '==', filters.driverId));
      }

      constraints.push(orderBy('startedAt', 'desc'));

      const historyQuery = constraints.length > 0 
        ? query(historyCollection, ...constraints)
        : historyCollection;

      const snapshot = await getDocs(historyQuery);
      const history: RouteHistory[] = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Filtrar por data se especificado
        if (filters.startDate || filters.endDate) {
          const startDate = data.startedAt?.toDate();
          if (filters.startDate && startDate < filters.startDate) return;
          if (filters.endDate && startDate > filters.endDate) return;
        }

        history.push({
          id: doc.id,
          routeId: data.routeId,
          driverId: data.driverId,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
          totalDistance: data.totalDistance,
          totalTime: data.totalTime,
          fuelConsumption: data.fuelConsumption,
          notes: data.notes,
          companyId: data.companyId
        });
      });

      return history;
    } catch (error) {
      console.error('Erro ao buscar histórico de rotas:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas de rotas
   */
  async getRouteStatistics(companyId: string, startDate?: Date, endDate?: Date): Promise<RouteStatistics> {
    try {
      let routeQuery = query(
        collection(db, 'routes'),
        where('companyId', '==', companyId)
      );

      const routeSnapshot = await getDocs(routeQuery);
      
      let totalRoutes = 0;
      let activeRoutes = 0;
      let completedRoutes = 0;
      let delayedRoutes = 0;
      let totalDistance = 0;
      let totalPassengers = 0;
      let onTimeRoutes = 0;

      for (const routeDoc of routeSnapshot.docs) {
        const route = routeDoc.data();
        
        // Filtrar por data se especificado
        if (startDate || endDate) {
          const routeDate = route.createdAt?.toDate();
          if (startDate && routeDate < startDate) continue;
          if (endDate && routeDate > endDate) continue;
        }

        totalRoutes++;

        if (route.status === 'Em Andamento') activeRoutes++;
        if (route.status === 'Concluída') completedRoutes++;
        if (route.status === 'Atrasado') delayedRoutes++;
        if (route.status !== 'Atrasado' && route.status !== 'Com Problema') onTimeRoutes++;

        if (route.estimatedDistance) totalDistance += route.estimatedDistance;

        // Contar passageiros
        const passengers = await this.getRoutePassengers(routeDoc.id);
        totalPassengers += passengers.length;
      }

      // Buscar tempo médio de conclusão do histórico
      const historyQuery = query(
        collection(db, 'routeHistory'),
        where('companyId', '==', companyId),
        where('completedAt', '!=', null)
      );

      const historySnapshot = await getDocs(historyQuery);
      let totalCompletionTime = 0;
      let completedHistoryCount = 0;

      historySnapshot.docs.forEach(doc => {
        const history = doc.data();
        
        if (history.startedAt && history.completedAt) {
          // Filtrar por data se especificado
          if (startDate || endDate) {
            const historyDate = history.startedAt?.toDate();
            if (startDate && historyDate < startDate) return;
            if (endDate && historyDate > endDate) return;
          }

          const completionTime = history.completedAt.toDate().getTime() - history.startedAt.toDate().getTime();
          totalCompletionTime += completionTime / (1000 * 60); // Converter para minutos
          completedHistoryCount++;
        }
      });

      const averageCompletionTime = completedHistoryCount > 0 ? totalCompletionTime / completedHistoryCount : 0;
      const onTimePerformance = totalRoutes > 0 ? (onTimeRoutes / totalRoutes) * 100 : 0;

      return {
        totalRoutes,
        activeRoutes,
        completedRoutes,
        delayedRoutes,
        averageCompletionTime,
        totalDistance,
        totalPassengers,
        onTimePerformance
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de rotas:', error);
      return {
        totalRoutes: 0,
        activeRoutes: 0,
        completedRoutes: 0,
        delayedRoutes: 0,
        averageCompletionTime: 0,
        totalDistance: 0,
        totalPassengers: 0,
        onTimePerformance: 0
      };
    }
  }

  /**
   * Otimiza uma rota (simulação)
   */
  async optimizeRoute(routeId: string): Promise<RouteOptimizationResult> {
    try {
      const route = await this.findRouteById(routeId);
      
      if (!route) {
        throw new Error('Rota não encontrada');
      }

      // Simulação de otimização
      const estimatedTime = 45; // minutos
      const estimatedDistance = 25; // km
      const estimatedFuelConsumption = 3; // litros

      const waypoints = route.passengers.map((passenger, index) => ({
        location: passenger.address,
        coordinates: { lat: -23.5505 + (index * 0.01), lng: -46.6333 + (index * 0.01) },
        type: 'pickup' as const,
        passengerId: passenger.id,
        estimatedTime: new Date(Date.now() + (index * 10 * 60 * 1000)).toISOString()
      }));

      return {
        optimizedRoute: route,
        estimatedTime,
        estimatedDistance,
        estimatedFuelConsumption,
        waypoints,
        savings: {
          timeSaved: 15, // minutos
          distanceSaved: 8, // km
          fuelSaved: 1.2, // litros
          costSaved: 6.60 // reais
        }
      };
    } catch (error) {
      console.error('Erro ao otimizar rota:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de passageiro na rota
   */
  async updatePassengerStatus(
    routeId: string, 
    passengerId: string, 
    status: 'pending' | 'picked_up' | 'dropped_off' | 'no_show',
    location?: string,
    notes?: string
  ): Promise<void> {
    try {
      const routePassengersQuery = query(
        collection(db, 'routePassengers'),
        where('routeId', '==', routeId),
        where('passengerId', '==', passengerId)
      );
      
      const snapshot = await getDocs(routePassengersQuery);
      
      if (snapshot.empty) {
        throw new Error('Passageiro não encontrado na rota');
      }

      const routePassengerDoc = snapshot.docs[0];
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'picked_up') {
        updateData.pickupTime = new Date().toISOString();
        updateData.pickupLocation = location;
      } else if (status === 'dropped_off') {
        updateData.dropoffTime = new Date().toISOString();
        updateData.dropoffLocation = location;
      }

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(routePassengerDoc.ref, updateData);
    } catch (error) {
      console.error('Erro ao atualizar status do passageiro:', error);
      throw error;
    }
  }

  /**
   * Duplica uma rota
   */
  async duplicateRoute(routeId: string, newName: string): Promise<string> {
    try {
      const originalRoute = await this.findRouteById(routeId);
      
      if (!originalRoute) {
        throw new Error('Rota original não encontrada');
      }

      const passengerIds = originalRoute.passengers.map(p => p.id);

      const newRouteData: CreateRouteData = {
        name: newName,
        startLocation: originalRoute.startLocation,
        endLocation: originalRoute.endLocation,
        startTime: originalRoute.startTime,
        endTime: originalRoute.endTime,
        driverId: originalRoute.driverId,
        vehicleId: originalRoute.vehicleId,
        passengerIds,
        companyId: originalRoute.companyId
      };

      return await this.createRoute(newRouteData);
    } catch (error) {
      console.error('Erro ao duplicar rota:', error);
      throw error;
    }
  }
}

export const routeService = new RouteService();
export default routeService;