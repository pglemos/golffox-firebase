import { NextRequest, NextResponse } from 'next/server'
import {
  AuthenticatedRequest,
  createApiResponse,
  createErrorResponse,
  withRoleAuth,
  ApiError
} from '../../../middleware'

interface RouteStart {
  routeId: string
  driverId: string
  vehicleId: string
  startTime: Date
  estimatedEndTime: Date
  currentLocation?: {
    lat: number
    lng: number
  }
  status: 'started' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
  passengers: string[]
  notes?: string
}

// Mock data - em produção viria do banco de dados
const mockRouteStarts: RouteStart[] = []

const mockRoutes = [
  {
    id: 'route-1',
    name: 'Rota Centro - Shopping',
    driverId: 'driver-1',
    vehicleId: 'vehicle-1',
    status: 'active',
    companyId: 'test-company-id',
    estimatedDuration: 45
  },
  {
    id: 'route-2',
    name: 'Rota Hospitais',
    driverId: 'driver-2',
    vehicleId: 'vehicle-2',
    status: 'active',
    companyId: 'test-company-id',
    estimatedDuration: 60
  }
]

export const POST = withRoleAuth(['admin', 'operator', 'driver'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id: routeId } = params
  const body = await request.json()

  // Buscar a rota
  const route = mockRoutes.find(r => r.id === routeId)
  
  if (!route) {
    return NextResponse.json(
      createErrorResponse('Rota não encontrada', 404),
      { status: 404 }
    )
  }

  // Verificar permissões
  if (request.user.role === 'operator' && route.companyId !== request.user.companyId) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  if (request.user.role === 'driver' && route.driverId !== request.user.id) {
    return NextResponse.json(
      createErrorResponse('Apenas o motorista designado pode iniciar esta rota', 403),
      { status: 403 }
    )
  }

  // Verificar se a rota já foi iniciada
  const existingStart = mockRouteStarts.find(start => 
    start.routeId === routeId && 
    ['started', 'in_progress', 'paused'].includes(start.status)
  )
  
  if (existingStart) {
    return NextResponse.json(
      createErrorResponse('Rota já foi iniciada', 400),
      { status: 400 }
    )
  }

  // Verificar se o motorista tem outra rota ativa
  const activeRoute = mockRouteStarts.find(start => 
    start.driverId === route.driverId && 
    ['started', 'in_progress', 'paused'].includes(start.status)
  )
  
  if (activeRoute) {
    return NextResponse.json(
      createErrorResponse('Motorista já possui uma rota ativa', 400),
      { status: 400 }
    )
  }

  // Verificar se o veículo está disponível
  const vehicleInUse = mockRouteStarts.find(start => 
    start.vehicleId === route.vehicleId && 
    ['started', 'in_progress', 'paused'].includes(start.status)
  )
  
  if (vehicleInUse) {
    return NextResponse.json(
      createErrorResponse('Veículo já está em uso', 400),
      { status: 400 }
    )
  }

  const startTime = new Date()
  const estimatedEndTime = new Date(startTime.getTime() + route.estimatedDuration * 60000)

  // Criar início de rota
  const routeStart: RouteStart = {
    routeId,
    driverId: route.driverId,
    vehicleId: route.vehicleId,
    startTime,
    estimatedEndTime,
    currentLocation: body.currentLocation ? {
      lat: parseFloat(body.currentLocation.lat),
      lng: parseFloat(body.currentLocation.lng)
    } : undefined,
    status: 'started',
    passengers: body.passengers || [],
    notes: body.notes
  }

  // Simular salvamento no banco
  mockRouteStarts.push(routeStart)

  // Atualizar status da rota
  const routeIndex = mockRoutes.findIndex(r => r.id === routeId)
  if (routeIndex !== -1) {
    mockRoutes[routeIndex] = {
      ...mockRoutes[routeIndex],
      status: 'in_progress' as any
    }
  }

  return NextResponse.json(
    createApiResponse({
      routeStart,
      route: {
        id: route.id,
        name: route.name,
        status: 'in_progress'
      }
    }, 'Rota iniciada com sucesso'),
    { status: 201 }
  )
})

export const GET = withRoleAuth(['admin', 'operator', 'driver'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id: routeId } = params

  // Buscar a rota
  const route = mockRoutes.find(r => r.id === routeId)
  
  if (!route) {
    return NextResponse.json(
      createErrorResponse('Rota não encontrada', 404),
      { status: 404 }
    )
  }

  // Verificar permissões
  if (request.user.role === 'operator' && route.companyId !== request.user.companyId) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  if (request.user.role === 'driver' && route.driverId !== request.user.id) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  // Buscar início da rota ativo
  const routeStart = mockRouteStarts.find(start => 
    start.routeId === routeId && 
    ['started', 'in_progress', 'paused'].includes(start.status)
  )

  if (!routeStart) {
    return NextResponse.json(
      createErrorResponse('Rota não foi iniciada', 404),
      { status: 404 }
    )
  }

  return NextResponse.json(
    createApiResponse({
      routeStart,
      route: {
        id: route.id,
        name: route.name,
        status: route.status
      }
    }, 'Status da rota recuperado com sucesso')
  )
})

export const PUT = withRoleAuth(['admin', 'operator', 'driver'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id: routeId } = params
  const body = await request.json()

  // Buscar a rota
  const route = mockRoutes.find(r => r.id === routeId)
  
  if (!route) {
    return NextResponse.json(
      createErrorResponse('Rota não encontrada', 404),
      { status: 404 }
    )
  }

  // Verificar permissões
  if (request.user.role === 'operator' && route.companyId !== request.user.companyId) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  if (request.user.role === 'driver' && route.driverId !== request.user.id) {
    return NextResponse.json(
      createErrorResponse('Apenas o motorista designado pode atualizar esta rota', 403),
      { status: 403 }
    )
  }

  // Buscar início da rota ativo
  const routeStartIndex = mockRouteStarts.findIndex(start => 
    start.routeId === routeId && 
    ['started', 'in_progress', 'paused'].includes(start.status)
  )

  if (routeStartIndex === -1) {
    return NextResponse.json(
      createErrorResponse('Rota não foi iniciada', 404),
      { status: 404 }
    )
  }

  const routeStart = mockRouteStarts[routeStartIndex]

  // Atualizar dados da rota
  const updatedRouteStart: RouteStart = {
    ...routeStart,
    ...(body.currentLocation && {
      currentLocation: {
        lat: parseFloat(body.currentLocation.lat),
        lng: parseFloat(body.currentLocation.lng)
      }
    }),
    ...(body.status && { status: body.status }),
    ...(body.passengers && { passengers: body.passengers }),
    ...(body.notes && { notes: body.notes })
  }

  // Validar status
  if (body.status && !['started', 'in_progress', 'paused', 'completed', 'cancelled'].includes(body.status)) {
    throw new ApiError('Status inválido', 400)
  }

  // Simular atualização no banco
  mockRouteStarts[routeStartIndex] = updatedRouteStart

  // Se a rota foi completada ou cancelada, atualizar status da rota
  if (body.status === 'completed' || body.status === 'cancelled') {
    const routeIndex = mockRoutes.findIndex(r => r.id === routeId)
    if (routeIndex !== -1) {
      mockRoutes[routeIndex] = {
        ...mockRoutes[routeIndex],
        status: body.status === 'completed' ? 'active' : 'active' as any
      }
    }
  }

  return NextResponse.json(
    createApiResponse({
      routeStart: updatedRouteStart,
      route: {
        id: route.id,
        name: route.name,
        status: route.status
      }
    }, 'Rota atualizada com sucesso')
  )
})

export const dynamic = 'force-dynamic'