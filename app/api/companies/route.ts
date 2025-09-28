import { NextRequest, NextResponse } from 'next/server'

// Inline utility functions to bypass import issues
function createApiResponse<T>(data: T, message?: string, total?: number) {
  return {
    success: true,
    data,
    message,
    ...(total !== undefined && { total })
  }
}

function validatePagination(page?: string, limit?: string) {
  const pageNum = Math.max(1, parseInt(page || '1'))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit || '10')))
  const offset = (pageNum - 1) * limitNum
  return { page: pageNum, limit: limitNum, offset }
}

function validateRequiredFields(data: any, fields: string[]) {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`)
  }
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validatePhone(phone: string): boolean {
  return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone)
}

function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export interface Company {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  address: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  contactPerson: {
    name: string
    email: string
    phone: string
    position: string
  }
  subscription: {
    plan: 'basic' | 'premium' | 'enterprise'
    status: 'active' | 'suspended' | 'cancelled'
    startDate: Date
    endDate?: Date
    maxVehicles: number
    maxDrivers: number
  }
  settings: {
    timezone: string
    language: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
    features: {
      realTimeTracking: boolean
      routeOptimization: boolean
      maintenanceAlerts: boolean
      fuelMonitoring: boolean
      driverBehavior: boolean
    }
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// Mock data para desenvolvimento
const mockCompanies: Company[] = [
  {
    id: 'test-company-id',
    name: 'GolfFox Teste',
    cnpj: '12.345.678/0001-90',
    email: 'contato@golffoxtest.com',
    phone: '(11) 3333-4444',
    address: {
      street: 'Av. Paulista',
      number: '1000',
      complement: 'Sala 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    },
    contactPerson: {
      name: 'Carlos Silva',
      email: 'carlos@golffoxtest.com',
      phone: '(11) 99999-0000',
      position: 'Gerente de Operações'
    },
    subscription: {
      plan: 'premium',
      status: 'active',
      startDate: new Date('2024-01-01'),
      maxVehicles: 50,
      maxDrivers: 100
    },
    settings: {
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR',
      notifications: {
        email: true,
        sms: true,
        push: true
      },
      features: {
        realTimeTracking: true,
        routeOptimization: true,
        maintenanceAlerts: true,
        fuelMonitoring: true,
        driverBehavior: true
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    createdBy: 'admin-1'
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
    companyId: 'test-company-id'
  }

  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = validatePagination(
    searchParams.get('page') || undefined,
    searchParams.get('limit') || undefined
  )

    const status = searchParams.get('status')
    const plan = searchParams.get('plan')
    const search = searchParams.get('search')

    let filteredCompanies = [...mockCompanies]

    if (status === 'active') {
      filteredCompanies = filteredCompanies.filter(company => company.isActive)
    } else if (status === 'inactive') {
      filteredCompanies = filteredCompanies.filter(company => !company.isActive)
    }

    if (plan) {
      filteredCompanies = filteredCompanies.filter(company => 
        company.subscription.plan === plan
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCompanies = filteredCompanies.filter(company =>
        company.name.toLowerCase().includes(searchLower) ||
        company.cnpj.includes(search) ||
        company.email.toLowerCase().includes(searchLower)
      )
    }

    const total = filteredCompanies.length
    const paginatedCompanies = filteredCompanies
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)

  return NextResponse.json(
    createApiResponse(paginatedCompanies, 'Empresas recuperadas com sucesso', total)
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
    companyId: 'test-company-id'
  }

  const body = await request.json()
  
  validateRequiredFields(body, [
    'name',
    'cnpj',
    'email',
    'phone',
    'address',
    'contactPerson',
    'subscription'
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

  if (!validateEmail(body.contactPerson.email)) {
    return NextResponse.json(
      { success: false, error: 'Email do contato inválido' },
      { status: 400 }
    )
  }

  // Verificar se CNPJ já existe
  const existingCompany = mockCompanies.find(c => c.cnpj === body.cnpj)
  if (existingCompany) {
    return NextResponse.json(
      { success: false, error: 'CNPJ já cadastrado' },
      { status: 400 }
    )
  }

    const newCompany: Company = {
      id: `company-${Date.now()}`,
      name: sanitizeInput(body.name),
      cnpj: body.cnpj,
      email: body.email.toLowerCase(),
      phone: body.phone,
      address: {
        street: sanitizeInput(body.address.street),
        number: sanitizeInput(body.address.number),
        complement: body.address.complement ? sanitizeInput(body.address.complement) : undefined,
        neighborhood: sanitizeInput(body.address.neighborhood),
        city: sanitizeInput(body.address.city),
        state: body.address.state.toUpperCase(),
        zipCode: body.address.zipCode
      },
      contactPerson: {
        name: sanitizeInput(body.contactPerson.name),
        email: body.contactPerson.email.toLowerCase(),
        phone: body.contactPerson.phone,
        position: sanitizeInput(body.contactPerson.position)
      },
      subscription: {
        plan: body.subscription.plan,
        status: 'active',
        startDate: new Date(),
        endDate: body.subscription.endDate ? new Date(body.subscription.endDate) : undefined,
        maxVehicles: body.subscription.maxVehicles || 10,
        maxDrivers: body.subscription.maxDrivers || 20
      },
      settings: {
        timezone: body.settings?.timezone || 'America/Sao_Paulo',
        language: body.settings?.language || 'pt-BR',
        notifications: {
          email: body.settings?.notifications?.email ?? true,
          sms: body.settings?.notifications?.sms ?? false,
          push: body.settings?.notifications?.push ?? true
        },
        features: {
          realTimeTracking: body.settings?.features?.realTimeTracking ?? true,
          routeOptimization: body.settings?.features?.routeOptimization ?? false,
          maintenanceAlerts: body.settings?.features?.maintenanceAlerts ?? true,
          fuelMonitoring: body.settings?.features?.fuelMonitoring ?? false,
          driverBehavior: body.settings?.features?.driverBehavior ?? false
        }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id
    }

    // TODO: Salvar no banco de dados
    mockCompanies.push(newCompany)

  return NextResponse.json(
    createApiResponse(newCompany, 'Empresa criada com sucesso'),
    { status: 201 }
  )
}
