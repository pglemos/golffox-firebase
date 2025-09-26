// Base service
export { BaseCrudService } from './baseCrudService'
export type { CrudResponse, CrudListResponse, PaginationOptions, FilterOptions, SortOptions } from './baseCrudService'

// Authentication service
export { AuthService, authService } from './authService'
export type { 
  UserRow, 
  UserInsert, 
  UserUpdate, 
  UserRole, 
  CompanyStatus,
  AuthUser,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  PasswordResetData,
  PasswordUpdateData
} from './authService'

// Companies service
export { CompaniesService, companiesService } from './companiesService'
export type { 
  CompanyRow, 
  CompanyInsert, 
  CompanyUpdate,
  CompanyWithStats,
  CompanyFilters
} from './companiesService'

// Drivers service
export { DriversService, driversService } from './driversService'
export type { 
  DriverRow, 
  DriverInsert, 
  DriverUpdate,
  DriverWithVehicle,
  DriverFilters
} from './driversService'

// Vehicles service
export { VehiclesService, vehiclesService } from './vehiclesService'
export type { 
  VehicleRow, 
  VehicleInsert, 
  VehicleUpdate,
  VehicleWithDriver,
  VehicleFilters
} from './vehiclesService'

// Passengers service
export { PassengersService, passengersService } from './passengersService'
export type { 
  PassengerRow, 
  PassengerInsert, 
  PassengerUpdate,
  PassengerWithRoutes,
  PassengerFilters
} from './passengersService'

// Routes service
export { RoutesService, routesService } from './routesService'
export type { 
  RouteRow, 
  RouteInsert, 
  RouteUpdate,
  RouteWithDetails,
  RouteFilters
} from './routesService'

// Alerts service
export { AlertsService, alertsService } from './alertsService'
export type { 
  AlertRow, 
  AlertInsert, 
  AlertUpdate,
  AlertWithDetails,
  AlertFilters
} from './alertsService'

// Centralized services object for easy access - Temporariamente comentado para debug
/*
export const services = {
  auth: authService,
  companies: companiesService,
  drivers: driversService,
  vehicles: vehiclesService,
  passengers: passengersService,
  routes: routesService,
  alerts: alertsService,
}

// Service types for type safety
export type ServiceType = keyof typeof services
*/