// Base service
export { BaseCrudService } from './baseCrudService'
export type { CrudResponse, CrudListResponse, PaginationOptions, FilterOptions, SortOptions } from './baseCrudService'

// Import service instances
import { authService } from './authService'
import { companiesService } from './companiesService'
import { driversService } from './driversService'
import { vehiclesService } from './vehiclesService'
import { passengersService } from './passengersService'
import { routesService } from './routesService'
import { alertsService } from './alertsService'

// Authentication service
export { AuthService } from './authService'
export { authService } from './authService'
export type { 
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
export { CompaniesService } from './companiesService'
export { companiesService } from './companiesService'
export type { 
  Company, 
  CompanyInsert, 
  CompanyUpdate,
  CompanyWithStats,
  CompanyFilters
} from './companiesService'

// Drivers service
export { DriversService } from './driversService'
export { driversService } from './driversService'
export type { 
  Driver, 
  DriverInsert, 
  DriverUpdate,
  DriverWithVehicle,
  DriverFilters
} from './driversService'

// Vehicles service
export { VehiclesService } from './vehiclesService'
export { vehiclesService } from './vehiclesService'
export type { 
  Vehicle, 
  VehicleInsert, 
  VehicleUpdate,
  VehicleWithDriver,
  VehicleFilters
} from './vehiclesService'

// Passengers service
export { PassengersService } from './passengersService'
export { passengersService } from './passengersService'
export type { 
  Passenger, 
  PassengerInsert, 
  PassengerUpdate,
  PassengerWithRoutes,
  PassengerFilters
} from './passengersService'

// Routes service
export { RoutesService } from './routesService'
export { routesService } from './routesService'
export type { 
  Route, 
  RouteInsert, 
  RouteUpdate,
  RouteWithDetails,
  RouteFilters
} from './routesService'

// Alerts service
export { AlertsService } from './alertsService'
export { alertsService } from './alertsService'
export type { 
  Alert, 
  AlertInsert, 
  AlertUpdate,
  AlertWithDetails,
  AlertFilters,
  AlertStats
} from './alertsService'

// Centralized services object for easy access
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