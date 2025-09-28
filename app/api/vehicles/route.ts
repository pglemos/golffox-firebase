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

export interface VehicleDocument {
  type: 'registration' | 'insurance' | 'inspection' | 'license' | 'other'
  number: string
  issueDate: Date
  expiryDate: Date
  issuingAuthority?: string
  status: 'valid' | 'expired' | 'pending' | 'suspended'
}

export interface VehicleMaintenance {
  id: string
  type: 'preventive' | 'corrective' | 'emergency'
  description: string
  date: Date
  mileage: number
  cost: number
  provider: string
  nextMaintenanceDate?: Date
  nextMaintenanceMileage?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  chassisNumber: string
  renavam: string
  companyId: string
  companyName: string
  driverId?: string
  driverName?: string
  type: 'bus' | 'van' | 'car' | 'truck' | 'motorcycle'
  fuel: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'ethanol'
  capacity: {
    passengers: number
    wheelchairSpaces?: number
    luggage?: number // em kg
  }
  specifications: {
    engine: string
    transmission: 'manual' | 'automatic'
    airConditioning: boolean
    accessibility: boolean
    gps: boolean
    camera: boolean
    wifi: boolean
  }
  documents: VehicleDocument[]
  maintenance: VehicleMaintenance[]
  status: 'active' | 'inactive' | 'maintenance' | 'repair' | 'inspection'
  location?: {
    lat: number
    lng: number
    address?: string
    lastUpdate: Date
  }
  mileage: {
    current: number
    lastUpdate: Date
  }
  insurance: {
    company: string
    policyNumber: string
    coverage: string[]
    premium: number
    startDate: Date
    endDate: Date
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
  notes?: string
  averageRating?: number
  totalTrips: number
  lastInspection?: Date
  nextInspection?: Date
}

// Mock data - em produção viria do banco de dados
const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    plate: 'ABC-1234',
    brand: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2022,
    color: 'Branco',
    chassisNumber: '9BM906065NB123456',
    renavam: '12345678901',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    driverId: 'driver-1',
    driverName: 'João Silva',
    type: 'van',
    fuel: 'diesel',
    capacity: {
      passengers: 20,
      wheelchairSpaces: 2,
      luggage: 500
    },
    specifications: {
      engine: '2.2 CDI Turbo Diesel',
      transmission: 'manual',
      airConditioning: true,
      accessibility: true,
      gps: true,
      camera: true,
      wifi: false
    },
    documents: [
      {
        type: 'registration',
        number: 'REG123456789',
        issueDate: new Date('2022-01-15'),
        expiryDate: new Date('2025-01-15'),
        issuingAuthority: 'DETRAN-SP',
        status: 'valid'
      },
      {
        type: 'insurance',
        number: 'INS987654321',
        issueDate: new Date('2024-01-01'),
        expiryDate: new Date('2025-01-01'),
        issuingAuthority: 'Seguradora XYZ',
        status: 'valid'
      }
    ],
    maintenance: [
      {
        id: 'maint-1',
        type: 'preventive',
        description: 'Troca de óleo e filtros',
        date: new Date('2024-01-10'),
        mileage: 45000,
        cost: 350.00,
        provider: 'Oficina Central',
        nextMaintenanceDate: new Date('2024-04-10'),
        nextMaintenanceMileage: 50000,
        status: 'completed'
      }
    ],
    status: 'active',
    location: {
      lat: -23.5505,
      lng: -46.6333,
      address: 'Terminal Central - São Paulo, SP',
      lastUpdate: new Date()
    },
    mileage: {
      current: 47500,
      lastUpdate: new Date()
    },
    insurance: {
      company: 'Seguradora XYZ',
      policyNumber: 'POL123456789',
      coverage: ['Danos materiais', 'Danos corporais', 'Roubo/Furto'],
      premium: 2400.00,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01')
    },
    isActive: true,
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date(),
    createdBy: 'admin-1',
    notes: 'Veículo em excelente estado',
    averageRating: 4.8,
    totalTrips: 156,
    lastInspection: new Date('2024-01-05'),
    nextInspection: new Date('2024-07-05')
  },
  {
    id: 'vehicle-2',
    plate: 'DEF-5678',
    brand: 'Volkswagen',
    model: 'Crafter',
    year: 2021,
    color: 'Azul',
    chassisNumber: '9BWZZZ377RP123456',
    renavam: '98765432109',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    driverId: 'driver-2',
    driverName: 'Maria Santos',
    type: 'van',
    fuel: 'diesel',
    capacity: {
      passengers: 15,
      wheelchairSpaces: 4,
      luggage: 400
    },
    specifications: {
      engine: '2.0 TDI',
      transmission: 'automatic',
      airConditioning: true,
      accessibility: true,
      gps: true,
      camera: true,
      wifi: true
    },
    documents: [
      {
        type: 'registration',
        number: 'REG987654321',
        issueDate: new Date('2021-03-20'),
        expiryDate: new Date('2024-03-20'),
        issuingAuthority: 'DETRAN-SP',
        status: 'valid'
      },
      {
        type: 'inspection',
        number: 'INSP123456',
        issueDate: new Date('2024-01-15'),
        expiryDate: new Date('2025-01-15'),
        issuingAuthority: 'INMETRO',
        status: 'valid'
      }
    ],
    maintenance: [
      {
        id: 'maint-2',
        type: 'corrective',
        description: 'Reparo no sistema de freios',
        date: new Date('2024-01-08'),
        mileage: 52000,
        cost: 850.00,
        provider: 'Oficina Especializada',
        status: 'completed'
      }
    ],
    status: 'active',
    location: {
      lat: -23.5520,
      lng: -46.6420,
      address: 'Hospital Central - São Paulo, SP',
      lastUpdate: new Date()
    },
    mileage: {
      current: 53200,
      lastUpdate: new Date()
    },
    insurance: {
      company: 'Seguradora ABC',
      policyNumber: 'POL987654321',
      coverage: ['Danos materiais', 'Danos corporais', 'Assistência 24h'],
      premium: 2800.00,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01')
    },
    isActive: true,
    createdAt: new Date('2021-03-20'),
    updatedAt: new Date(),
    createdBy: 'admin-1',
    notes: 'Veículo adaptado para acessibilidade',
    averageRating: 4.9,
    totalTrips: 203,
    lastInspection: new Date('2024-01-15'),
    nextInspection: new Date('2025-01-15')
  }
]

export const GET = withRoleAuth(['admin', 'operator', 'driver'], async (request: AuthenticatedRequest): Promise<NextResponse> => {

    const { searchParams } = new URL(request.url)
    const { page, limit, skip } = validatePagination(searchParams)
    
    const search = searchParams.get('search')?.toLowerCase()
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const fuel = searchParams.get('fuel')
    const driverId = searchParams.get('driverId')
    const brand = searchParams.get('brand')?.toLowerCase()

    let filteredVehicles = mockVehicles.filter(vehicle => {
      // Filtro por empresa (operadores só veem veículos da sua empresa)
      if (request.user.role === 'operator' && vehicle.companyId !== request.user.companyId) {
        return false
      }
      
      // Motoristas só veem seus próprios veículos
      if (request.user.role === 'driver' && vehicle.driverId !== request.user.id) {
        return false
      }

      return true
    })

    // Aplicar filtros
    if (search) {
      filteredVehicles = filteredVehicles.filter(vehicle =>
        vehicle.plate.toLowerCase().includes(search) ||
        vehicle.brand.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search) ||
        vehicle.driverName?.toLowerCase().includes(search) ||
        vehicle.chassisNumber.toLowerCase().includes(search)
      )
    }

    if (status) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === status)
    }

    if (type) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.type === type)
    }

    if (fuel) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.fuel === fuel)
    }

    if (driverId) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.driverId === driverId)
    }

    if (brand) {
      filteredVehicles = filteredVehicles.filter(vehicle => 
        vehicle.brand.toLowerCase().includes(brand)
      )
    }

    const total = filteredVehicles.length
    const paginatedVehicles = filteredVehicles.slice(skip, skip + limit)

    return NextResponse.json(
      createApiResponse({
        vehicles: paginatedVehicles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, 'Veículos recuperados com sucesso')
    )
})

export const POST = withRoleAuth(['admin', 'operator'], async (request: AuthenticatedRequest): Promise<NextResponse> => {

    const body = await request.json()

    // Validar campos obrigatórios
    validateRequiredFields(body, [
      'plate', 'brand', 'model', 'year', 'color', 'chassisNumber', 
      'renavam', 'type', 'fuel', 'capacity'
    ])

    // Validações específicas
    if (!['bus', 'van', 'car', 'truck', 'motorcycle'].includes(body.type)) {
      throw new ApiError('Tipo de veículo inválido', 400)
    }

    if (!['gasoline', 'diesel', 'electric', 'hybrid', 'ethanol'].includes(body.fuel)) {
      throw new ApiError('Tipo de combustível inválido', 400)
    }

    if (!body.capacity.passengers || body.capacity.passengers < 1) {
      throw new ApiError('Capacidade de passageiros deve ser maior que 0', 400)
    }

    if (body.year < 1900 || body.year > new Date().getFullYear() + 1) {
      throw new ApiError('Ano do veículo inválido', 400)
    }

    // Verificar se placa já existe
    const existingPlate = mockVehicles.find(vehicle => 
      vehicle.plate.toLowerCase() === body.plate.toLowerCase()
    )
    if (existingPlate) {
      throw new ApiError('Já existe um veículo com esta placa', 400)
    }

    // Verificar se chassi já existe
    const existingChassis = mockVehicles.find(vehicle => 
      vehicle.chassisNumber.toLowerCase() === body.chassisNumber.toLowerCase()
    )
    if (existingChassis) {
      throw new ApiError('Já existe um veículo com este chassi', 400)
    }

    // Verificar se RENAVAM já existe
    const existingRenavam = mockVehicles.find(vehicle => 
      vehicle.renavam === body.renavam
    )
    if (existingRenavam) {
      throw new ApiError('Já existe um veículo com este RENAVAM', 400)
    }

    const newVehicle: Vehicle = {
      id: `vehicle-${Date.now()}`,
      plate: body.plate.toUpperCase(),
      brand: sanitizeInput(body.brand),
      model: sanitizeInput(body.model),
      year: parseInt(body.year),
      color: sanitizeInput(body.color),
      chassisNumber: body.chassisNumber.toUpperCase(),
      renavam: body.renavam,
      companyId: request.user.role === 'admin' ? body.companyId || request.user.companyId : request.user.companyId,
      companyName: request.user.companyName,
      driverId: body.driverId,
      driverName: body.driverName,
      type: body.type,
      fuel: body.fuel,
      capacity: {
        passengers: parseInt(body.capacity.passengers),
        wheelchairSpaces: body.capacity.wheelchairSpaces ? parseInt(body.capacity.wheelchairSpaces) : undefined,
        luggage: body.capacity.luggage ? parseInt(body.capacity.luggage) : undefined
      },
      specifications: {
        engine: body.specifications?.engine ? sanitizeInput(body.specifications.engine) : '',
        transmission: body.specifications?.transmission || 'manual',
        airConditioning: Boolean(body.specifications?.airConditioning),
        accessibility: Boolean(body.specifications?.accessibility),
        gps: Boolean(body.specifications?.gps),
        camera: Boolean(body.specifications?.camera),
        wifi: Boolean(body.specifications?.wifi)
      },
      documents: body.documents || [],
      maintenance: [],
      status: 'active',
      location: body.location,
      mileage: {
        current: body.mileage?.current || 0,
        lastUpdate: new Date()
      },
      insurance: body.insurance || {
        company: '',
        policyNumber: '',
        coverage: [],
        premium: 0,
        startDate: new Date(),
        endDate: new Date()
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: request.user.id,
      notes: body.notes ? sanitizeInput(body.notes) : undefined,
      totalTrips: 0
    }

    mockVehicles.push(newVehicle)

    return NextResponse.json(
      createApiResponse(newVehicle, 'Veículo criado com sucesso'),
      { status: 201 }
    )
})

export const dynamic = 'force-dynamic'
