import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateRequest,
  createApiResponse,
  withErrorHandling,
  checkPermissions,
  ApiError,
  sanitizeInput
} from '../../middleware'
import type { Vehicle, VehicleDocument, VehicleMaintenance } from '../route'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator', 'driver'])

    const vehicle = mockVehicles.find(v => {
      if (v.id !== params.id) return false
      
      // Operadores só veem veículos da sua empresa
      if (user.role === 'operator' && v.companyId !== user.companyId) {
        return false
      }
      
      // Motoristas só veem seus próprios veículos
      if (user.role === 'driver' && v.driverId !== user.id) {
        return false
      }
      
      return true
    })

    if (!vehicle) {
      throw new ApiError('Veículo não encontrado', 404)
    }

    return NextResponse.json(
      createApiResponse(vehicle, 'Veículo recuperado com sucesso')
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
    
    const vehicleIndex = mockVehicles.findIndex(v => {
      if (v.id !== params.id) return false
      
      // Operadores só podem editar veículos da sua empresa
      if (user.role === 'operator' && v.companyId !== user.companyId) {
        return false
      }
      
      return true
    })

    if (vehicleIndex === -1) {
      throw new ApiError('Veículo não encontrado', 404)
    }

    const currentVehicle = mockVehicles[vehicleIndex]

    // Validações se campos foram fornecidos
    if (body.type && !['bus', 'van', 'car', 'truck', 'motorcycle'].includes(body.type)) {
      throw new ApiError('Tipo de veículo inválido', 400)
    }

    if (body.fuel && !['gasoline', 'diesel', 'electric', 'hybrid', 'ethanol'].includes(body.fuel)) {
      throw new ApiError('Tipo de combustível inválido', 400)
    }

    if (body.capacity?.passengers && body.capacity.passengers < 1) {
      throw new ApiError('Capacidade de passageiros deve ser maior que 0', 400)
    }

    if (body.year && (body.year < 1900 || body.year > new Date().getFullYear() + 1)) {
      throw new ApiError('Ano do veículo inválido', 400)
    }

    if (body.status && !['active', 'inactive', 'maintenance', 'repair', 'inspection'].includes(body.status)) {
      throw new ApiError('Status do veículo inválido', 400)
    }

    // Verificar se placa já existe em outro veículo
    if (body.plate && body.plate !== currentVehicle.plate) {
      const existingPlate = mockVehicles.find(vehicle => 
        vehicle.plate.toLowerCase() === body.plate.toLowerCase() && 
        vehicle.id !== params.id
      )
      if (existingPlate) {
        throw new ApiError('Já existe um veículo com esta placa', 400)
      }
    }

    // Verificar se chassi já existe em outro veículo
    if (body.chassisNumber && body.chassisNumber !== currentVehicle.chassisNumber) {
      const existingChassis = mockVehicles.find(vehicle => 
        vehicle.chassisNumber.toLowerCase() === body.chassisNumber.toLowerCase() && 
        vehicle.id !== params.id
      )
      if (existingChassis) {
        throw new ApiError('Já existe um veículo com este chassi', 400)
      }
    }

    // Verificar se RENAVAM já existe em outro veículo
    if (body.renavam && body.renavam !== currentVehicle.renavam) {
      const existingRenavam = mockVehicles.find(vehicle => 
        vehicle.renavam === body.renavam && 
        vehicle.id !== params.id
      )
      if (existingRenavam) {
        throw new ApiError('Já existe um veículo com este RENAVAM', 400)
      }
    }

    // Atualizar campos fornecidos
    const updatedVehicle: Vehicle = {
      ...currentVehicle,
      plate: body.plate ? body.plate.toUpperCase() : currentVehicle.plate,
      brand: body.brand ? sanitizeInput(body.brand) : currentVehicle.brand,
      model: body.model ? sanitizeInput(body.model) : currentVehicle.model,
      year: body.year ? parseInt(body.year) : currentVehicle.year,
      color: body.color ? sanitizeInput(body.color) : currentVehicle.color,
      chassisNumber: body.chassisNumber ? body.chassisNumber.toUpperCase() : currentVehicle.chassisNumber,
      renavam: body.renavam || currentVehicle.renavam,
      driverId: body.driverId !== undefined ? body.driverId : currentVehicle.driverId,
      driverName: body.driverName !== undefined ? body.driverName : currentVehicle.driverName,
      type: body.type || currentVehicle.type,
      fuel: body.fuel || currentVehicle.fuel,
      capacity: body.capacity ? {
        passengers: parseInt(body.capacity.passengers) || currentVehicle.capacity.passengers,
        wheelchairSpaces: body.capacity.wheelchairSpaces ? 
          parseInt(body.capacity.wheelchairSpaces) : currentVehicle.capacity.wheelchairSpaces,
        luggage: body.capacity.luggage ? 
          parseInt(body.capacity.luggage) : currentVehicle.capacity.luggage
      } : currentVehicle.capacity,
      specifications: body.specifications ? {
        engine: body.specifications.engine ? 
          sanitizeInput(body.specifications.engine) : currentVehicle.specifications.engine,
        transmission: body.specifications.transmission || currentVehicle.specifications.transmission,
        airConditioning: body.specifications.airConditioning !== undefined ? 
          Boolean(body.specifications.airConditioning) : currentVehicle.specifications.airConditioning,
        accessibility: body.specifications.accessibility !== undefined ? 
          Boolean(body.specifications.accessibility) : currentVehicle.specifications.accessibility,
        gps: body.specifications.gps !== undefined ? 
          Boolean(body.specifications.gps) : currentVehicle.specifications.gps,
        camera: body.specifications.camera !== undefined ? 
          Boolean(body.specifications.camera) : currentVehicle.specifications.camera,
        wifi: body.specifications.wifi !== undefined ? 
          Boolean(body.specifications.wifi) : currentVehicle.specifications.wifi
      } : currentVehicle.specifications,
      documents: body.documents || currentVehicle.documents,
      maintenance: body.maintenance || currentVehicle.maintenance,
      status: body.status || currentVehicle.status,
      location: body.location ? {
        ...body.location,
        lastUpdate: new Date()
      } : currentVehicle.location,
      mileage: body.mileage ? {
        current: parseInt(body.mileage.current) || currentVehicle.mileage.current,
        lastUpdate: new Date()
      } : currentVehicle.mileage,
      insurance: body.insurance ? {
        company: body.insurance.company || currentVehicle.insurance.company,
        policyNumber: body.insurance.policyNumber || currentVehicle.insurance.policyNumber,
        coverage: body.insurance.coverage || currentVehicle.insurance.coverage,
        premium: body.insurance.premium ? parseFloat(body.insurance.premium) : currentVehicle.insurance.premium,
        startDate: body.insurance.startDate ? new Date(body.insurance.startDate) : currentVehicle.insurance.startDate,
        endDate: body.insurance.endDate ? new Date(body.insurance.endDate) : currentVehicle.insurance.endDate
      } : currentVehicle.insurance,
      isActive: body.isActive !== undefined ? body.isActive : currentVehicle.isActive,
      updatedAt: new Date(),
      notes: body.notes !== undefined ? 
        (body.notes ? sanitizeInput(body.notes) : undefined) : 
        currentVehicle.notes,
      lastInspection: body.lastInspection ? new Date(body.lastInspection) : currentVehicle.lastInspection,
      nextInspection: body.nextInspection ? new Date(body.nextInspection) : currentVehicle.nextInspection
    }

    mockVehicles[vehicleIndex] = updatedVehicle

    return NextResponse.json(
      createApiResponse(updatedVehicle, 'Veículo atualizado com sucesso')
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

    const vehicleIndex = mockVehicles.findIndex(v => {
      if (v.id !== params.id) return false
      
      // Operadores só podem deletar veículos da sua empresa
      if (user.role === 'operator' && v.companyId !== user.companyId) {
        return false
      }
      
      return true
    })

    if (vehicleIndex === -1) {
      throw new ApiError('Veículo não encontrado', 404)
    }

    const vehicle = mockVehicles[vehicleIndex]

    // Verificar se o veículo está sendo usado
    if (vehicle.status === 'active' && vehicle.driverId) {
      throw new ApiError('Não é possível deletar um veículo que está sendo usado', 400)
    }

    // Em vez de deletar, desativar o veículo
    vehicle.isActive = false
    vehicle.status = 'inactive'
    vehicle.driverId = undefined
    vehicle.driverName = undefined
    vehicle.updatedAt = new Date()

    return NextResponse.json(
      createApiResponse(vehicle, 'Veículo desativado com sucesso')
    )
  })
}

export const dynamic = 'force-dynamic'