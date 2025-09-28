import { NextRequest, NextResponse } from 'next/server'

// Inline utility functions to replace problematic middleware imports
function createApiResponse(data: any, message: string, total?: number) {
  return {
    success: true,
    data,
    message,
    ...(total !== undefined && { total })
  }
}

function validatePagination(page?: string, limit?: string) {
  const pageNum = page ? parseInt(page, 10) : 1
  const limitNum = limit ? parseInt(limit, 10) : 10
  
  if (pageNum < 1) throw new Error('Page must be greater than 0')
  if (limitNum < 1 || limitNum > 100) throw new Error('Limit must be between 1 and 100')
  
  return {
    page: pageNum,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum
  }
}

function validateRequiredFields(body: any, fields: string[]) {
  for (const field of fields) {
    if (!body[field]) {
      throw new Error(`Campo obrigatório: ${field}`)
    }
  }
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export interface Passenger {
  id: string
  name: string
  email: string
  phone: string
  document: {
    type: 'cpf' | 'rg' | 'passport'
    number: string
  }
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
  preferences: {
    notifications: {
      sms: boolean
      email: boolean
      push: boolean
    }
    accessibility: {
      wheelchairAccess: boolean
      visualImpairment: boolean
      hearingImpairment: boolean
      other?: string
    }
  }
  companyId: string
  companyName: string
  isActive: boolean
  lastRideDate?: Date
  totalRides: number
  rating: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Mock data para desenvolvimento
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

export async function GET(request: NextRequest) {
  // Temporary bypass of authentication for testing
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Token de autorização não fornecido' },
      { status: 401 }
    )
  }

  // Add mock user for testing
  const user = {
    id: 'test-user',
    role: 'admin',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste'
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = validatePagination(
    searchParams.get('page') || undefined,
    searchParams.get('limit') || undefined
  )

    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const accessibility = searchParams.get('accessibility')

    let filteredPassengers = mockPassengers.filter(passenger => 
      user.role === 'admin' || passenger.companyId === user.companyId
    )

    if (status === 'active') {
      filteredPassengers = filteredPassengers.filter(p => p.isActive)
    } else if (status === 'inactive') {
      filteredPassengers = filteredPassengers.filter(p => !p.isActive)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredPassengers = filteredPassengers.filter(passenger =>
        passenger.name.toLowerCase().includes(searchLower) ||
        passenger.email.toLowerCase().includes(searchLower) ||
        passenger.phone.includes(search) ||
        passenger.document.number.includes(search)
      )
    }

    if (accessibility === 'wheelchair') {
      filteredPassengers = filteredPassengers.filter(p => 
        p.preferences.accessibility.wheelchairAccess
      )
    } else if (accessibility === 'visual') {
      filteredPassengers = filteredPassengers.filter(p => 
        p.preferences.accessibility.visualImpairment
      )
    } else if (accessibility === 'hearing') {
      filteredPassengers = filteredPassengers.filter(p => 
        p.preferences.accessibility.hearingImpairment
      )
    }

    const total = filteredPassengers.length
    const paginatedPassengers = filteredPassengers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)

  return NextResponse.json(
    createApiResponse(paginatedPassengers, 'Passageiros recuperados com sucesso', total)
  )
}

export async function POST(request: NextRequest) {
  // Temporary bypass of authentication for testing
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Token de autorização não fornecido' },
      { status: 401 }
    )
  }

  // Add mock user for testing
  const user = {
    id: 'test-user',
    role: 'admin',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste'
  }

  const body = await request.json()
  
  validateRequiredFields(body, [
    'name',
    'email',
    'phone',
    'document',
    'address',
    'emergencyContact'
  ])

  // Validações específicas
  if (!validateEmail(body.email)) {
    return NextResponse.json(
      { success: false, error: 'Email inválido' },
      { status: 400 }
    )
  }

  if (!validatePhone(body.phone)) {
    return NextResponse.json(
      { success: false, error: 'Telefone inválido' },
      { status: 400 }
    )
  }

  if (!validatePhone(body.emergencyContact.phone)) {
    return NextResponse.json(
      { success: false, error: 'Telefone do contato de emergência inválido' },
      { status: 400 }
    )
  }

  // Verificar se email já existe
  const existingPassenger = mockPassengers.find(p => 
    p.email === body.email.toLowerCase() && 
    (user.role === 'admin' || p.companyId === user.companyId)
  )
  if (existingPassenger) {
    return NextResponse.json(
      { success: false, error: 'Email já cadastrado' },
      { status: 400 }
    )
  }

  // Verificar se documento já existe
  const existingDocument = mockPassengers.find(p => 
    p.document.number === body.document.number && 
    (user.role === 'admin' || p.companyId === user.companyId)
  )
  if (existingDocument) {
    return NextResponse.json(
      { success: false, error: 'Documento já cadastrado' },
      { status: 400 }
    )
  }

    const newPassenger: Passenger = {
      id: `passenger-${Date.now()}`,
      name: sanitizeInput(body.name),
      email: body.email.toLowerCase(),
      phone: body.phone,
      document: {
        type: body.document.type,
        number: body.document.number
      },
      address: {
        street: sanitizeInput(body.address.street),
        number: sanitizeInput(body.address.number),
        complement: body.address.complement ? sanitizeInput(body.address.complement) : undefined,
        neighborhood: sanitizeInput(body.address.neighborhood),
        city: sanitizeInput(body.address.city),
        state: body.address.state.toUpperCase(),
        zipCode: body.address.zipCode
      },
      emergencyContact: {
        name: sanitizeInput(body.emergencyContact.name),
        phone: body.emergencyContact.phone,
        relationship: sanitizeInput(body.emergencyContact.relationship)
      },
      preferences: {
        notifications: {
          sms: body.preferences?.notifications?.sms ?? true,
          email: body.preferences?.notifications?.email ?? true,
          push: body.preferences?.notifications?.push ?? true
        },
        accessibility: {
          wheelchairAccess: body.preferences?.accessibility?.wheelchairAccess ?? false,
          visualImpairment: body.preferences?.accessibility?.visualImpairment ?? false,
          hearingImpairment: body.preferences?.accessibility?.hearingImpairment ?? false,
          other: body.preferences?.accessibility?.other ? sanitizeInput(body.preferences.accessibility.other) : undefined
        }
      },
      companyId: user.role === 'admin' ? body.companyId || user.companyId : user.companyId,
      companyName: user.companyName,
      isActive: true,
      totalRides: 0,
      rating: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id
    }

    // TODO: Salvar no banco de dados
    mockPassengers.push(newPassenger)

  return NextResponse.json(
    createApiResponse(newPassenger, 'Passageiro criado com sucesso'),
    { status: 201 }
  )
}
