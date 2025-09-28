import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateRequest,
  createApiResponse,
  withErrorHandling,
  checkPermissions,
  ApiError
} from '../../../middleware'
import type { Company } from '../../route'

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

export interface ToggleStatusRequest {
  reason?: string
  notifyUsers?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin'])

    const body: ToggleStatusRequest = await request.json()
    
    const companyIndex = mockCompanies.findIndex(c => c.id === params.id)

    if (companyIndex === -1) {
      throw new ApiError('Empresa não encontrada', 404)
    }

    const company = mockCompanies[companyIndex]
    const previousStatus = company.isActive
    const newStatus = !previousStatus

    // Atualizar status da empresa
    const updatedCompany: Company = {
      ...company,
      isActive: newStatus,
      subscription: {
        ...company.subscription,
        status: newStatus ? 'active' : 'suspended'
      },
      updatedAt: new Date()
    }

    mockCompanies[companyIndex] = updatedCompany

    // Log da ação para auditoria
    const actionLog = {
      action: newStatus ? 'activate' : 'deactivate',
      companyId: params.id,
      companyName: company.name,
      performedBy: user.id,
      performedByName: user.name,
      reason: body.reason || 'Não informado',
      timestamp: new Date(),
      previousStatus,
      newStatus
    }

    console.log('Company status toggle:', actionLog)

    // TODO: Implementar notificações se solicitado
    if (body.notifyUsers) {
      // Notificar usuários da empresa sobre a mudança de status
      console.log(`Notifying users of company ${company.name} about status change`)
    }

    // TODO: Implementar outras ações baseadas no status
    if (!newStatus) {
      // Empresa desativada - ações adicionais:
      // - Desativar sessões ativas dos usuários
      // - Pausar rastreamento de veículos
      // - Suspender notificações
      console.log(`Company ${company.name} deactivated - implementing restrictions`)
    } else {
      // Empresa reativada - ações adicionais:
      // - Reativar funcionalidades
      // - Enviar email de boas-vindas
      console.log(`Company ${company.name} reactivated - restoring services`)
    }

    const statusMessage = newStatus ? 'ativada' : 'desativada'
    
    return NextResponse.json(
      createApiResponse(
        {
          company: updatedCompany,
          actionLog,
          statusChanged: true,
          previousStatus,
          newStatus
        },
        `Empresa ${statusMessage} com sucesso`
      )
    )
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const user = await authenticateRequest(request)
    checkPermissions(user, ['admin'])

    const company = mockCompanies.find(c => c.id === params.id)

    if (!company) {
      throw new ApiError('Empresa não encontrada', 404)
    }

    // Retornar informações de status
    const statusInfo = {
      companyId: company.id,
      companyName: company.name,
      isActive: company.isActive,
      subscriptionStatus: company.subscription.status,
      lastUpdated: company.updatedAt,
      canToggle: true, // Pode ser baseado em regras de negócio
      restrictions: company.isActive ? [] : [
        'Rastreamento pausado',
        'Usuários sem acesso',
        'Notificações suspensas'
      ]
    }

    return NextResponse.json(
      createApiResponse(
        statusInfo,
        'Informações de status recuperadas com sucesso'
      )
    )
  })
}