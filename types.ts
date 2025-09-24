export type View = 'Dashboard' | 'Mapa' | 'Rotas' | 'Veículos' | 'Motoristas' | 'Empresas' | 'Permissões' | 'Socorro' | 'Alertas' | 'Relatórios';
export type AppView = 'Painel de Gestão (Golffox)' | 'App do Motorista' | 'App do Passageiro' | 'Portal do Operador';
export type ClientView = 'Dashboard' | 'Funcionários';

export enum VehicleStatus {
  Moving = 'Em Movimento',
  Stopped = 'Parado',
  Problem = 'Com Problema'
}

export enum RouteStatus {
  OnTime = 'No Horário',
  Delayed = 'Atrasado',
  Problem = 'Com Problema'
}

export enum AlertType {
  Critical = 'Crítico',
  Warning = 'Atenção',
  Info = 'Informativo'
}

export interface Passenger {
    id: string;
    name: string;
    pickupTime: string;
    photoUrl: string;
    cpf: string;
    address: string; // Add address field
    position: {
        lat: number;
        lng: number;
    };
}

export interface Route {
  id: string;
  name: string;
  driver: string;
  vehicle: string;
  status: RouteStatus;
  passengers: {
    onboard: number;
    total: number;
    list: Passenger[];
  };
  scheduledStart: string;
  actualStart: string;
  punctuality: number; // in minutes, negative is early, positive is late
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  driver: string;
  status: VehicleStatus;
  position: {
    lat: number;
    lng: number;
  };
  routeId?: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface Driver {
    id: string;
    name: string;
    cnh: string;
    status: 'Disponível' | 'Em Rota' | 'Indisponível';
    photoUrl: string;
}

export interface Company {
    id: string;
    name: string;
    cnpj: string;
    contact: string;
    status: 'Ativo' | 'Inativo';
    address: string;
    contractedPassengers: number;
}

export interface Employee {
    id: string;
    companyId: string; // Link employee to a company
    name: string;
    cpf: string;
    email: string;
    address: string;
    password?: string;
    status: 'Ativo' | 'Inativo';
    permissionProfileId: string;
}

// FIX: Added PermissionProfile interface for the new permissions management screen.
export interface PermissionProfile {
    id: string;
    name: string;
    description: string;
    access: string[];
    isAdminFeature?: boolean;
}

export interface ChecklistItem {
    id: string;
    label: string;
    isCritical: boolean;
}

export interface Direction {
  instruction: string;
  distance: string;
  icon: string; // Changed from React.FC to string to break dependency cycle
}