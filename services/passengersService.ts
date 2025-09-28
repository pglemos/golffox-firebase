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
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Tipos específicos para passageiros
export interface Passenger {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  phone: string;
  birthDate: Date;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'Ativo' | 'Inativo';
  companyId: string;
  routeId?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupOrder?: number;
  specialNeeds?: boolean;
  specialNeedsDescription?: string;
  emergencyContact: EmergencyContact;
  medicalInfo?: MedicalInfo;
  preferences?: PassengerPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface PassengerInsert extends Omit<Passenger, 'id' | 'createdAt' | 'updatedAt'> {}

export interface PassengerUpdate extends Partial<Omit<Passenger, 'id' | 'createdAt'>> {}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
  email?: string;
}

export interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  bloodType?: string;
  doctorName?: string;
  doctorPhone?: string;
  healthInsurance?: string;
  healthInsuranceNumber?: string;
}

export interface PassengerPreferences {
  preferredSeat?: 'front' | 'middle' | 'back' | 'any';
  needsAssistance?: boolean;
  assistanceType?: string;
  communicationPreference?: 'sms' | 'whatsapp' | 'email' | 'phone';
  language?: string;
}

export interface PassengerWithRoutes extends Passenger {
  routes?: Array<{
    id: string;
    name: string;
    status: string;
    pickupTime: string;
    pickupLocation: string;
    dropoffLocation: string;
  }>;
  company?: {
    id: string;
    name: string;
    status: string;
  };
  currentRoute?: {
    id: string;
    name: string;
    status: string;
    pickupTime: string;
    driverId?: string;
    vehicleId?: string;
  };
}

export interface PassengerFilters {
  name?: string;
  cpf?: string;
  email?: string;
  status?: 'Ativo' | 'Inativo';
  companyId?: string;
  address?: string;
  specialNeeds?: boolean;
  routeId?: string;
  city?: string;
  neighborhood?: string;
}

export interface PassengerCheckIn {
  id: string;
  passengerId: string;
  routeId: string;
  tripId: string;
  checkInTime: Date;
  checkInLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'embarcado' | 'desembarcado' | 'ausente' | 'atrasado';
  notes?: string;
  driverId: string;
  vehicleId: string;
  companyId: string;
  createdAt: Date;
}

export class PassengersService extends BaseCrudService<Passenger> {
  constructor() {
    super('passengers');
  }

  /**
   * Busca passageiros com detalhes completos
   */
  async findAllWithDetails(): Promise<CrudListResponse<PassengerWithRoutes>> {
    try {
      const passengersResult = await this.list();
      
      if (passengersResult.error) {
        return passengersResult as CrudListResponse<PassengerWithRoutes>;
      }

      const passengersWithDetails: PassengerWithRoutes[] = [];

      for (const passenger of passengersResult.data) {
        const details = await this.getPassengerDetails(passenger.id);
        
        passengersWithDetails.push({
          ...passenger,
          ...details
        });
      }

      return {
        data: passengersWithDetails,
        error: null,
        count: passengersWithDetails.length,
        totalCount: passengersWithDetails.length
      };
    } catch (error: any) {
      console.error('Erro ao buscar passageiros com detalhes:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros com detalhes'
      };
    }
  }

  /**
   * Busca detalhes de um passageiro específico
   */
  async getPassengerDetails(passengerId: string): Promise<{
    routes?: Array<{ id: string; name: string; status: string; pickupTime: string; pickupLocation: string; dropoffLocation: string }>;
    company?: { id: string; name: string; status: string };
    currentRoute?: { id: string; name: string; status: string; pickupTime: string; driverId?: string; vehicleId?: string };
  }> {
    try {
      const passenger = await this.getById(passengerId);
      
      if (passenger.error || !passenger.data) {
        return {};
      }

      const details: any = {};

      // Buscar empresa
      const companyDoc = await getDoc(doc(db, 'companies', passenger.data.companyId));
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        details.company = {
          id: companyDoc.id,
          name: companyData.name,
          status: companyData.status
        };
      }

      // Buscar rota atual se associado
      if (passenger.data.routeId) {
        const routeDoc = await getDoc(doc(db, 'routes', passenger.data.routeId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          details.currentRoute = {
            id: routeDoc.id,
            name: routeData.name,
            status: routeData.status,
            pickupTime: routeData.pickupTime,
            driverId: routeData.driverId,
            vehicleId: routeData.vehicleId
          };
        }
      }

      // Buscar histórico de rotas
      const routesHistory = await this.getPassengerRoutesHistory(passengerId);
      if (routesHistory.data) {
        details.routes = routesHistory.data;
      }

      return details;
    } catch (error) {
      console.error('Erro ao buscar detalhes do passageiro:', error);
      return {};
    }
  }

  /**
   * Busca passageiros por empresa
   */
  async findByCompany(companyId: string): Promise<CrudListResponse<Passenger>> {
    try {
      return await this.findWhere('companyId', '==', companyId);
    } catch (error: any) {
      console.error('Erro ao buscar passageiros por empresa:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros por empresa'
      };
    }
  }

  /**
   * Busca passageiros ativos
   */
  async findActivePassengers(companyId?: string): Promise<CrudListResponse<Passenger>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'passengers'),
          where('status', '==', 'Ativo'),
          where('companyId', '==', companyId)
        );
        
        const snapshot = await getDocs(q);
        const passengers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Passenger[];

        return {
          data: passengers,
          error: null,
          count: passengers.length,
          totalCount: passengers.length
        };
      } else {
        return await this.findWhere('status', '==', 'Ativo');
      }
    } catch (error: any) {
      console.error('Erro ao buscar passageiros ativos:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros ativos'
      };
    }
  }

  /**
   * Busca passageiros por rota
   */
  async findByRoute(routeId: string): Promise<CrudListResponse<Passenger>> {
    try {
      return await this.findWhere('routeId', '==', routeId);
    } catch (error: any) {
      console.error('Erro ao buscar passageiros por rota:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros por rota'
      };
    }
  }

  /**
   * Busca passageiro por CPF
   */
  async findByCpf(cpf: string): Promise<CrudResponse<Passenger>> {
    try {
      const formattedCpf = this.formatCpf(cpf);
      const result = await this.findWhere('cpf', '==', formattedCpf);
      
      if (result.error) {
        return {
          data: null,
          error: result.error
        };
      }

      return {
        data: result.data[0] || null,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar passageiro por CPF:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar passageiro por CPF'
      };
    }
  }

  /**
   * Busca passageiros sem rota
   */
  async findWithoutRoute(companyId?: string): Promise<CrudListResponse<Passenger>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'passengers'),
          where('routeId', '==', null),
          where('companyId', '==', companyId),
          where('status', '==', 'Ativo')
        );
        
        const snapshot = await getDocs(q);
        const passengers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Passenger[];

        return {
          data: passengers,
          error: null,
          count: passengers.length,
          totalCount: passengers.length
        };
      } else {
        const q = query(
          collection(db, 'passengers'),
          where('routeId', '==', null),
          where('status', '==', 'Ativo')
        );
        
        const snapshot = await getDocs(q);
        const passengers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Passenger[];

        return {
          data: passengers,
          error: null,
          count: passengers.length,
          totalCount: passengers.length
        };
      }
    } catch (error: any) {
      console.error('Erro ao buscar passageiros sem rota:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros sem rota'
      };
    }
  }

  /**
   * Busca passageiros com necessidades especiais
   */
  async findWithSpecialNeeds(companyId?: string): Promise<CrudListResponse<Passenger>> {
    try {
      if (companyId) {
        const q = query(
          collection(db, 'passengers'),
          where('specialNeeds', '==', true),
          where('companyId', '==', companyId)
        );
        
        const snapshot = await getDocs(q);
        const passengers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Passenger[];

        return {
          data: passengers,
          error: null,
          count: passengers.length,
          totalCount: passengers.length
        };
      } else {
        return await this.findWhere('specialNeeds', '==', true);
      }
    } catch (error: any) {
      console.error('Erro ao buscar passageiros com necessidades especiais:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros com necessidades especiais'
      };
    }
  }

  /**
   * Associa passageiro a uma rota
   */
  async assignToRoute(passengerId: string, routeId: string, pickupLocation: string, dropoffLocation: string, pickupOrder?: number): Promise<CrudResponse<Passenger>> {
    try {
      // Verificar se a rota existe
      const routeDoc = await getDoc(doc(db, 'routes', routeId));
      if (!routeDoc.exists()) {
        return {
          data: null,
          error: 'Rota não encontrada'
        };
      }

      const routeData = routeDoc.data();
      
      // Verificar capacidade da rota
      if (routeData.currentPassengers >= routeData.maxPassengers) {
        return {
          data: null,
          error: 'Rota já está com capacidade máxima'
        };
      }

      // Atualizar passageiro
      const passengerResult = await this.update(passengerId, {
        routeId,
        pickupLocation,
        dropoffLocation,
        pickupOrder: pickupOrder || 0
      });

      if (passengerResult.error) {
        return passengerResult;
      }

      // Atualizar contador de passageiros na rota
      await updateDoc(doc(db, 'routes', routeId), {
        currentPassengers: routeData.currentPassengers + 1,
        updatedAt: serverTimestamp()
      });

      return passengerResult;
    } catch (error: any) {
      console.error('Erro ao associar passageiro à rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao associar passageiro à rota'
      };
    }
  }

  /**
   * Remove associação de passageiro da rota
   */
  async removeFromRoute(passengerId: string): Promise<CrudResponse<Passenger>> {
    try {
      const passenger = await this.getById(passengerId);
      
      if (passenger.error || !passenger.data) {
        return {
          data: null,
          error: 'Passageiro não encontrado'
        };
      }

      const routeId = passenger.data.routeId;

      // Atualizar passageiro
      const passengerResult = await this.update(passengerId, {
        routeId: null,
        pickupLocation: null,
        dropoffLocation: null,
        pickupOrder: null
      });

      if (passengerResult.error) {
        return passengerResult;
      }

      // Atualizar contador de passageiros na rota se existir
      if (routeId) {
        const routeDoc = await getDoc(doc(db, 'routes', routeId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          await updateDoc(doc(db, 'routes', routeId), {
            currentPassengers: Math.max(0, routeData.currentPassengers - 1),
            updatedAt: serverTimestamp()
          });
        }
      }

      return passengerResult;
    } catch (error: any) {
      console.error('Erro ao remover passageiro da rota:', error);
      return {
        data: null,
        error: error.message || 'Erro ao remover passageiro da rota'
      };
    }
  }

  /**
   * Registra check-in de passageiro
   */
  async checkIn(passengerId: string, routeId: string, tripId: string, location: { latitude: number; longitude: number; address: string }, driverId: string, vehicleId: string): Promise<CrudResponse<PassengerCheckIn>> {
    try {
      const passenger = await this.getById(passengerId);
      
      if (passenger.error || !passenger.data) {
        return {
          data: null,
          error: 'Passageiro não encontrado'
        };
      }

      const checkInData: Omit<PassengerCheckIn, 'id'> = {
        passengerId,
        routeId,
        tripId,
        checkInTime: new Date(),
        checkInLocation: location,
        status: 'embarcado',
        driverId,
        vehicleId,
        companyId: passenger.data.companyId,
        createdAt: new Date()
      };

      // Salvar check-in
      const checkInRef = doc(collection(db, 'passenger_checkins'));
      await updateDoc(checkInRef, {
        ...checkInData,
        createdAt: serverTimestamp()
      });

      return {
        data: { id: checkInRef.id, ...checkInData } as PassengerCheckIn,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao registrar check-in:', error);
      return {
        data: null,
        error: error.message || 'Erro ao registrar check-in'
      };
    }
  }

  /**
   * Registra check-out de passageiro
   */
  async checkOut(passengerId: string, tripId: string, location: { latitude: number; longitude: number; address: string }): Promise<CrudResponse<PassengerCheckIn>> {
    try {
      // Buscar check-in ativo
      const q = query(
        collection(db, 'passenger_checkins'),
        where('passengerId', '==', passengerId),
        where('tripId', '==', tripId),
        where('status', '==', 'embarcado'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return {
          data: null,
          error: 'Check-in não encontrado'
        };
      }

      const checkInDoc = snapshot.docs[0];
      const checkInData = checkInDoc.data() as PassengerCheckIn;

      // Atualizar check-in para check-out
      await updateDoc(doc(db, 'passenger_checkins', checkInDoc.id), {
        status: 'desembarcado',
        checkOutTime: serverTimestamp(),
        checkOutLocation: location
      });

      return {
        data: { ...checkInData, status: 'desembarcado' },
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao registrar check-out:', error);
      return {
        data: null,
        error: error.message || 'Erro ao registrar check-out'
      };
    }
  }

  /**
   * Busca histórico de rotas do passageiro
   */
  async getPassengerRoutesHistory(passengerId: string): Promise<CrudResponse<Array<{ id: string; name: string; status: string; pickupTime: string; pickupLocation: string; dropoffLocation: string }>>> {
    try {
      // Buscar check-ins do passageiro
      const q = query(
        collection(db, 'passenger_checkins'),
        where('passengerId', '==', passengerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map(doc => doc.data());

      // Buscar rotas únicas
      const routeIds = Array.from(new Set(checkIns.map(checkIn => checkIn.routeId)));
      const routes = [];

      for (const routeId of routeIds) {
        const routeDoc = await getDoc(doc(db, 'routes', routeId));
        if (routeDoc.exists()) {
          const routeData = routeDoc.data();
          
          // Buscar dados específicos do passageiro nesta rota
          const passengerCheckIns = checkIns.filter(checkIn => checkIn.routeId === routeId);
          const lastCheckIn = passengerCheckIns[0]; // Mais recente

          routes.push({
            id: routeDoc.id,
            name: routeData.name,
            status: routeData.status,
            pickupTime: routeData.pickupTime,
            pickupLocation: lastCheckIn?.checkInLocation?.address || '',
            dropoffLocation: lastCheckIn?.checkOutLocation?.address || ''
          });
        }
      }

      return {
        data: routes,
        error: null
      };
    } catch (error: any) {
      console.error('Erro ao buscar histórico de rotas:', error);
      return {
        data: null,
        error: error.message || 'Erro ao buscar histórico de rotas'
      };
    }
  }

  /**
   * Valida CPF
   */
  private validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  }

  /**
   * Formata CPF
   */
  private formatCpf(cpf: string): string {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Verifica se CPF já está em uso
   */
  async isCpfInUse(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      const formattedCpf = this.formatCpf(cpf);
      const result = await this.findWhere('cpf', '==', formattedCpf);
      
      if (result.error) {
        return false;
      }

      const existingPassengers = result.data.filter(passenger => 
        excludeId ? passenger.id !== excludeId : true
      );

      return existingPassengers.length > 0;
    } catch (error) {
      console.error('Erro ao verificar CPF:', error);
      return false;
    }
  }

  /**
   * Busca passageiros com filtros avançados
   */
  async findWithFilters(filters: PassengerFilters): Promise<CrudListResponse<Passenger>> {
    try {
      // Para filtros simples, usar findWhere
      if (Object.keys(filters).length === 1) {
        const [field, value] = Object.entries(filters)[0];
        if (value !== undefined) {
          return await this.findWhere(field, '==', value);
        }
      }

      // Para múltiplos filtros, buscar todos e filtrar no cliente
      const allPassengers = await this.list();
      
      if (allPassengers.error) {
        return allPassengers;
      }

      const filteredData = allPassengers.data.filter(passenger => {
        if (filters.name && !passenger.name.toLowerCase().includes(filters.name.toLowerCase())) {
          return false;
        }
        if (filters.cpf && !passenger.cpf.includes(filters.cpf.replace(/\D/g, ''))) {
          return false;
        }
        if (filters.email && passenger.email && !passenger.email.toLowerCase().includes(filters.email.toLowerCase())) {
          return false;
        }
        if (filters.status && passenger.status !== filters.status) {
          return false;
        }
        if (filters.companyId && passenger.companyId !== filters.companyId) {
          return false;
        }
        if (filters.routeId && passenger.routeId !== filters.routeId) {
          return false;
        }
        if (filters.address && !passenger.address.toLowerCase().includes(filters.address.toLowerCase())) {
          return false;
        }
        if (filters.city && !passenger.city.toLowerCase().includes(filters.city.toLowerCase())) {
          return false;
        }
        if (filters.neighborhood && !passenger.neighborhood.toLowerCase().includes(filters.neighborhood.toLowerCase())) {
          return false;
        }
        if (filters.specialNeeds !== undefined && passenger.specialNeeds !== filters.specialNeeds) {
          return false;
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
      console.error('Erro ao buscar passageiros com filtros:', error);
      return {
        data: [],
        error: error.message || 'Erro ao buscar passageiros'
      };
    }
  }

  /**
   * Atualiza status do passageiro
   */
  async updateStatus(passengerId: string, status: 'Ativo' | 'Inativo'): Promise<CrudResponse<Passenger>> {
    try {
      return await this.update(passengerId, { status });
    } catch (error: any) {
      console.error('Erro ao atualizar status do passageiro:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar status'
      };
    }
  }

  /**
   * Atualiza informações de emergência
   */
  async updateEmergencyContact(passengerId: string, emergencyContact: EmergencyContact): Promise<CrudResponse<Passenger>> {
    try {
      return await this.update(passengerId, { emergencyContact });
    } catch (error: any) {
      console.error('Erro ao atualizar contato de emergência:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar contato de emergência'
      };
    }
  }

  /**
   * Atualiza informações médicas
   */
  async updateMedicalInfo(passengerId: string, medicalInfo: MedicalInfo): Promise<CrudResponse<Passenger>> {
    try {
      return await this.update(passengerId, { medicalInfo });
    } catch (error: any) {
      console.error('Erro ao atualizar informações médicas:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar informações médicas'
      };
    }
  }

  /**
   * Cria passageiro com validação
   */
  async create(data: PassengerInsert): Promise<CrudResponse<Passenger>> {
    try {
      // Validar CPF
      if (!this.validateCpf(data.cpf)) {
        return {
          data: null,
          error: 'CPF inválido'
        };
      }

      // Verificar se CPF já está em uso
      const cpfInUse = await this.isCpfInUse(data.cpf);
      if (cpfInUse) {
        return {
          data: null,
          error: 'CPF já está em uso'
        };
      }

      // Formatar CPF
      const formattedData: Omit<Passenger, 'id'> = {
        ...data,
        cpf: this.formatCpf(data.cpf),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await super.create(formattedData);
    } catch (error: any) {
      console.error('Erro ao criar passageiro:', error);
      return {
        data: null,
        error: error.message || 'Erro ao criar passageiro'
      };
    }
  }

  /**
   * Atualiza passageiro com validação
   */
  async update(id: string, data: PassengerUpdate): Promise<CrudResponse<Passenger>> {
    try {
      // Validar CPF se fornecido
      if (data.cpf) {
        if (!this.validateCpf(data.cpf)) {
          return {
            data: null,
            error: 'CPF inválido'
          };
        }

        // Verificar se CPF já está em uso
        const cpfInUse = await this.isCpfInUse(data.cpf, id);
        if (cpfInUse) {
          return {
            data: null,
            error: 'CPF já está em uso'
          };
        }

        // Formatar CPF
        data.cpf = this.formatCpf(data.cpf);
      }

      return await super.update(id, data);
    } catch (error: any) {
      console.error('Erro ao atualizar passageiro:', error);
      return {
        data: null,
        error: error.message || 'Erro ao atualizar passageiro'
      };
    }
  }
}

export const passengersService = new PassengersService();
export default passengersService;