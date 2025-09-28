import { NextRequest, NextResponse } from 'next/server'
import {
  AuthenticatedRequest,
  createApiResponse,
  createErrorResponse,
  withRoleAuth,
  validateRequiredFields,
  validateEmail,
  validatePhone,
  sanitizeInput,
  ApiError
} from '../../middleware'

interface Driver {
  id: string
  name: string
  email: string
  phone: string
  licenseNumber: string
  licenseCategory: 'A' | 'B' | 'C' | 'D' | 'E'
  licenseExpiryDate: Date
  isActive: boolean
  linkedCompany: string
  companyName: string
  vehicleId?: string
  vehiclePlate?: string
  rating?: number
  totalTrips?: number
  createdAt: Date
  updatedAt: Date
}

interface UpdateDriverRequest {
  name?: string
  email?: string
  phone?: string
  licenseNumber?: string
  licenseCategory?: 'A' | 'B' | 'C' | 'D' | 'E'
  licenseExpiryDate?: string
  isActive?: boolean
  vehicleId?: string
}

// Mock data - em produção viria do banco de dados
const mockDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'João Silva',
    email: 'joao@teste.com',
    phone: '(11) 99999-1111',
    licenseNumber: 'ABC123456',
    licenseCategory: 'D',
    licenseExpiryDate: new Date('2025-12-31'),
    isActive: true,
    linkedCompany: 'test-company-id',
    companyName: 'GolfFox Teste',
    vehicleId: 'vehicle-1',
    vehiclePlate: 'ABC-1234',
    rating: 4.8,
    totalTrips: 156,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  },
  {
    id: 'driver-2',
    name: 'Maria Santos',
    email: 'maria@teste.com',
    phone: '(11) 99999-2222',
    licenseNumber: 'DEF789012',
    licenseCategory: 'D',
    licenseExpiryDate: new Date('2026-06-30'),
    isActive: true,
    linkedCompany: 'test-company-id',
    companyName: 'GolfFox Teste',
    vehicleId: 'vehicle-2',
    vehiclePlate: 'DEF-5678',
    rating: 4.9,
    totalTrips: 203,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date()
  },
  {
    id: 'driver-3',
    name: 'Carlos Oliveira',
    email: 'carlos@teste.com',
    phone: '(11) 99999-3333',
    licenseNumber: 'GHI345678',
    licenseCategory: 'D',
    licenseExpiryDate: new Date('2025-03-15'),
    isActive: false,
    linkedCompany: 'test-company-id',
    companyName: 'GolfFox Teste',
    rating: 4.5,
    totalTrips: 89,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date()
  }
]

export const GET = withRoleAuth(['admin', 'operator'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id } = params

  const driver = mockDrivers.find(d => d.id === id)
  
  if (!driver) {
    return NextResponse.json(
      createErrorResponse('Motorista não encontrado', 404),
      { status: 404 }
    )
  }

  // Verificar permissão de empresa para operadores
  if (request.user.role === 'operator' && driver.linkedCompany !== request.user.companyId) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  return NextResponse.json(
    createApiResponse(driver, 'Motorista recuperado com sucesso')
  )
})

export const PUT = withRoleAuth(['admin', 'operator'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id } = params
  const body: UpdateDriverRequest = await request.json()

  const driverIndex = mockDrivers.findIndex(d => d.id === id)
  
  if (driverIndex === -1) {
    return NextResponse.json(
      createErrorResponse('Motorista não encontrado', 404),
      { status: 404 }
    )
  }

  const driver = mockDrivers[driverIndex]

  // Verificar permissão de empresa para operadores
  if (request.user.role === 'operator' && driver.linkedCompany !== request.user.companyId) {
    return NextResponse.json(
      createErrorResponse('Acesso negado', 403),
      { status: 403 }
    )
  }

  const {
    name,
    email,
    phone,
    licenseNumber,
    licenseCategory,
    licenseExpiryDate,
    isActive,
    vehicleId
  } = body

  // Validações
  if (email && !validateEmail(email)) {
    throw new ApiError('Formato de email inválido', 400)
  }

  if (phone && !validatePhone(phone)) {
    throw new ApiError('Formato de telefone inválido', 400)
  }

  if (licenseCategory && !['A', 'B', 'C', 'D', 'E'].includes(licenseCategory)) {
    throw new ApiError('Categoria de habilitação inválida', 400)
  }

  if (licenseExpiryDate) {
    const expiryDate = new Date(licenseExpiryDate)
    if (expiryDate <= new Date()) {
      throw new ApiError('Data de vencimento da habilitação deve ser futura', 400)
    }
  }

  // Verificar se email já existe (exceto para o próprio motorista)
  if (email && email !== driver.email) {
    const existingDriverByEmail = mockDrivers.find(d => d.email === email && d.id !== id)
    if (existingDriverByEmail) {
      throw new ApiError('Email já está em uso', 400)
    }
  }

  // Verificar se número da habilitação já existe (exceto para o próprio motorista)
  if (licenseNumber && licenseNumber !== driver.licenseNumber) {
    const existingDriverByLicense = mockDrivers.find(d => d.licenseNumber === licenseNumber && d.id !== id)
    if (existingDriverByLicense) {
      throw new ApiError('Número da habilitação já está em uso', 400)
    }
  }

  // Atualizar motorista
  const updatedDriver: Driver = {
    ...driver,
    ...(name && { name: sanitizeInput(name) }),
    ...(email && { email: email.toLowerCase() }),
    ...(phone && { phone: sanitizeInput(phone) }),
    ...(licenseNumber && { licenseNumber: sanitizeInput(licenseNumber).toUpperCase() }),
    ...(licenseCategory && { licenseCategory }),
    ...(licenseExpiryDate && { licenseExpiryDate: new Date(licenseExpiryDate) }),
    ...(typeof isActive === 'boolean' && { isActive }),
    ...(vehicleId !== undefined && { vehicleId }),
    updatedAt: new Date()
  }

  // Simular atualização no banco
  mockDrivers[driverIndex] = updatedDriver

  return NextResponse.json(
    createApiResponse(updatedDriver, 'Motorista atualizado com sucesso')
  )
})

export const DELETE = withRoleAuth(['admin'], async (request: AuthenticatedRequest, { params }: { params: { id: string } }): Promise<NextResponse> => {
  const { id } = params

  const driverIndex = mockDrivers.findIndex(d => d.id === id)
  
  if (driverIndex === -1) {
    return NextResponse.json(
      createErrorResponse('Motorista não encontrado', 404),
      { status: 404 }
    )
  }

  // Simular remoção do banco
  mockDrivers.splice(driverIndex, 1)

  return NextResponse.json(
    createApiResponse(null, 'Motorista removido com sucesso')
  )
})

export const dynamic = 'force-dynamic'