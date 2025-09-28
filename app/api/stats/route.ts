import { NextRequest, NextResponse } from 'next/server'
import {
  AuthenticatedRequest,
  createApiResponse,
  withRoleAuth,
  validatePagination,
  ApiError
} from '../middleware'

interface DashboardStats {
  overview: {
    totalRoutes: number
    activeRoutes: number
    totalVehicles: number
    activeVehicles: number
    totalDrivers: number
    activeDrivers: number
    totalPassengers: number
    activePassengers: number
    totalCompanies: number
    activeCompanies: number
  }
  performance: {
    onTimePerformance: number
    averageRating: number
    totalTrips: number
    completedTrips: number
    cancelledTrips: number
    averageTripDuration: number
    totalDistance: number
    fuelEfficiency: number
  }
  alerts: {
    total: number
    critical: number
    warning: number
    info: number
    resolved: number
    pending: number
  }
  financial: {
    totalRevenue: number
    totalCosts: number
    profit: number
    averageTicketPrice: number
    maintenanceCosts: number
    fuelCosts: number
  }
  trends: {
    dailyTrips: Array<{
      date: string
      trips: number
      revenue: number
    }>
    monthlyGrowth: {
      passengers: number
      revenue: number
      trips: number
    }
    popularRoutes: Array<{
      routeId: string
      routeName: string
      trips: number
      passengers: number
      rating: number
    }>
  }
}

interface CompanyStats {
  companyId: string
  companyName: string
  routes: number
  vehicles: number
  drivers: number
  passengers: number
  trips: number
  revenue: number
  rating: number
  onTimePerformance: number
}

interface RouteStats {
  routeId: string
  routeName: string
  totalTrips: number
  completedTrips: number
  cancelledTrips: number
  averagePassengers: number
  averageRating: number
  onTimePerformance: number
  totalRevenue: number
  averageDuration: number
  totalDistance: number
  popularTimes: Array<{
    hour: number
    trips: number
  }>
}

interface DriverStats {
  driverId: string
  driverName: string
  totalTrips: number
  completedTrips: number
  averageRating: number
  onTimePerformance: number
  totalDistance: number
  totalHours: number
  safetyScore: number
  vehicleId?: string
  vehiclePlate?: string
}

interface VehicleStats {
  vehicleId: string
  vehiclePlate: string
  brand: string
  model: string
  totalTrips: number
  totalDistance: number
  averageRating: number
  maintenanceCosts: number
  fuelConsumption: number
  utilizationRate: number
  driverId?: string
  driverName?: string
}

// Mock data - em produção viria do banco de dados
const mockDashboardStats: DashboardStats = {
  overview: {
    totalRoutes: 25,
    activeRoutes: 18,
    totalVehicles: 15,
    activeVehicles: 12,
    totalDrivers: 20,
    activeDrivers: 16,
    totalPassengers: 450,
    activePassengers: 380,
    totalCompanies: 3,
    activeCompanies: 3
  },
  performance: {
    onTimePerformance: 87.5,
    averageRating: 4.6,
    totalTrips: 1250,
    completedTrips: 1180,
    cancelledTrips: 70,
    averageTripDuration: 35,
    totalDistance: 18750,
    fuelEfficiency: 8.5
  },
  alerts: {
    total: 45,
    critical: 3,
    warning: 12,
    info: 25,
    resolved: 35,
    pending: 10
  },
  financial: {
    totalRevenue: 125000,
    totalCosts: 85000,
    profit: 40000,
    averageTicketPrice: 8.50,
    maintenanceCosts: 25000,
    fuelCosts: 35000
  },
  trends: {
    dailyTrips: [
      { date: '2024-01-01', trips: 45, revenue: 382.50 },
      { date: '2024-01-02', trips: 52, revenue: 442.00 },
      { date: '2024-01-03', trips: 48, revenue: 408.00 },
      { date: '2024-01-04', trips: 55, revenue: 467.50 },
      { date: '2024-01-05', trips: 61, revenue: 518.50 },
      { date: '2024-01-06', trips: 38, revenue: 323.00 },
      { date: '2024-01-07', trips: 42, revenue: 357.00 }
    ],
    monthlyGrowth: {
      passengers: 12.5,
      revenue: 15.8,
      trips: 8.3
    },
    popularRoutes: [
      {
        routeId: 'route-1',
        routeName: 'Rota Centro - Shopping',
        trips: 156,
        passengers: 2340,
        rating: 4.7
      },
      {
        routeId: 'route-2',
        routeName: 'Rota Hospitais',
        trips: 203,
        passengers: 1827,
        rating: 4.9
      }
    ]
  }
}

const mockCompanyStats: CompanyStats[] = [
  {
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    routes: 18,
    vehicles: 12,
    drivers: 16,
    passengers: 380,
    trips: 1180,
    revenue: 125000,
    rating: 4.6,
    onTimePerformance: 87.5
  }
]

const mockRouteStats: RouteStats[] = [
  {
    routeId: 'route-1',
    routeName: 'Rota Centro - Shopping',
    totalTrips: 156,
    completedTrips: 148,
    cancelledTrips: 8,
    averagePassengers: 15,
    averageRating: 4.7,
    onTimePerformance: 89.1,
    totalRevenue: 8580,
    averageDuration: 45,
    totalDistance: 2418,
    popularTimes: [
      { hour: 7, trips: 12 },
      { hour: 8, trips: 18 },
      { hour: 17, trips: 15 },
      { hour: 18, trips: 20 }
    ]
  },
  {
    routeId: 'route-2',
    routeName: 'Rota Hospitais',
    totalTrips: 203,
    completedTrips: 198,
    cancelledTrips: 5,
    averagePassengers: 9,
    averageRating: 4.9,
    onTimePerformance: 92.6,
    totalRevenue: 6090,
    averageDuration: 60,
    totalDistance: 4527,
    popularTimes: [
      { hour: 6, trips: 15 },
      { hour: 7, trips: 22 },
      { hour: 14, trips: 18 },
      { hour: 15, trips: 16 }
    ]
  }
]

const mockDriverStats: DriverStats[] = [
  {
    driverId: 'driver-1',
    driverName: 'João Silva',
    totalTrips: 156,
    completedTrips: 148,
    averageRating: 4.8,
    onTimePerformance: 89.1,
    totalDistance: 2418,
    totalHours: 234,
    safetyScore: 95,
    vehicleId: 'vehicle-1',
    vehiclePlate: 'ABC-1234'
  },
  {
    driverId: 'driver-2',
    driverName: 'Maria Santos',
    totalTrips: 203,
    completedTrips: 198,
    averageRating: 4.9,
    onTimePerformance: 92.6,
    totalDistance: 4527,
    totalHours: 305,
    safetyScore: 98,
    vehicleId: 'vehicle-2',
    vehiclePlate: 'DEF-5678'
  }
]

const mockVehicleStats: VehicleStats[] = [
  {
    vehicleId: 'vehicle-1',
    vehiclePlate: 'ABC-1234',
    brand: 'Mercedes-Benz',
    model: 'Sprinter',
    totalTrips: 156,
    totalDistance: 2418,
    averageRating: 4.8,
    maintenanceCosts: 3500,
    fuelConsumption: 284.5,
    utilizationRate: 78.5,
    driverId: 'driver-1',
    driverName: 'João Silva'
  },
  {
    vehicleId: 'vehicle-2',
    vehiclePlate: 'DEF-5678',
    brand: 'Volkswagen',
    model: 'Crafter',
    totalTrips: 203,
    totalDistance: 4527,
    averageRating: 4.9,
    maintenanceCosts: 2800,
    fuelConsumption: 532.4,
    utilizationRate: 85.2,
    driverId: 'driver-2',
    driverName: 'Maria Santos'
  }
]

export const GET = withRoleAuth(['admin', 'operator'], async (request: AuthenticatedRequest): Promise<NextResponse> => {

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'dashboard'
    const companyId = searchParams.get('companyId')
    const routeId = searchParams.get('routeId')
    const driverId = searchParams.get('driverId')
    const vehicleId = searchParams.get('vehicleId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Filtrar por empresa se operador
    const filterByCompany = (data: any[]) => {
      if (request.user.role === 'operator') {
        return data.filter(item => item.companyId === request.user.companyId)
      }
      if (companyId) {
        return data.filter(item => item.companyId === companyId)
      }
      return data
    }

    switch (type) {
      case 'dashboard':
        let dashboardData = mockDashboardStats
        
        // Se operador, filtrar dados por empresa
        if (request.user.role === 'operator') {
          // Ajustar números baseado na empresa
          dashboardData = {
            ...dashboardData,
            overview: {
              ...dashboardData.overview,
              totalRoutes: 18,
              activeRoutes: 15,
              totalVehicles: 12,
              activeVehicles: 10,
              totalDrivers: 16,
              activeDrivers: 14,
              totalPassengers: 380,
              activePassengers: 320,
              totalCompanies: 1,
              activeCompanies: 1
            }
          }
        }
        
        return NextResponse.json(
          createApiResponse(dashboardData, 'Estatísticas do dashboard recuperadas com sucesso')
        )

      case 'companies':
        const { page, limit, skip } = validatePagination(searchParams)
        let companies = mockCompanyStats
        
        if (request.user.role === 'operator') {
          companies = companies.filter(c => c.companyId === request.user.companyId)
        }
        
        const totalCompanies = companies.length
        const paginatedCompanies = companies.slice(skip, skip + limit)
        
        return NextResponse.json(
          createApiResponse({
            companies: paginatedCompanies,
            pagination: {
              page,
              limit,
              total: totalCompanies,
              totalPages: Math.ceil(totalCompanies / limit)
            }
          }, 'Estatísticas das empresas recuperadas com sucesso')
        )

      case 'routes':
        let routes = mockRouteStats
        
        if (routeId) {
          routes = routes.filter(r => r.routeId === routeId)
        }
        
        // Filtrar por empresa (simulado)
        routes = filterByCompany(routes.map(r => ({ ...r, companyId: 'test-company-id' })))
        
        return NextResponse.json(
          createApiResponse(routes, 'Estatísticas das rotas recuperadas com sucesso')
        )

      case 'drivers':
        let drivers = mockDriverStats
        
        if (driverId) {
          drivers = drivers.filter(d => d.driverId === driverId)
        }
        
        // Filtrar por empresa (simulado)
        drivers = filterByCompany(drivers.map(d => ({ ...d, companyId: 'test-company-id' })))
        
        return NextResponse.json(
          createApiResponse(drivers, 'Estatísticas dos motoristas recuperadas com sucesso')
        )

      case 'vehicles':
        let vehicles = mockVehicleStats
        
        if (vehicleId) {
          vehicles = vehicles.filter(v => v.vehicleId === vehicleId)
        }
        
        // Filtrar por empresa (simulado)
        vehicles = filterByCompany(vehicles.map(v => ({ ...v, companyId: 'test-company-id' })))
        
        return NextResponse.json(
          createApiResponse(vehicles, 'Estatísticas dos veículos recuperadas com sucesso')
        )

      case 'performance':
        const performanceData = {
          onTimePerformance: {
            current: 87.5,
            target: 90.0,
            trend: 2.3,
            byRoute: mockRouteStats.map(r => ({
              routeId: r.routeId,
              routeName: r.routeName,
              performance: r.onTimePerformance
            }))
          },
          ratings: {
            overall: 4.6,
            target: 4.5,
            trend: 0.2,
            byCategory: {
              comfort: 4.7,
              punctuality: 4.5,
              safety: 4.8,
              cleanliness: 4.4
            }
          },
          efficiency: {
            fuelEfficiency: 8.5,
            utilizationRate: 81.8,
            maintenanceScore: 92.3
          }
        }
        
        return NextResponse.json(
          createApiResponse(performanceData, 'Estatísticas de performance recuperadas com sucesso')
        )

      case 'financial':
        const financialData = {
          revenue: {
            total: 125000,
            monthly: 41667,
            growth: 15.8,
            bySource: {
              tickets: 95000,
              subscriptions: 25000,
              partnerships: 5000
            }
          },
          costs: {
            total: 85000,
            monthly: 28333,
            breakdown: {
              fuel: 35000,
              maintenance: 25000,
              salaries: 20000,
              insurance: 5000
            }
          },
          profit: {
            total: 40000,
            monthly: 13333,
            margin: 32.0,
            trend: 8.5
          }
        }
        
        return NextResponse.json(
          createApiResponse(financialData, 'Estatísticas financeiras recuperadas com sucesso')
        )

      default:
        throw new ApiError('Tipo de estatística inválido', 400)
    }
})

export const dynamic = 'force-dynamic'
