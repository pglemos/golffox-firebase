import { BaseCrudService, CrudResponse, CrudListResponse } from './baseCrudService';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos específicos para rotas
export interface Route {
  id: string;
  name: string;
  description?: string;
  status: 'Ativa' | 'Inativa' | 'Em andamento' | 'Concluída';
  routeType: 'ida' | 'volta' | 'circular';
  daysOfWeek: string[];
  pickupTime: string;
  dropoffTime?: string;
  estimatedDuration: number; // em minutos
  distance: number; // em km
  driverId?: string;
  vehicleId?: string;
  companyId: string;
  maxPassengers: number;
  currentPassengers: number;
  waypoints: RouteWaypoint[];
  schedule: RouteSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteInsert extends Omit<Route, 'id' | 'createdAt' | 'updatedAt'> {}

export interface RouteUpdate extends Partial<Omit<Route, 'id' | 'createdAt'>> {}

export interface RouteWaypoint {
  id: string;
  order: number;
  type: 'pickup' | 'dropoff' | 'stop';
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  estimatedTime?: string;
  passengers?: string[]; // IDs dos passageiros
}

export interface RouteSchedule {
  dayOfWeek: number; // 0-6 (domingo-sábado)
  pickupTime: string;
  dropoffTime?: string;
  isActive: boolean;
}

export interface RouteWithDetails extends Route {
  driver?: {
    id: string;
    name: string;
    cpf: string;
    status: string;
  };
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    capacity: number;
  };
  passengers?: Array<{
    id: string;
    name: string;
    cpf: string;
    pickupOrder: number;
    pickupLocation: string;
    dropoffLocation: string;
  }>;
  company?: {
    id: string;
    name: string;
  };
  stats?: {
    totalPassengers: number;
    completedTrips: number;
    averageRating: number;
    onTimePercentage: number;
  };
}

export interface RouteFilters {
  name?: string;
  status?: 'Ativa' | 'Inativa' | 'Em andamento' | 'Concluída';
  driverId?: string;
  vehicleId?: string;
  companyId?: string;
  pickupTime?: string;
  routeType?: 'ida' | 'volta' | 'circular';
  daysOfWeek?: string[];
}

export interface RouteTrip {
  id: string;
  routeId: string;
  driverId: string;
  vehicleId: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  passengers: RouteTripPassenger[];
  actualWaypoints: RouteWaypoint[];
  distance?: number;
  duration?: number;
  rating?: number;
  notes?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteTripPassenger {
  passengerId: string;
  pickupTime?: Date;
  dropoffTime?: Date;
  status: 'aguardando' | 'embarcado' | 'desembarcado' | 'ausente';
  pickupLocation: RouteWaypoint;
  dropoffLocation: RouteWaypoint;
}

export class RoutesService extends BaseCrudService<Route> {
  constructor() {
    super('routes');
  }

  /**
   * Busca rotas com detalhes completos
   */
  async findAllWithDetails(): Promise<CrudListResponse<RouteWithDetails>> {
    try {
      const routesResult = await this.list();
      
      if (routesResult.error) {
        return routesResult as CrudListResponse<RouteWithDetails>;
      }

      const routesWithDetails: RouteWithDetails[] = [];

      for (const route of routesResult.data) {
        const details = await this.getRouteDetails(route.id);
        
        routesWithDetails.push({
          ...route,
          ...details
        });
      }

      return {
        data: routesWithDetails,
        error: null,
        count: routesWithDetails.length,
        totalCount: routesWithDetails.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar rotas com detalhes:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas com detalhes'
      };
    }
  }

  /**
   * Busca detalhes de uma rota específica
   */
  async getRouteDetails(routeId: string): Promise<{
    driver?: { id: string; name: string; cpf: string; status: string };
    vehicle?: { id: string; plate: string; model: string; capacity: number };
    passengers?: Array<{ id: string; name: string; cpf: string; pickupOrder: number; pickupLocation: string; dropoffLocation: string }>;
    company?: { id: string; name: string };
    stats?: { totalPassengers: number; completedTrips: number; averageRating: number; onTimePercentage: number };
  }> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {};
      }

      const details: any = {};

      // Buscar motorista se associado
      if (route.data.driverId) {
        const driverDoc = await getDoc(doc(db, 'drivers', route.data.driverId));
        if (driverDoc.exists()) {
          const driverData = driverDoc.data();
          details.driver = {
            id: driverDoc.id,
            name: driverData.name,
            cpf: driverData.cpf,
            status: driverData.status
          };
        }
      }

      // Buscar veículo se associado
      if (route.data.vehicleId) {
        const vehicleDoc = await getDoc(doc(db, 'vehicles', route.data.vehicleId));
        if (vehicleDoc.exists()) {
          const vehicleData = vehicleDoc.data();
          details.vehicle = {
            id: vehicleDoc.id,
            plate: vehicleData.plate,
            model: vehicleData.model,
            capacity: vehicleData.capacity
          };
        }
      }

      // Buscar empresa
      const companyDoc = await getDoc(doc(db, 'companies', route.data.companyId));
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        details.company = {
          id: companyDoc.id,
          name: companyData.name
        };
      }

      // Buscar passageiros da rota
      const passengers = await this.getRoutePassengers(routeId);
      if (passengers.data) {
        details.passengers = passengers.data;
      }

      // Buscar estatísticas da rota
      const stats = await this.getRouteStats(routeId);
      if (stats.data) {
        details.stats = stats.data;
      }

      return details;
    } catch (error) {
      console.error('Erro ao buscar detalhes da rota:', error);
      return {};
    }
  }

  /**
   * Busca rotas por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<Route>> {
    try {
      return await this.findWhere('companyId', '==', companyId);
    } catch (error: any) {
      console.error('Erro ao buscar rotas por empresa:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas por empresa'
      };
    }
  }

  /**
   * Busca rotas ativas
   */
  async findActiveRoutes(companyId?: string): Promise<CrudListResponse<Route>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'routes'),
          where('status', '==', 'Ativa'),
          where('companyId', '==', companyId)
        );
        
        const snapshot = await getDocs(q);
        const routes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Route[];

        return {
          data: routes,
          error: null,
          count: routes.length,
          totalCount: routes.length
        };
      } else {
        return await this.findWhere('status', '==', 'Ativa');
      }
    } catch (error: any) {
      console.error('Erro ao buscar rotas ativas:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas ativas'
      };
    }
  }

  /**
   * Busca rotas por motorista
   */
  async findByDriver(driverId: string): Promise<CrudListResponse<Route>> {
    try {
      return await this.findWhere('driverId', '==', driverId);
    } catch (error: any) {
      console.error('Erro ao buscar rotas por motorista:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas por motorista'
      };
    }
  }

  /**
   * Busca rotas por veículo
   */
  async findByVehicle(vehicleId: string): Promise<CrudListResponse<Route>> {
    try {
      return await this.findWhere('vehicleId', '==', vehicleId);
    } catch (error: any) {
      console.error('Erro ao buscar rotas por veículo:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas por veículo'
      };
    }
  }

  /**
   * Associa motorista a uma rota
   */
  async assignDriver(routeId: string, driverId: string): Promise<CrudResponse<Route>> {
    try {
      // Verificar se o motorista existe e está disponível
      const driverDoc = await getDoc(doc(db, 'drivers', driverId));
      if (!driverDoc.exists()) {
        return {
          data: null,
          error: 'Motorista não encontrado'
        };
      }

      const driverData = driverDoc.data();
      if (driverData.status !== 'Ativo') {
        return {
          data: null,
          error: 'Motorista não está ativo'
        };
      }

      // Atualizar rota
      const routeResult = await this.update(routeId, { driverId });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar motorista
      await updateDoc(doc(db, 'drivers', driverId), {
        currentRouteId: routeId,
        updatedAt: serverTimestamp()
      });

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao associar motorista à rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao associar motorista'
      };
    }
  }

  /**
   * Remove associação de motorista da rota
   */
  async unassignDriver(routeId: string): Promise<CrudResponse<Route>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      const driverId = route.data.driverId;

      // Atualizar rota
      const routeResult = await this.update(routeId, { driverId: null });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar motorista se existir
      if (driverId) {
        await updateDoc(doc(db, 'drivers', driverId), {
          currentRouteId: null,
          updatedAt: serverTimestamp()
        });
      }

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao remover associação de motorista:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover associação de motorista'
      };
    }
  }

  /**
   * Associa veículo a uma rota
   */
  async assignVehicle(routeId: string, vehicleId: string): Promise<CrudResponse<Route>> {
    try {
      // Verificar se o veículo existe e está disponível
      const vehicleDoc = await getDoc(doc(db, 'vehicles', vehicleId));
      if (!vehicleDoc.exists()) {
        return {
          data: null,
          error: 'Veículo não encontrado'
        };
      }

      const vehicleData = vehicleDoc.data();
      if (vehicleData.status !== 'Disponível') {
        return {
          data: null,
          error: 'Veículo não está disponível'
        };
      }

      // Atualizar rota
      const routeResult = await this.update(routeId, { vehicleId });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar veículo
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        currentRouteId: routeId,
        status: 'Em uso',
        updatedAt: serverTimestamp()
      });

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao associar veículo à rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao associar veículo'
      };
    }
  }

  /**
   * Remove associação de veículo da rota
   */
  async unassignVehicle(routeId: string): Promise<CrudResponse<Route>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      const vehicleId = route.data.vehicleId;

      // Atualizar rota
      const routeResult = await this.update(routeId, { vehicleId: null });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar veículo se existir
      if (vehicleId) {
        await updateDoc(doc(db, 'vehicles', vehicleId), {
          currentRouteId: null,
          status: 'Disponível',
          updatedAt: serverTimestamp()
        });
      }

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao remover associação de veículo:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover associação de veículo'
      };
    }
  }

  /**
   * Adiciona passageiro à rota
   */
  async addPassenger(routeId: string, passengerId: string, pickupWaypointId: string, dropoffWaypointId: string): Promise<CrudResponse<Route>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      if (route.data.currentPassengers >= route.data.maxPassengers) {
        return {
          data: null,
          error: 'Rota já está com capacidade máxima'
        };
      }

      // Verificar se o passageiro existe
      const passengerDoc = await getDoc(doc(db, 'passengers', passengerId));
      if (!passengerDoc.exists()) {
        return {
          data: null,
          error: 'Passageiro não encontrado'
        };
      }

      // Atualizar waypoints com o passageiro
      const updatedWaypoints = route.data.waypoints.map(waypoint => {
        if (waypoint.id === pickupWaypointId || waypoint.id === dropoffWaypointId) {
          return {
            ...waypoint,
            passengers: [...(waypoint.passengers || []), passengerId]
          };
        }
        return waypoint;
      });

      // Atualizar rota
      const routeResult = await this.update(routeId, { 
        waypoints: updatedWaypoints,
        currentPassengers: route.data.currentPassengers + 1
      });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar passageiro
      await updateDoc(doc(db, 'passengers', passengerId), {
        routeId: routeId,
        updatedAt: serverTimestamp()
      });

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao adicionar passageiro à rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao adicionar passageiro'
      };
    }
  }

  /**
   * Remove passageiro da rota
   */
  async removePassenger(routeId: string, passengerId: string): Promise<CrudResponse<Route>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      // Remover passageiro dos waypoints
      const updatedWaypoints = route.data.waypoints.map(waypoint => ({
        ...waypoint,
        passengers: (waypoint.passengers || []).filter(id => id !== passengerId)
      }));

      // Atualizar rota
      const routeResult = await this.update(routeId, { 
        waypoints: updatedWaypoints,
        currentPassengers: Math.max(0, route.data.currentPassengers - 1)
      });
      
      if (routeResult.error) {
        return routeResult;
      }

      // Atualizar passageiro
      await updateDoc(doc(db, 'passengers', passengerId), {
        routeId: null,
        updatedAt: serverTimestamp()
      });

      return routeResult;
    } catch (error: any) {
      console.error('Erro ao remover passageiro da rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover passageiro'
      };
    }
  }

  /**
   * Busca passageiros de uma rota
   */
  async getRoutePassengers(routeId: string): Promise<CrudResponse<Array<{ id: string; name: string; cpf: string; pickupOrder: number; pickupLocation: string; dropoffLocation: string }>>> {
    try {
      const q = query(
        collection(db, 'passengers'),
        where('routeId', '==', routeId)
      );

      const snapshot = await getDocs(q);
      const passengers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          cpf: data.cpf,
          pickupOrder: data.pickupOrder || 0,
          pickupLocation: data.pickupLocation || '',
          dropoffLocation: data.dropoffLocation || ''
        };
      });

      return {
        data: passengers,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar passageiros da rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar passageiros'
      };
    }
  }

  /**
   * Busca estatísticas de uma rota
   */
  async getRouteStats(routeId: string): Promise<CrudResponse<{ totalPassengers: number; completedTrips: number; averageRating: number; onTimePercentage: number }>> {
    try {
      // Buscar viagens da rota
      const tripsQuery = query(
        collection(db, 'route_trips'),
        where('routeId', '==', routeId)
      );

      const tripsSnapshot = await getDocs(tripsQuery);
      const trips = tripsSnapshot.docs.map(doc => doc.data());

      const completedTrips = trips.filter(trip => trip.status === 'concluida').length;
      const totalPassengers = trips.reduce((sum, trip) => sum + (trip.passengers?.length || 0), 0);
      
      const ratingsSum = trips
        .filter(trip => trip.rating)
        .reduce((sum, trip) => sum + trip.rating, 0);
      const ratingsCount = trips.filter(trip => trip.rating).length;
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

      // Calcular pontualidade (simplificado)
      const onTimeTrips = trips.filter(trip => {
        // Lógica simplificada - considerar como pontual se completou
        return trip.status === 'concluida';
      }).length;
      const onTimePercentage = completedTrips > 0 ? (onTimeTrips / completedTrips) * 100 : 0;

      return {
        data: {
          totalPassengers,
          completedTrips,
          averageRating,
          onTimePercentage
        },
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas da rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar estatísticas'
      };
    }
  }

  /**
   * Inicia uma viagem da rota
   */
  async startTrip(routeId: string): Promise<CrudResponse<RouteTrip>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      if (!route.data.driverId || !route.data.vehicleId) {
        return {
          data: null,
          error: 'Rota deve ter motorista e veículo associados'
        };
      }

      // Buscar passageiros da rota
      const passengersResult = await this.getRoutePassengers(routeId);
      const passengers: RouteTripPassenger[] = (passengersResult.data || []).map(passenger => ({
        passengerId: passenger.id,
        status: 'aguardando',
        pickupLocation: route.data!.waypoints.find(w => w.passengers?.includes(passenger.id) && w.type === 'pickup')!,
        dropoffLocation: route.data!.waypoints.find(w => w.passengers?.includes(passenger.id) && w.type === 'dropoff')!
      }));

      const tripData: Omit<RouteTrip, 'id'> = {
        routeId,
        driverId: route.data.driverId,
        vehicleId: route.data.vehicleId,
        date: new Date(),
        startTime: new Date(),
        status: 'em_andamento',
        passengers,
        actualWaypoints: route.data.waypoints,
        companyId: route.data.companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Salvar viagem
      const tripRef = doc(collection(db, 'route_trips'));
      await updateDoc(tripRef, {
        ...tripData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Atualizar status da rota
      await this.update(routeId, { status: 'Em andamento' });

      return {
        data: { id: tripRef.id, ...tripData } as RouteTrip,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao iniciar viagem:', error);
      return {
        data: null,
        error: error.message || 'Erro ao iniciar viagem'
      };
    }
  }

  /**
   * Finaliza uma viagem da rota
   */
  async endTrip(tripId: string): Promise<CrudResponse<RouteTrip>> {
    try {
      const tripDoc = await getDoc(doc(db, 'route_trips', tripId));
      
      if (!tripDoc.exists()) {
        return {
          data: null,
          error: 'Viagem não encontrada'
        };
      }

      const tripData = tripDoc.data() as RouteTrip;

      // Atualizar viagem
      await updateDoc(doc(db, 'route_trips', tripId), {
        endTime: serverTimestamp(),
        status: 'concluida',
        updatedAt: serverTimestamp()
      });

      // Atualizar status da rota
      await this.update(tripData.routeId, { status: 'Ativa' });

      return {
        data: { ...tripData, endTime: new Date(), status: 'concluida' },
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao finalizar viagem:', error);
      return {
        data: null,
        error: error.message || 'Erro ao finalizar viagem'
      };
    }
  }

  /**
   * Busca rotas com filtros avançados
   */
  async findWithFilters(filters: RouteFilters): Promise<CrudListResponse<Route>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      const allRoutes = await this.list();
      
      if (allRoutes.error) {
        return allRoutes;
      }

      const filteredData = allRoutes.data.filter(route => {
        if (filters.name && !route.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        if (filters.status && route.status !== filters.status) {
          return false;
        }
        if (filters.driverId && route.driverId !== filters.driverId) {
          return false;
        }
        if (filters.vehicleId && route.vehicleId !== filters.vehicleId) {
          return false;
        }
        if (filters.companyId && route.companyId !== filters.companyId) {
          return false;
        }
        if (filters.routeType && route.routeType !== filters.routeType) {
          return false;
        }
        if (filters.pickupTime && route.pickupTime !== filters.pickupTime) {
          return false;
        }
        if (filters.daysOfWeek && filters.daysOfWeek.length > 0) {
          const hasCommonDay = filters.daysOfWeek.some(day => route.daysOfWeek.includes(day));
          if (!hasCommonDay) {
            return false;
          }
        }
        return true;
      });

      return {
        data: filteredData,
        error: null,
        count: filteredData.length,
        totalCount: filteredData.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar rotas com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar rotas'
      };
    }
  }

  /**
   * Atualiza status da rota
   */
  async updateStatus(routeId: string, status: 'Ativa' | 'Inativa' | 'Em andamento' | 'Concluída'): Promise<CrudResponse<Route>> {
    try {
      return await this.update(routeId, { status });
    } catch (error: any) {
      console.error('Erro ao atualizar status da rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Duplica uma rota
   */
  async duplicateRoute(routeId: string, newName: string): Promise<CrudResponse<Route>> {
    try {
      const route = await this.getById(routeId);
      
      if (route.error || !route.data) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      const duplicatedRoute: Omit<Route, 'id'> = {
        ...route.data,
        name: newName,
        status: 'Inativa',
        driverId: undefined,
        vehicleId: undefined,
        currentPassengers: 0,
        waypoints: route.data.waypoints.map(waypoint => ({
          ...waypoint,
          passengers: []
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.create(duplicatedRoute);
    } catch (error: any) {
      console.error('Erro ao duplicar rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao duplicar rota'
      };
    }
  }

  /**
   * Finaliza uma rota (encontra a viagem ativa e a finaliza)
   */
  async finishRoute(routeId: string): Promise<CrudResponse<RouteTrip>> {
    try {
      // Buscar viagem ativa da rota
      const tripsQuery = query(
        collection(db, 'route_trips'),
        where('routeId', '==', routeId),
        where('status', '==', 'em_andamento'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const tripsSnapshot = await getDocs(tripsQuery);
      
      if (tripsSnapshot.empty) {
        return {
          data: null,
          error: 'Nenhuma viagem ativa encontrada para esta rota'
        };
      }

      const tripDoc = tripsSnapshot.docs[0];
      return await this.endTrip(tripDoc.id);
    } catch (error: any) {
      console.error('Erro ao finalizar rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao finalizar rota'
      };
    }
  }
}

export const routesService = new RoutesService();
export default routesService;