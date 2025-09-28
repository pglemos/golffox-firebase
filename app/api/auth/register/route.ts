import { NextRequest, NextResponse } from 'next/server'
import {
  createApiResponse,
  createErrorResponse,
  withErrorHandling,
  validateRequiredFields,
  validateEmail,
  validatePhone,
  sanitizeInput,
  ApiError
} from '../../middleware'

export interface RegisterRequest {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  role: 'admin' | 'operator' | 'driver'
  companyId?: string
  companyName?: string
  licenseNumber?: string // Para motoristas
  licenseCategory?: string // Para motoristas
}

export interface RegisterResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    companyId?: string
    companyName?: string
    isActive: boolean
    createdAt: Date
  }
  message: string
}

// Mock data para desenvolvimento
const mockUsers: any[] = [
  {
    id: 'test-admin-id',
    email: 'admin@teste.com',
    name: 'Administrador Teste',
    role: 'admin',
    companyId: 'test-company-id',
    companyName: 'GolfFox Teste',
    isActive: true
  }
]

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body: RegisterRequest = await request.json()
    
    validateRequiredFields(body, [
      'name',
      'email',
      'password',
      'confirmPassword',
      'phone',
      'role'
    ])

    // Validações específicas
    if (!validateEmail(body.email)) {
      throw new ApiError('Email inválido', 400)
    }

    if (!validatePhone(body.phone)) {
      throw new ApiError('Telefone inválido. Use o formato (XX) XXXXX-XXXX', 400)
    }

    if (body.password !== body.confirmPassword) {
      throw new ApiError('Senhas não coincidem', 400)
    }

    if (body.password.length < 6) {
      throw new ApiError('Senha deve ter pelo menos 6 caracteres', 400)
    }

    // Verificar se email já existe
    const existingUser = mockUsers.find(u => u.email === body.email.toLowerCase())
    if (existingUser) {
      throw new ApiError('Email já cadastrado', 400)
    }

    // Validações específicas por role
    if (body.role === 'driver') {
      validateRequiredFields(body, ['licenseNumber', 'licenseCategory'])
      
      if (!body.licenseNumber || body.licenseNumber.length < 8) {
        throw new ApiError('Número da CNH inválido', 400)
      }

      const validCategories = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE']
      if (!body.licenseCategory || !validCategories.includes(body.licenseCategory)) {
        throw new ApiError('Categoria da CNH inválida', 400)
      }
    }

    if (body.role !== 'admin' && !body.companyId) {
      throw new ApiError('ID da empresa é obrigatório para este tipo de usuário', 400)
    }

    // Criar novo usuário
    const newUser = {
      id: `user-${Date.now()}`,
      name: sanitizeInput(body.name),
      email: body.email.toLowerCase(),
      phone: body.phone,
      role: body.role,
      companyId: body.companyId,
      companyName: body.companyName,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        ...(body.role === 'driver' && {
          licenseNumber: body.licenseNumber,
          licenseCategory: body.licenseCategory,
          licenseExpiryDate: null, // TODO: Implementar validação de CNH
          medicalCertificateExpiry: null
        })
      }
    }

    // TODO: Implementar criação real com Firebase Auth
    // TODO: Enviar email de verificação
    // TODO: Hash da senha
    
    mockUsers.push(newUser)

    // Resposta sem dados sensíveis
    const userResponse = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      companyId: newUser.companyId,
      companyName: newUser.companyName,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    }

    // TODO: Enviar email de boas-vindas
    // TODO: Notificar administradores da empresa (se aplicável)
    // TODO: Criar entrada no log de auditoria

    return NextResponse.json(
      createApiResponse(
        { user: userResponse },
        'Usuário registrado com sucesso. Verifique seu email para ativar a conta.'
      ),
      { status: 201 }
    )
  })
}

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    // Endpoint para verificar disponibilidade de email
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      throw new ApiError('Email é obrigatório', 400)
    }

    if (!validateEmail(email)) {
      throw new ApiError('Email inválido', 400)
    }

    const existingUser = mockUsers.find(u => u.email === email.toLowerCase())
    const isAvailable = !existingUser

    return NextResponse.json(
      createApiResponse(
        { 
          email: email.toLowerCase(),
          available: isAvailable 
        },
        isAvailable ? 'Email disponível' : 'Email já cadastrado'
      )
    )
  })
}
