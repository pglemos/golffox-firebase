import { supabase, supabaseAdmin } from '../lib/supabase';
import type { Database } from '../lib/supabase';

// Tipos baseados no schema do Supabase
export type RouteRow = Database['public']['Tables']['routes']['Row'];
export type RouteInsert = Database['public']['Tables']['routes']['Insert'];
export type RouteUpdate = Database['public']['Tables']['routes']['Update'];

export type PassengerRow = Database['public']['Tables']['passengers']['Row'];
export type PassengerInsert = Database['public']['Tables']['passengers']['Insert'];
export type PassengerUpdate = Database['public']['Tables']['passengers']['Update'];

export type RoutePassengerRow = Database['public']['Tables']['route_passengers']['Row'];
export type RoutePassengerInsert = Database['public']['Tables']['route_passengers']['Insert'];

export type RouteHistoryRow = Database['public']['Tables']['route_history']['Row'];
export type RouteHistoryInsert = Database['public']['Tables']['route_history']['Insert'];

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
  actualDistance?: number;
  actualDuration?: number;
  fuelConsumed?: number;
  notes?: string;
  status: 'No Horário' | 'Com Problema' | 'Atrasado';
}

export interface CreateRouteData {
  name: string;
  startLocation: string;
  endLocation: string;
  startTime: string;
  driverId?: string;
  vehicleId?: string;
  passengerIds: string[];
  companyId: string;
}

export interface UpdateRouteData {
  name?: string;
  startLocation?: string;
  endLocation?: string;
  startTime?: string;
  endTime?: string;
  status?: Route['status'];
  driverId?: string;
  vehicleId?: string;
}

export class RouteService {
  private static instance: RouteService;

  public static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  /**
   * Converte dados do Supabase para o formato esperado pela aplicação
   */
  private convertRouteFromDB(dbRoute: RouteRow, passengers: PassengerRow[] = []): Route {
    return {
      id: dbRoute.id,
      name: dbRoute.name,
      startLocation: dbRoute.start_location || '',
      endLocation: dbRoute.destination || '',
      startTime: dbRoute.scheduled_start,
      endTime: dbRoute.actual_start || undefined,
      status: dbRoute.status as Route['status'],
      driverId: dbRoute.driver_id || undefined,
      vehicleId: dbRoute.vehicle_id || undefined,
      passengers: passengers.map(p => this.convertPassengerFromDB(p)),
      companyId: dbRoute.company_id,
      createdAt: new Date(dbRoute.created_at),
      updatedAt: new Date(dbRoute.updated_at)
    };
  }

  /**
   * Converte passageiro do Supabase para o formato esperado
   */
  private convertPassengerFromDB(dbPassenger: PassengerRow): Passenger {
    return {
      id: dbPassenger.id,
      name: dbPassenger.name,
      email: dbPassenger.email,
      address: dbPassenger.address,
      status: dbPassenger.status,
      companyId: dbPassenger.company_id
    };
  }

  /**
   * Obtém todas as rotas de uma empresa
   */
  async getRoutes(companyId: string): Promise<Route[]> {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_passengers!inner (
            passenger_id,
            passengers (*)
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return routes.map(route => {
        const passengers = route.route_passengers?.map(rp => rp.passengers).filter(Boolean) || [];
        return this.convertRouteFromDB(route, passengers as PassengerRow[]);
      });
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      throw error;
    }
  }

  /**
   * Obtém rota por ID
   */
  async getRoute(routeId: string): Promise<Route | null> {
    try {
      const { data: route, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_passengers!inner (
            passenger_id,
            passengers (*)
          )
        `)
        .eq('id', routeId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Não encontrado
        throw error;
      }

      const passengers = route.route_passengers?.map(rp => rp.passengers).filter(Boolean) || [];
      return this.convertRouteFromDB(route, passengers as PassengerRow[]);
    } catch (error) {
      console.error('Erro ao buscar rota:', error);
      throw error;
    }
  }

  /**
   * Cria nova rota
   */
  async createRoute(routeData: CreateRouteData): Promise<Route> {
    try {
      // Cria a rota
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .insert({
          name: routeData.name,
          start_location: routeData.startLocation,
          destination: routeData.endLocation,
          scheduled_start: routeData.startTime,
          driver_id: routeData.driverId,
          vehicle_id: routeData.vehicleId,
          company_id: routeData.companyId,
          status: 'No Horário'
        })
        .select()
        .single();

      if (routeError) throw routeError;

      // Associa passageiros à rota
      if (routeData.passengerIds.length > 0) {
        const routePassengers = routeData.passengerIds.map(passengerId => ({
          route_id: route.id,
          passenger_id: passengerId
        }));

        const { error: passengersError } = await supabase
          .from('route_passengers')
          .insert(routePassengers);

        if (passengersError) throw passengersError;
      }

      // Busca a rota completa com passageiros
      const createdRoute = await this.getRoute(route.id);
      if (!createdRoute) {
        throw new Error('Erro ao buscar rota criada');
      }

      return createdRoute;
    } catch (error) {
      console.error('Erro ao criar rota:', error);
      throw error;
    }
  }

  /**
   * Atualiza rota existente
   */
  async updateRoute(routeId: string, updateData: UpdateRouteData): Promise<Route> {
    try {
      const updatePayload: Partial<RouteUpdate> = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.startLocation) updatePayload.start_location = updateData.startLocation;
      if (updateData.endLocation) updatePayload.destination = updateData.endLocation;
      if (updateData.startTime) updatePayload.scheduled_start = updateData.startTime;
      if (updateData.status) updatePayload.status = updateData.status;
      if (updateData.driverId !== undefined) updatePayload.driver_id = updateData.driverId;
      if (updateData.vehicleId !== undefined) updatePayload.vehicle_id = updateData.vehicleId;

      const { error } = await supabase
        .from('routes')
        .update(updatePayload)
        .eq('id', routeId);

      if (error) throw error;

      // Busca a rota atualizada
      const updatedRoute = await this.getRoute(routeId);
      if (!updatedRoute) {
        throw new Error('Erro ao buscar rota atualizada');
      }

      return updatedRoute;
    } catch (error) {
      console.error('Erro ao atualizar rota:', error);
      throw error;
    }
  }

  /**
   * Deleta rota
   */
  async deleteRoute(routeId: string): Promise<void> {
    try {
      // Remove associações com passageiros primeiro
      const { error: passengersError } = await supabase
        .from('route_passengers')
        .delete()
        .eq('route_id', routeId);

      if (passengersError) throw passengersError;

      // Remove a rota
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar rota:', error);
      throw error;
    }
  }

  /**
   * Adiciona passageiro à rota
   */
  async addPassengerToRoute(routeId: string, passengerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('route_passengers')
        .insert({
          route_id: routeId,
          passenger_id: passengerId
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao adicionar passageiro à rota:', error);
      throw error;
    }
  }

  /**
   * Remove passageiro da rota
   */
  async removePassengerFromRoute(routeId: string, passengerId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('route_passengers')
        .delete()
        .eq('route_id', routeId)
        .eq('passenger_id', passengerId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover passageiro da rota:', error);
      throw error;
    }
  }

  /**
   * Inicia execução de uma rota
   */
  async startRoute(routeId: string, driverId: string): Promise<void> {
    try {
      // Atualiza status da rota
      await this.updateRoute(routeId, { status: 'No Horário' });

      // Cria registro no histórico
      const { error } = await supabase
        .from('route_history')
        .insert({
          route_id: routeId,
          driver_id: driverId,
          started_at: new Date().toISOString(),
          status: 'No Horário' // Será atualizado quando a rota for finalizada
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao iniciar rota:', error);
      throw error;
    }
  }

  /**
   * Finaliza execução de uma rota
   */
  async completeRoute(routeId: string, completionData: {
    actualDistance?: number;
    actualDuration?: number;
    fuelConsumed?: number;
    notes?: string;
  }): Promise<void> {
    try {
      // Atualiza status da rota
      await this.updateRoute(routeId, { 
        status: 'No Horário'
      });

      // Atualiza histórico
      const { error } = await supabase
        .from('route_history')
        .update({
          completed_at: new Date().toISOString(),
          actual_distance: completionData.actualDistance,
          actual_duration: completionData.actualDuration,
          fuel_consumed: completionData.fuelConsumed,
          notes: completionData.notes,
          status: 'No Horário'
        })
        .eq('route_id', routeId)
        .is('completed_at', null);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao finalizar rota:', error);
      throw error;
    }
  }

  /**
   * Cancela uma rota
   */
  async cancelRoute(routeId: string, reason?: string): Promise<void> {
    try {
      // Atualiza status da rota
      await this.updateRoute(routeId, { status: 'Com Problema' });

      // Atualiza histórico se existir
      const { error } = await supabase
        .from('route_history')
        .update({
          completed_at: new Date().toISOString(),
          notes: reason,
          status: 'Com Problema'
        })
        .eq('route_id', routeId)
        .is('completed_at', null);

      // Ignora erro se não houver histórico (rota não foi iniciada)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao cancelar rota:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de uma rota
   */
  async getRouteHistory(routeId: string): Promise<RouteHistory[]> {
    try {
      const { data: history, error } = await supabase
        .from('route_history')
        .select('*')
        .eq('route_id', routeId)
        .order('started_at', { ascending: false });

      if (error) throw error;

      return (history || []).map(h => ({
        id: h.id,
        routeId: h.route_id,
        driverId: h.driver_id,
        startedAt: new Date(h.started_at),
        completedAt: h.completed_at ? new Date(h.completed_at) : undefined,
        actualDistance: h.actual_distance || undefined,
        actualDuration: h.actual_duration || undefined,
        fuelConsumed: h.fuel_consumed || undefined,
        notes: h.notes || undefined,
        status: h.status as RouteHistory['status']
      }));
    } catch (error) {
      console.error('Erro ao buscar histórico da rota:', error);
      throw error;
    }
  }

  /**
   * Obtém rotas ativas de um motorista
   */
  async getDriverActiveRoutes(driverId: string): Promise<Route[]> {
    try {
      const { data: routes, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_passengers!inner (
            passenger_id,
            passengers (*)
          )
        `)
        .eq('driver_id', driverId)
        .in('status', ['No Horário', 'Atrasado'])
        .order('start_time');

      if (error) throw error;

      return routes.map(route => {
        const passengers = route.route_passengers?.map(rp => rp.passengers).filter(Boolean) || [];
        return this.convertRouteFromDB(route, passengers as PassengerRow[]);
      });
    } catch (error) {
      console.error('Erro ao buscar rotas ativas do motorista:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de rotas de uma empresa
   */
  async getRouteStats(companyId: string, startDate?: Date, endDate?: Date): Promise<{
    totalRoutes: number;
    completedRoutes: number;
    cancelledRoutes: number;
    activeRoutes: number;
    totalDistance: number;
    totalDuration: number;
    averageDistance: number;
    averageDuration: number;
  }> {
    try {
      let query = supabase
        .from('routes')
        .select('*')
        .eq('company_id', companyId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: routes, error } = await query;

      if (error) throw error;

      const stats = {
        totalRoutes: routes?.length || 0,
        completedRoutes: routes?.filter(r => r.status === 'No Horário').length || 0,
        cancelledRoutes: routes?.filter(r => r.status === 'Com Problema').length || 0,
        activeRoutes: routes?.filter(r => r.status === 'Atrasado').length || 0,
        totalDistance: 0,
        totalDuration: 0,
        averageDistance: 0,
        averageDuration: 0
      };

      if (routes && routes.length > 0) {
        const completedRoutes = routes.filter(r => r.status === 'No Horário');
        
        stats.totalDistance = completedRoutes.reduce((sum, r) => sum + (r.distance || 0), 0);
        stats.totalDuration = completedRoutes.reduce((sum, r) => sum + (r.duration || 0), 0);
        
        if (completedRoutes.length > 0) {
          stats.averageDistance = stats.totalDistance / completedRoutes.length;
          stats.averageDuration = stats.totalDuration / completedRoutes.length;
        }
      }

      return stats;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de rotas:', error);
      throw error;
    }
  }

  /**
   * Atualiza status de um passageiro em uma rota
   */
  async updatePassengerStatus(passengerId: string, status: Passenger['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('passengers')
        .update({ status })
        .eq('id', passengerId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status do passageiro:', error);
      throw error;
    }
  }

  /**
   * Obtém passageiros de uma empresa
   */
  async getPassengers(companyId: string): Promise<Passenger[]> {
    try {
      const { data: passengers, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;

      return (passengers || []).map(p => this.convertPassengerFromDB(p));
    } catch (error) {
      console.error('Erro ao buscar passageiros:', error);
      throw error;
    }
  }

  /**
   * Cria novo passageiro
   */
  async createPassenger(passengerData: Omit<Passenger, 'id' | 'status'>): Promise<Passenger> {
    try {
      const { data: passenger, error } = await supabase
        .from('passengers')
        .insert({
          name: passengerData.name,
          email: passengerData.email,
          address: passengerData.address,
          company_id: passengerData.companyId,
          status: 'Ativo'
        })
        .select()
        .single();

      if (error) throw error;

      return this.convertPassengerFromDB(passenger);
    } catch (error) {
      console.error('Erro ao criar passageiro:', error);
      throw error;
    }
  }

  /**
   * Atualiza passageiro
   */
  async updatePassenger(passengerId: string, updateData: Partial<Omit<Passenger, 'id' | 'companyId'>>): Promise<Passenger> {
    try {
      const updatePayload: Partial<PassengerUpdate> = {};
      
      if (updateData.name) updatePayload.name = updateData.name;
      if (updateData.email) updatePayload.email = updateData.email;
      if (updateData.address) updatePayload.address = updateData.address;
      if (updateData.status) updatePayload.status = updateData.status;

      const { data: passenger, error } = await supabase
        .from('passengers')
        .update(updatePayload)
        .eq('id', passengerId)
        .select()
        .single();

      if (error) throw error;

      return this.convertPassengerFromDB(passenger);
    } catch (error) {
      console.error('Erro ao atualizar passageiro:', error);
      throw error;
    }
  }

  /**
   * Deleta passageiro
   */
  async deletePassenger(passengerId: string): Promise<void> {
    try {
      // Remove associações com rotas primeiro
      const { error: routeError } = await supabase
        .from('route_passengers')
        .delete()
        .eq('passenger_id', passengerId);

      if (routeError) throw routeError;

      // Remove o passageiro
      const { error } = await supabase
        .from('passengers')
        .delete()
        .eq('id', passengerId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar passageiro:', error);
      throw error;
    }
  }
}

// Instância singleton
export const routeService = RouteService.getInstance();