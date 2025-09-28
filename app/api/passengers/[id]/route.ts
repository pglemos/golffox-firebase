import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateRequest,
  createApiResponse,
  withErrorHandling,
  checkPermissions,
  ApiError,
  validateEmail,
  validatePhone,
  sanitizeInput
} from '../../middleware'
import type { Passenger } from '../route'

// Mock data - em produção viria do banco de dados
const mockPassengers: Passenger[] = [
  {
    id: 'passenger-1',
    name: 'Ana Silva',
    email: 'ana@teste.com',
    phone: '(11) 99999-1111',
    document: {
      type: 'cpf',
      number: '123.456.789-00'
    },
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    },
    emergencyContact: {
      name: 'João Silva',
      phone: '(11) 98888-7777',
      relationship: 'Esposo'
    },
    preferences: {
      notifications: {
        sms: true,
        email: true,
        push: true
      },
      accessibility: {
        wheelchairAccess: false,
        visualImpairment: false,
        hearingImpairment: false
      }
    },
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    isActive: true,
    lastRideDate: new Date('2024-01-10'),
    totalRides: 25,
    rating: 4.8,
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date(),
    createdBy: 'operator-1'
  },
  {
    id: 'passenger-2',
    name: 'Carlos Santos',
    email: 'carlos@teste.com',
    phone: '(11) 99999-2222',
    document: {
      type: 'cpf',
      number: '987.654.321-00'
    },
    address: {
      street: 'Av. Principal',
      number: '456',
      neighborhood: 'Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02345-678'
    },
    emergencyContact: {
      name: 'Maria Santos',
      phone: '(11) 97777-6666',
      relationship: 'Mãe'
    },
    preferences: {
      notifications: {
        sms: false,
        email: true,
        push: true
      },
      accessibility: {
        wheelchairAccess: true,
        visualImpairment: false,
        hearingImpairment: false,
        other: 'Necessita de rampa de acesso'
      }
    },
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    isActive: true,
    lastRideDate: new Date('2024-01-12'),
    totalRides: 42,
    rating: 4.9,
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date(),
    createdBy: 'operator-1'
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin', 'operator'])

    const passenger = mockPassengers.find(p => 
      p.id === params.id && 
      (user.role === 'admin' || p.companyId === user.companyId)
    )

    if (!passenger) {
      throw new ApiError('Passageiro não encontrado', 404)
    }

    return NextResponse.json(
      createApiResponse(passenger, 'Passageiro recuperado com sucesso')
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
    
    const passengerIndex = mockPassengers.findIndex(p => 
      p.id === params.id && 
      (user.role === 'admin' || p.companyId === user.companyId)
    )

    if (passengerIndex === -1) {
      throw new ApiError('Passageiro não encontrado', 404)
    }

    const currentPassenger = mockPassengers[passengerIndex]

    // Validações se campos foram fornecidos
    if (body.email && !validateEmail(body.email)) {
      throw new ApiError('Email inválido', 400)
    }

    if (body.phone && !validatePhone(body.phone)) {
      throw new ApiError('Telefone inválido', 400)
    }

    if (body.emergencyContact?.phone && !validatePhone(body.emergencyContact.phone)) {
      throw new ApiError('Telefone do contato de emergência inválido', 400)
    }

    // Verificar se email já existe em outro passageiro
    if (body.email && body.email !== currentPassenger.email) {
      const existingPassenger = mockPassengers.find(p => 
        p.email === body.email.toLowerCase() && 
        p.id !== params.id &&
        (user.role === 'admin' || p.companyId === user.companyId)
      )
      if (existingPassenger) {
        throw new ApiError('Email já cadastrado em outro passageiro', 400)
      }
    }

    // Verificar se documento já existe em outro passageiro
    if (body.document?.number && body.document.number !== currentPassenger.document.number) {
      const existingDocument = mockPassengers.find(p => 
        p.document.number === body.document.number && 
        p.id !== params.id &&
        (user.role === 'admin' || p.companyId === user.companyId)
      )
      if (existingDocument) {
        throw new ApiError('Documento já cadastrado em outro passageiro', 400)
      }
    }

    // Atualizar campos fornecidos
    const updatedPassenger: Passenger = {
      ...currentPassenger,
      name: body.name ? sanitizeInput(body.name) : currentPassenger.name,
      email: body.email ? body.email.toLowerCase() : currentPassenger.email,
      phone: body.phone || currentPassenger.phone,
      document: {
        type: body.document?.type || currentPassenger.document.type,
        number: body.document?.number || currentPassenger.document.number
      },
      address: {
        ...currentPassenger.address,
        ...(body.address && {
          street: body.address.street ? sanitizeInput(body.address.street) : currentPassenger.address.street,
          number: body.address.number ? sanitizeInput(body.address.number) : currentPassenger.address.number,
          complement: body.address.complement !== undefined ? 
            (body.address.complement ? sanitizeInput(body.address.complement) : undefined) : 
            currentPassenger.address.complement,
          neighborhood: body.address.neighborhood ? sanitizeInput(body.address.neighborhood) : currentPassenger.address.neighborhood,
          city: body.address.city ? sanitizeInput(body.address.city) : currentPassenger.address.city,
          state: body.address.state ? body.address.state.toUpperCase() : currentPassenger.address.state,
          zipCode: body.address.zipCode || currentPassenger.address.zipCode
        })
      },
      emergencyContact: {
        ...currentPassenger.emergencyContact,
        ...(body.emergencyContact && {
          name: body.emergencyContact.name ? sanitizeInput(body.emergencyContact.name) : currentPassenger.emergencyContact.name,
          phone: body.emergencyContact.phone || currentPassenger.emergencyContact.phone,
          relationship: body.emergencyContact.relationship ? sanitizeInput(body.emergencyContact.relationship) : currentPassenger.emergencyContact.relationship
        })
      },
      preferences: {
        notifications: {
          ...currentPassenger.preferences.notifications,
          ...body.preferences?.notifications
        },
        accessibility: {
          ...currentPassenger.preferences.accessibility,
          ...body.preferences?.accessibility,
          other: body.preferences?.accessibility?.other ? sanitizeInput(body.preferences.accessibility.other) : currentPassenger.preferences.accessibility.other
        }
      },
      isActive: body.isActive !== undefined ? body.isActive : currentPassenger.isActive,
      updatedAt: new Date()
    }

    mockPassengers[passengerIndex] = updatedPassenger

    return NextResponse.json(
      createApiResponse(updatedPassenger, 'Passageiro atualizado com sucesso')
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

    const passengerIndex = mockPassengers.findIndex(p => 
      p.id === params.id && 
      (user.role === 'admin' || p.companyId === user.companyId)
    )

    if (passengerIndex === -1) {
      throw new ApiError('Passageiro não encontrado', 404)
    }

    // Em vez de deletar, desativar o passageiro
    const passenger = mockPassengers[passengerIndex]
    passenger.isActive = false
    passenger.updatedAt = new Date()

    return NextResponse.json(
      createApiResponse(passenger, 'Passageiro desativado com sucesso')
    )
  })
}