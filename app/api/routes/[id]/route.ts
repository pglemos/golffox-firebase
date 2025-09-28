import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateRequest,
  createApiResponse,
  withErrorHandling,
  checkPermissions,
  ApiError,
  sanitizeInput
} from '../../middleware'
import type { Route, RouteStop } from '../route'

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
      daysOfWeek: [1, 2, 3, 4, 5],
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
      daysOfWeek: [1, 2, 3, 4, 5, 6],
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator', 'driver'])

    const route = mockRoutes.find(r => {
      if (r.id !== params.id) return false
      
      // Operadores só veem rotas da sua empresa
      if (user.role === 'operator' && r.companyId !== user.companyId) {
        return false
      }
      
      // Motoristas só veem suas próprias rotas
      if (user.role === 'driver' && r.driverId !== user.id) {
        return false
      }
      
      return true
    })

    if (!route) {
      throw new ApiError('Rota não encontrada', 404)
    }

    return NextResponse.json(
      createApiResponse(route, 'Rota recuperada com sucesso')
    )
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator'])

    const body = await request.json()
    
    const routeIndex = mockRoutes.findIndex(r => {
      if (r.id !== params.id) return false
      
      // Operadores só podem editar rotas da sua empresa
      if (user.role === 'operator' && r.companyId !== user.companyId) {
        return false
      }
      
      return true
    })

    if (routeIndex === -1) {
      throw new ApiError('Rota não encontrada', 404)
    }

    const currentRoute = mockRoutes[routeIndex]

    // Validações se campos foram fornecidos
    if (body.stops && (!Array.isArray(body.stops) || body.stops.length < 2)) {
      throw new ApiError('Rota deve ter pelo menos 2 paradas', 400)
    }

    if (body.schedule) {
      if (!body.schedule.startTime || !body.schedule.endTime || !Array.isArray(body.schedule.daysOfWeek)) {
        throw new ApiError('Horário da rota inválido', 400)
      }
    }

    if (body.capacity && (!body.capacity.maxPassengers || body.capacity.maxPassengers < 1)) {
      throw new ApiError('Capacidade máxima deve ser maior que 0', 400)
    }

    if (body.type && !['regular', 'express', 'special', 'emergency'].includes(body.type)) {
      throw new ApiError('Tipo de rota inválido', 400)
    }

    // Verificar se nome já existe em outra rota
    if (body.name && body.name !== currentRoute.name) {
      const existingRoute = mockRoutes.find(route => 
        route.name.toLowerCase() === body.name.toLowerCase() &&
        route.id !== params.id &&
        (user.role === 'admin' || route.companyId === user.companyId)
      )
      if (existingRoute) {
        throw new ApiError('Já existe uma rota com este nome', 400)
      }
    }

    // Processar paradas se fornecidas
    let processedStops: RouteStop[] = currentRoute.stops
    if (body.stops) {
      processedStops = body.stops.map((stop: any, index: number) => ({
        id: stop.id || `stop-${Date.now()}-${index}`,
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
    }

    // Atualizar campos fornecidos
    const updatedRoute: Route = {
      ...currentRoute,
      name: body.name ? sanitizeInput(body.name) : currentRoute.name,
      description: body.description !== undefined ? 
        (body.description ? sanitizeInput(body.description) : undefined) : 
        currentRoute.description,
      driverId: body.driverId !== undefined ? body.driverId : currentRoute.driverId,
      driverName: body.driverName !== undefined ? body.driverName : currentRoute.driverName,
      vehicleId: body.vehicleId !== undefined ? body.vehicleId : currentRoute.vehicleId,
      vehiclePlate: body.vehiclePlate !== undefined ? body.vehiclePlate : currentRoute.vehiclePlate,
      stops: processedStops,
      schedule: body.schedule ? {
        startTime: body.schedule.startTime,
        endTime: body.schedule.endTime,
        daysOfWeek: body.schedule.daysOfWeek,
        frequency: body.schedule.frequency || currentRoute.schedule.frequency
      } : currentRoute.schedule,
      capacity: body.capacity ? {
        maxPassengers: parseInt(body.capacity.maxPassengers),
        currentPassengers: body.capacity.currentPassengers !== undefined ? 
          parseInt(body.capacity.currentPassengers) : currentRoute.capacity.currentPassengers,
        wheelchairSpaces: body.capacity.wheelchairSpaces ? 
          parseInt(body.capacity.wheelchairSpaces) : currentRoute.capacity.wheelchairSpaces
      } : currentRoute.capacity,
      status: body.status || currentRoute.status,
      type: body.type || currentRoute.type,
      estimatedDuration: body.estimatedDuration ? parseInt(body.estimatedDuration) : currentRoute.estimatedDuration,
      distance: body.distance ? parseFloat(body.distance) : currentRoute.distance,
      fare: body.fare ? {
        basePrice: parseFloat(body.fare.basePrice),
        currency: body.fare.currency || 'BRL',
        discounts: body.fare.discounts || currentRoute.fare?.discounts
      } : currentRoute.fare,
      passengers: body.passengers || currentRoute.passengers,
      isActive: body.isActive !== undefined ? body.isActive : currentRoute.isActive,
      updatedAt: new Date(),
      notes: body.notes !== undefined ? 
        (body.notes ? sanitizeInput(body.notes) : undefined) : 
        currentRoute.notes
    }

    mockRoutes[routeIndex] = updatedRoute

    return NextResponse.json(
      createApiResponse(updatedRoute, 'Rota atualizada com sucesso')
    )
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator'])

    const routeIndex = mockRoutes.findIndex(r => {
      if (r.id !== params.id) return false
      
      // Operadores só podem deletar rotas da sua empresa
      if (user.role === 'operator' && r.companyId !== user.companyId) {
        return false
      }
      
      return true
    })

    if (routeIndex === -1) {
      throw new ApiError('Rota não encontrada', 404)
    }

    const route = mockRoutes[routeIndex]

    // Verificar se a rota está em andamento
    if (route.status === 'in_progress') {
      throw new ApiError('Não é possível deletar uma rota em andamento', 400)
    }

    // Em vez de deletar, desativar a rota
    route.isActive = false
    route.status = 'inactive'
    route.updatedAt = new Date()

    return NextResponse.json(
      createApiResponse(route, 'Rota desativada com sucesso')
    )
  })
}

export const dynamic = 'force-dynamic'