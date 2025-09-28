import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateRequest,
  createApiResponse,
  withErrorHandling,
  checkPermissions,
  ApiError,
  sanitizeInput
} from '../../../middleware'
import type { Route } from '../../route'

interface FinishRouteRequest {
  endTime?: string
  actualDuration?: number
  actualDistance?: number
  passengersDropped?: string[]
  notes?: string
  rating?: number
  incidents?: {
    type: 'delay' | 'breakdown' | 'accident' | 'weather' | 'other'
    description: string
    time: string
  }[]
}

interface FinishRouteResponse {
  route: Route
  summary: {
    plannedDuration: number
    actualDuration: number
    plannedDistance: number
    actualDistance: number
    passengersTransported: number
    onTimePerformance: boolean
    rating?: number
  }
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
      daysOfWeek: [1, 2, 3, 4, 5],
      frequency: 'daily'
    },
    capacity: {
      maxPassengers: 20,
      currentPassengers: 12,
      wheelchairSpaces: 2
    },
    status: 'in_progress',
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
  }
]

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator', 'driver'])

    const body: FinishRouteRequest = await request.json()
    
    const routeIndex = mockRoutes.findIndex(r => {
      if (r.id !== params.id) return false
      
      // Operadores só podem finalizar rotas da sua empresa
      if (user.role === 'operator' && r.companyId !== user.companyId) {
        return false
      }
      
      // Motoristas só podem finalizar suas próprias rotas
      if (user.role === 'driver' && r.driverId !== user.id) {
        return false
      }
      
      return true
    })

    if (routeIndex === -1) {
      throw new ApiError('Rota não encontrada', 404)
    }

    const route = mockRoutes[routeIndex]

    // Verificar se a rota está em andamento
    if (route.status !== 'in_progress') {
      throw new ApiError('Apenas rotas em andamento podem ser finalizadas', 400)
    }

    // Validações
    if (body.rating && (body.rating < 1 || body.rating > 5)) {
      throw new ApiError('Avaliação deve estar entre 1 e 5', 400)
    }

    if (body.actualDuration && body.actualDuration < 0) {
      throw new ApiError('Duração real deve ser positiva', 400)
    }

    if (body.actualDistance && body.actualDistance < 0) {
      throw new ApiError('Distância real deve ser positiva', 400)
    }

    // Calcular dados da finalização
    const actualDuration = body.actualDuration || route.estimatedDuration
    const actualDistance = body.actualDistance || route.distance
    const passengersTransported = body.passengersDropped?.length || route.passengers.length
    const onTimePerformance = actualDuration <= route.estimatedDuration * 1.1 // 10% de tolerância

    // Atualizar rota
    const updatedRoute: Route = {
      ...route,
      status: 'completed',
      capacity: {
        ...route.capacity,
        currentPassengers: 0 // Resetar passageiros atuais
      },
      lastRun: new Date(),
      totalRuns: route.totalRuns + 1,
      averageRating: body.rating ? 
        ((route.averageRating || 0) * route.totalRuns + body.rating) / (route.totalRuns + 1) :
        route.averageRating,
      updatedAt: new Date(),
      notes: body.notes ? sanitizeInput(body.notes) : route.notes
    }

    // Calcular próxima execução baseada na programação
    const now = new Date()
    const nextRun = new Date(now)
    nextRun.setDate(nextRun.getDate() + 1) // Próximo dia por padrão
    
    // Ajustar para o próximo dia da semana válido
    while (!route.schedule.daysOfWeek.includes(nextRun.getDay())) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
    
    // Definir horário
    const [hours, minutes] = route.schedule.startTime.split(':')
    nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    updatedRoute.nextRun = nextRun

    mockRoutes[routeIndex] = updatedRoute

    // Preparar resposta com resumo
    const summary = {
      plannedDuration: route.estimatedDuration,
      actualDuration,
      plannedDistance: route.distance,
      actualDistance,
      passengersTransported,
      onTimePerformance,
      rating: body.rating
    }

    const response: FinishRouteResponse = {
      route: updatedRoute,
      summary
    }

    return NextResponse.json(
      createApiResponse(response, 'Rota finalizada com sucesso')
    )
  })
}

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

    // Verificar se a rota pode ser finalizada
    const canFinish = route.status === 'in_progress'
    
    // Calcular estimativas para finalização
    const estimatedFinishTime = new Date()
    estimatedFinishTime.setMinutes(estimatedFinishTime.getMinutes() + route.estimatedDuration)

    const finishInfo = {
      canFinish,
      currentStatus: route.status,
      estimatedFinishTime: canFinish ? estimatedFinishTime : null,
      currentPassengers: route.capacity.currentPassengers,
      estimatedDuration: route.estimatedDuration,
      estimatedDistance: route.distance
    }

    return NextResponse.json(
      createApiResponse(finishInfo, 'Informações de finalização recuperadas com sucesso')
    )
  })
}

export const dynamic = 'force-dynamic'