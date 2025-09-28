import { Timestamp } from 'firebase/firestore'

// Tipos base
export type UserRole = 'admin' | 'manager' | 'operator' | 'driver'
export type CompanyStatus = 'active' | 'inactive' | 'suspended'
export type DriverStatus = 'active' | 'inactive' | 'suspended' | 'vacation'
export type ContractType = 'clt' | 'pj' | 'freelancer'
export type CnhCategory = 'A' | 'B' | 'C' | 'D' | 'E' | 'AB' | 'AC' | 'AD' | 'AE'
export type VehicleStatus = 'active' | 'maintenance' | 'inactive'
export type RouteStatus = 'active' | 'inactive' | 'completed'
export type AlertType = 'delay' | 'breakdown' | 'accident' | 'no_show' | 'route_deviation' | 'emergency'
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type PassengerStatus = 'pending' | 'picked_up' | 'dropped_off' | 'no_show'
export type CostCategory = 'fuel' | 'maintenance' | 'salary' | 'insurance' | 'other'
export type RouteHistoryStatus = 'completed' | 'cancelled' | 'interrupted'

// Interface base para documentos Firestore
export interface FirestoreDocument {
  id: string
  created_at: Timestamp
  updated_at: Timestamp
}

// Companies Collection
export interface Company extends FirestoreDocument {
  name: string
  cnpj: string
  status: CompanyStatus
  address?: string
  phone?: string
  email?: string
}

// Users Subcollection (companies/{companyId}/users/{userId})
export interface User extends FirestoreDocument {
  email: string
  role: UserRole
  name: string
  phone?: string
  company_id: string
  permission_profile_id: string
  is_active: boolean
}

// Drivers Subcollection (companies/{companyId}/drivers/{driverId})
export interface Driver extends FirestoreDocument {
  user_id: string
  company_id: string
  cnh_number: string
  cnh_category: CnhCategory
  cnh_expiry: Timestamp
  status: DriverStatus
  contract_type: ContractType
  hire_date?: Timestamp
}

// Vehicles Subcollection (companies/{companyId}/vehicles/{vehicleId})
export interface Vehicle extends FirestoreDocument {
  company_id: string
  plate: string
  model: string
  year: number
  capacity: number
  status: VehicleStatus
  current_driver_id?: string
}

// Passengers Subcollection (companies/{companyId}/passengers/{passengerId})
export interface Passenger extends FirestoreDocument {
  company_id: string
  name: string
  phone?: string
  address: string
  is_active: boolean
}

// Routes Subcollection (companies/{companyId}/routes/{routeId})
export interface Route extends FirestoreDocument {
  company_id: string
  name: string
  description?: string
  vehicle_id: string
  driver_id: string
  status: RouteStatus
  start_time: Timestamp
  end_time?: Timestamp
}

// Route Passengers Subcollection (companies/{companyId}/routes/{routeId}/passengers/{passengerRouteId})
export interface RoutePassenger extends FirestoreDocument {
  route_id: string
  passenger_id: string
  pickup_address: string
  pickup_time: Timestamp
  dropoff_address?: string
  dropoff_time?: Timestamp
  status: PassengerStatus
}

// Alerts Subcollection (companies/{companyId}/alerts/{alertId})
export interface Alert extends FirestoreDocument {
  company_id: string
  route_id?: string
  driver_id?: string
  vehicle_id?: string
  type: AlertType
  message: string
  severity: AlertSeverity
  is_resolved: boolean
  resolved_at?: Timestamp
}

// Route History Subcollection (companies/{companyId}/routes/{routeId}/history/{historyId})
export interface RouteHistory {
  id: string
  route_id: string
  driver_id: string
  vehicle_id: string
  start_time: Timestamp
  end_time?: Timestamp
  total_distance?: number
  total_duration?: number
  status: RouteHistoryStatus
  created_at: Timestamp
}

// Cost Control Subcollection (companies/{companyId}/costs/{costId})
export interface CostControl extends FirestoreDocument {
  company_id: string
  route_id?: string
  vehicle_id?: string
  driver_id?: string
  category: CostCategory
  description: string
  amount: number
  date: Timestamp
}

// Driver Performance Subcollection (companies/{companyId}/performance/{performanceId})
export interface DriverPerformance extends FirestoreDocument {
  company_id: string
  driver_id: string
  route_id: string
  date: Timestamp
  punctuality_score: number // 0-100
  safety_score: number // 0-100
  efficiency_score: number // 0-100
  total_routes: number
  completed_routes: number
  cancelled_routes: number
}

// Vehicle Locations Subcollection (companies/{companyId}/vehicles/{vehicleId}/locations/{locationId})
export interface VehicleLocation extends FirestoreDocument {
  vehicle_id: string
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  accuracy?: number
  timestamp: Timestamp
}

// Permission Profiles Global Collection
export interface PermissionProfile extends FirestoreDocument {
  name: string
  permissions: string[]
  description?: string
}

// Tipos para criação de documentos (sem campos auto-gerados)
export type CreateCompany = Omit<Company, 'id' | 'created_at' | 'updated_at'>
export type CreateUser = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type CreateDriver = Omit<Driver, 'id' | 'created_at' | 'updated_at'>
export type CreateVehicle = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
export type CreatePassenger = Omit<Passenger, 'id' | 'created_at' | 'updated_at'>
export type CreateRoute = Omit<Route, 'id' | 'created_at' | 'updated_at'>
export type CreateRoutePassenger = Omit<RoutePassenger, 'id' | 'created_at' | 'updated_at'>
export type CreateAlert = Omit<Alert, 'id' | 'created_at' | 'updated_at'>
export type CreateCostControl = Omit<CostControl, 'id' | 'created_at' | 'updated_at'>
export type CreateDriverPerformance = Omit<DriverPerformance, 'id' | 'created_at' | 'updated_at'>
export type CreateVehicleLocation = Omit<VehicleLocation, 'id' | 'created_at' | 'updated_at'>
export type CreatePermissionProfile = Omit<PermissionProfile, 'id' | 'created_at' | 'updated_at'>

// Tipos para atualização de documentos (todos os campos opcionais exceto ID)
export type UpdateCompany = Partial<Omit<Company, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateUser = Partial<Omit<User, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateDriver = Partial<Omit<Driver, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateVehicle = Partial<Omit<Vehicle, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdatePassenger = Partial<Omit<Passenger, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateRoute = Partial<Omit<Route, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateRoutePassenger = Partial<Omit<RoutePassenger, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateAlert = Partial<Omit<Alert, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateCostControl = Partial<Omit<CostControl, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateDriverPerformance = Partial<Omit<DriverPerformance, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdateVehicleLocation = Partial<Omit<VehicleLocation, 'id' | 'created_at'>> & { updated_at: Timestamp }
export type UpdatePermissionProfile = Partial<Omit<PermissionProfile, 'id' | 'created_at'>> & { updated_at: Timestamp }

// Tipos para consultas e filtros
export interface QueryOptions {
  limit?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
  startAfter?: any
  where?: Array<{
    field: string
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in'
    value: any
  }>
}

// Tipos para respostas paginadas
export interface PaginatedResponse<T> {
  data: T[]
  hasMore: boolean
  lastDoc?: any
  total?: number
}

// Tipos para contexto de autenticação
export interface AuthContext {
  user: User | null
  company: Company | null
  permissions: string[]
  isLoading: boolean
}

// Tipos para notificações FCM
export interface FCMNotification {
  title: string
  body: string
  data?: Record<string, string>
  token?: string
  topic?: string
  condition?: string
}

// Tipos para Cloud Functions
export interface CloudFunctionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
}