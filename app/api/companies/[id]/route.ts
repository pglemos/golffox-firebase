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
import type { Company } from '../route'

// Mock data - em produção viria do banco de dados
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    
    // Admins podem ver qualquer empresa, outros usuários só a própria
    if (user.role !== 'admin' && user.companyId !== params.id) {
      throw new ApiError('Acesso negado', 403)
    }

    const company = mockCompanies.find(c => c.id === params.id)

    if (!company) {
      throw new ApiError('Empresa não encontrada', 404)
    }

    return NextResponse.json(
      createApiResponse(company, 'Empresa recuperada com sucesso')
    )
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    
    // Apenas admins podem editar empresas
    checkPermissions(user, ['admin'])

    const body = await request.json()
    
    const companyIndex = mockCompanies.findIndex(c => c.id === params.id)

    if (companyIndex === -1) {
      throw new ApiError('Empresa não encontrada', 404)
    }

    const currentCompany = mockCompanies[companyIndex]

    // Validações se campos foram fornecidos
    if (body.email && !validateEmail(body.email)) {
      throw new ApiError('Email inválido', 400)
    }

    if (body.phone && !validatePhone(body.phone)) {
      throw new ApiError('Telefone inválido', 400)
    }

    if (body.contactPerson?.email && !validateEmail(body.contactPerson.email)) {
      throw new ApiError('Email do contato inválido', 400)
    }

    // Verificar se CNPJ já existe em outra empresa
    if (body.cnpj && body.cnpj !== currentCompany.cnpj) {
      const existingCompany = mockCompanies.find(c => 
        c.cnpj === body.cnpj && c.id !== params.id
      )
      if (existingCompany) {
        throw new ApiError('CNPJ já cadastrado em outra empresa', 400)
      }
    }

    // Atualizar campos fornecidos
    const updatedCompany: Company = {
      ...currentCompany,
      name: body.name ? sanitizeInput(body.name) : currentCompany.name,
      cnpj: body.cnpj || currentCompany.cnpj,
      email: body.email ? body.email.toLowerCase() : currentCompany.email,
      phone: body.phone || currentCompany.phone,
      address: {
        ...currentCompany.address,
        ...(body.address && {
          street: body.address.street ? sanitizeInput(body.address.street) : currentCompany.address.street,
          number: body.address.number ? sanitizeInput(body.address.number) : currentCompany.address.number,
          complement: body.address.complement !== undefined ? 
            (body.address.complement ? sanitizeInput(body.address.complement) : undefined) : 
            currentCompany.address.complement,
          neighborhood: body.address.neighborhood ? sanitizeInput(body.address.neighborhood) : currentCompany.address.neighborhood,
          city: body.address.city ? sanitizeInput(body.address.city) : currentCompany.address.city,
          state: body.address.state ? body.address.state.toUpperCase() : currentCompany.address.state,
          zipCode: body.address.zipCode || currentCompany.address.zipCode
        })
      },
      contactPerson: {
        ...currentCompany.contactPerson,
        ...(body.contactPerson && {
          name: body.contactPerson.name ? sanitizeInput(body.contactPerson.name) : currentCompany.contactPerson.name,
          email: body.contactPerson.email ? body.contactPerson.email.toLowerCase() : currentCompany.contactPerson.email,
          phone: body.contactPerson.phone || currentCompany.contactPerson.phone,
          position: body.contactPerson.position ? sanitizeInput(body.contactPerson.position) : currentCompany.contactPerson.position
        })
      },
      subscription: {
        ...currentCompany.subscription,
        ...(body.subscription && {
          plan: body.subscription.plan || currentCompany.subscription.plan,
          status: body.subscription.status || currentCompany.subscription.status,
          endDate: body.subscription.endDate ? new Date(body.subscription.endDate) : currentCompany.subscription.endDate,
          maxVehicles: body.subscription.maxVehicles ?? currentCompany.subscription.maxVehicles,
          maxDrivers: body.subscription.maxDrivers ?? currentCompany.subscription.maxDrivers
        })
      },
      settings: {
        ...currentCompany.settings,
        ...(body.settings && {
          timezone: body.settings.timezone || currentCompany.settings.timezone,
          language: body.settings.language || currentCompany.settings.language,
          notifications: {
            ...currentCompany.settings.notifications,
            ...body.settings.notifications
          },
          features: {
            ...currentCompany.settings.features,
            ...body.settings.features
          }
        })
      },
      updatedAt: new Date()
    }

    mockCompanies[companyIndex] = updatedCompany

    return NextResponse.json(
      createApiResponse(updatedCompany, 'Empresa atualizada com sucesso')
    )
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin'])

    const companyIndex = mockCompanies.findIndex(c => c.id === params.id)

    if (companyIndex === -1) {
      throw new ApiError('Empresa não encontrada', 404)
    }

    // Em vez de deletar, desativar a empresa
    const company = mockCompanies[companyIndex]
    company.isActive = false
    company.subscription.status = 'cancelled'
    company.updatedAt = new Date()

    return NextResponse.json(
      createApiResponse(company, 'Empresa desativada com sucesso')
    )
  })
}