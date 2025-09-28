import { NextRequest, NextResponse } from 'next/server'
import {
  AuthenticatedRequest,
  createApiResponse,
  withRoleAuth,
  validateRequiredFields,
  validatePagination,
  sanitizeInput,
  ApiError
} from '../middleware'

export interface RouteStop {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  estimatedTime?: string
  order: number
  isPickup: boolean
  isDropoff: boolean
}

export interface Route {
  id: string
  name: string
  description?: string
  companyId: string
  companyName: string
  driverId?: string
  driverName?: string
  vehicleId?: string
  vehiclePlate?: string
  stops: RouteStop[]
  schedule: {
    startTime: string
    endTime: string
    daysOfWeek: number[] // 0-6 (domingo a sábado)
    frequency?: 'daily' | 'weekly' | 'custom'
  }
  capacity: {
    maxPassengers: number
    currentPassengers: number
    wheelchairSpaces?: number
  }
  status: 'active' | 'inactive' | 'in_progress' | 'completed' | 'cancelled'
  type: 'regular' | 'express' | 'special' | 'emergency'
  estimatedDuration: number // em minutos
  distance: number // em quilômetros
  fare?: {
    basePrice: number
    currency: string
    discounts?: {
      student: number
      senior: number
      disabled: number
    }
  }
  passengers: string[] // IDs dos passageiros
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastRun?: Date
  nextRun?: Date
  totalRuns: number
  averageRating?: number
  notes?: string
}

// Mock data - em produção viria do banco de dados
const mockRoutes: Route[] = [
  {
    id: 'route-1',
    name: 'Rota Centro - Shopping',
    description: 'Rota regular conectando o centro da cidade ao shopping principal',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    driverId: 'driver-1',
    driverName: 'João Silva',
    vehicleId: 'vehicle-1',
    vehiclePlate: 'ABC-1234',
    stops: [
      {
        id: 'stop-1',
        name: 'Terminal Central',
        address: 'Praça da Sé, 100 - Centro',
        coordinates: { lat: -23.5505, lng: -46.6333 },
        estimatedTime: '08:00',
        order: 1,
        isPickup: true,
        isDropoff: false
      },
      {
        id: 'stop-2',
        name: 'Estação Metro',
        address: 'Rua XV de Novembro, 500',
        coordinates: { lat: -23.5489, lng: -46.6388 },
        estimatedTime: '08:15',
        order: 2,
        isPickup: true,
        isDropoff: true
      },
      {
        id: 'stop-3',
        name: 'Shopping Center',
        address: 'Av. Paulista, 1000',
        coordinates: { lat: -23.5618, lng: -46.6565 },
        estimatedTime: '08:45',
        order: 3,
        isPickup: false,
        isDropoff: true
      }
    ],
    schedule: {
      startTime: '08:00',
      endTime: '18:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Segunda a sexta
      frequency: 'daily'
    },
    capacity: {
      maxPassengers: 20,
      currentPassengers: 12,
      wheelchairSpaces: 2
    },
    status: 'active',
    type: 'regular',
    estimatedDuration: 45,
    distance: 15.5,
    fare: {
      basePrice: 5.50,
      currency: 'BRL',
      discounts: {
        student: 0.5,
        senior: 0.3,
        disabled: 1.0
      }
    },
    passengers: ['passenger-1', 'passenger-2'],
    isActive: true,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date(),
    createdBy: 'operator-1',
    lastRun: new Date('2024-01-12'),
    nextRun: new Date('2024-01-13T08:00:00'),
    totalRuns: 45,
    averageRating: 4.7,
    notes: 'Rota com alta demanda nos horários de pico'
  },
  {
    id: 'route-2',
    name: 'Rota Hospitais',
    description: 'Rota especial para atendimento a hospitais e clínicas',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    driverId: 'driver-2',
    driverName: 'Maria Santos',
    vehicleId: 'vehicle-2',
    vehiclePlate: 'DEF-5678',
    stops: [
      {
        id: 'stop-4',
        name: 'Hospital Central',
        address: 'Rua da Saúde, 200',
        coordinates: { lat: -23.5520, lng: -46.6420 },
        estimatedTime: '07:00',
        order: 1,
        isPickup: true,
        isDropoff: true
      },
      {
        id: 'stop-5',
        name: 'Clínica Norte',
        address: 'Av. Norte, 800',
        coordinates: { lat: -23.5400, lng: -46.6200 },
        estimatedTime: '07:30',
        order: 2,
        isPickup: true,
        isDropoff: true
      },
      {
        id: 'stop-6',
        name: 'Hospital Sul',
        address: 'Rua Sul, 1500',
        coordinates: { lat: -23.5700, lng: -46.6500 },
        estimatedTime: '08:00',
        order: 3,
        isPickup: true,
        isDropoff: true
      }
    ],
    schedule: {
      startTime: '07:00',
      endTime: '19:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a sábado
      frequency: 'daily'
    },
    capacity: {
      maxPassengers: 15,
      currentPassengers: 8,
      wheelchairSpaces: 4
    },
    status: 'active',
    type: 'special',
    estimatedDuration: 60,
    distance: 22.3,
    fare: {
      basePrice: 3.00,
      currency: 'BRL',
      discounts: {
        student: 0.5,
        senior: 1.0,
        disabled: 1.0
      }
    },
    passengers: ['passenger-3', 'passenger-4'],
    isActive: true,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date(),
    createdBy: 'admin-1',
    lastRun: new Date('2024-01-12'),
    nextRun: new Date('2024-01-13T07:00:00'),
    totalRuns: 62,
    averageRating: 4.9,
    notes: 'Rota prioritária para atendimento médico'
  }
]

export const GET = withRoleAuth(['admin', 'operator', 'driver'], async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = validatePagination(searchParams)
    
    const search = searchParams.get('search')?.toLowerCase()
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const driverId = searchParams.get('driverId')
    const vehicleId = searchParams.get('vehicleId')

    let filteredRoutes = mockRoutes.filter(route => {
      // Filtro por empresa (operadores só veem rotas da sua empresa)
      if (request.user.role === 'operator' && route.companyId !== request.user.companyId) {
        return false
      }
      
      // Motoristas só veem suas próprias rotas
      if (request.user.role === 'driver' && route.driverId !== request.user.id) {
        return false
      }

      return true
    })

    // Aplicar filtros
    if (search) {
      filteredRoutes = filteredRoutes.filter(route =>
        route.name.toLowerCase().includes(search) ||
        route.description?.toLowerCase().includes(search) ||
        route.driverName?.toLowerCase().includes(search) ||
        route.vehiclePlate?.toLowerCase().includes(search)
      )
    }

    if (status) {
      filteredRoutes = filteredRoutes.filter(route => route.status === status)
    }

    if (type) {
      filteredRoutes = filteredRoutes.filter(route => route.type === type)
    }

    if (driverId) {
      filteredRoutes = filteredRoutes.filter(route => route.driverId === driverId)
    }

    if (vehicleId) {
      filteredRoutes = filteredRoutes.filter(route => route.vehicleId === vehicleId)
    }

    const total = filteredRoutes.length
    const paginatedRoutes = filteredRoutes.slice(skip, skip + limit)

    return NextResponse.json(
      createApiResponse({
        routes: paginatedRoutes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Rotas recuperadas com sucesso')
    )
})

export const POST = withRoleAuth(['admin', 'operator'], async (request: AuthenticatedRequest): Promise<NextResponse> => {
    const body = await request.json()

    // Validar campos obrigatórios
    validateRequiredFields(body, [
      'name', 'stops', 'schedule', 'capacity', 'type'
    ])

    // Validações específicas
    if (!Array.isArray(body.stops) || body.stops.length < 2) {
      throw new ApiError('Rota deve ter pelo menos 2 paradas', 400)
    }

    if (!body.schedule.startTime || !body.schedule.endTime || !Array.isArray(body.schedule.daysOfWeek)) {
      throw new ApiError('Horário da rota inválido', 400)
    }

    if (!body.capacity.maxPassengers || body.capacity.maxPassengers < 1) {
      throw new ApiError('Capacidade máxima deve ser maior que 0', 400)
    }

    if (!['regular', 'express', 'special', 'emergency'].includes(body.type)) {
      throw new ApiError('Tipo de rota inválido', 400)
    }

    // Verificar se nome já existe na empresa
    const existingRoute = mockRoutes.find(route => 
      route.name.toLowerCase() === body.name.toLowerCase() &&
      (request.user.role === 'admin' || route.companyId === request.user.companyId)
    )
    if (existingRoute) {
      throw new ApiError('Já existe uma rota com este nome', 400)
    }

    // Processar paradas
    const processedStops: RouteStop[] = body.stops.map((stop: any, index: number) => ({
      id: `stop-${Date.now()}-${index}`,
      name: sanitizeInput(stop.name),
      address: sanitizeInput(stop.address),
      coordinates: {
        lat: parseFloat(stop.coordinates.lat),
        lng: parseFloat(stop.coordinates.lng)
      },
      estimatedTime: stop.estimatedTime,
      order: index + 1,
      isPickup: Boolean(stop.isPickup),
      isDropoff: Boolean(stop.isDropoff)
    }))

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      name: sanitizeInput(body.name),
      description: body.description ? sanitizeInput(body.description) : undefined,
      companyId: request.user.role === 'admin' ? body.companyId || request.user.companyId : request.user.companyId,
      companyName: request.user.companyName,
      driverId: body.driverId,
      driverName: body.driverName,
      vehicleId: body.vehicleId,
      vehiclePlate: body.vehiclePlate,
      stops: processedStops,
      schedule: {
        startTime: body.schedule.startTime,
        endTime: body.schedule.endTime,
        daysOfWeek: body.schedule.daysOfWeek,
        frequency: body.schedule.frequency || 'daily'
      },
      capacity: {
        maxPassengers: parseInt(body.capacity.maxPassengers),
        currentPassengers: 0,
        wheelchairSpaces: body.capacity.wheelchairSpaces ? parseInt(body.capacity.wheelchairSpaces) : undefined
      },
      status: 'active',
      type: body.type,
      estimatedDuration: body.estimatedDuration || 60,
      distance: body.distance || 0,
      fare: body.fare ? {
        basePrice: parseFloat(body.fare.basePrice),
        currency: body.fare.currency || 'BRL',
        discounts: body.fare.discounts
      } : undefined,
      passengers: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: request.user.id,
      totalRuns: 0,
      notes: body.notes ? sanitizeInput(body.notes) : undefined
    }

    mockRoutes.push(newRoute)

    return NextResponse.json(
      createApiResponse(newRoute, 'Rota criada com sucesso'),
      { status: 201 }
    )
})

export const dynamic = 'force-dynamic'
