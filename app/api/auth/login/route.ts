import { NextRequest, NextResponse } from 'next/server'
import {
  createApiResponse,
  createErrorResponse,
  withErrorHandling,
  validateRequiredFields,
  validateEmail,
  ApiError
} from '../../middleware'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'operator' | 'driver' | 'passenger'
    companyId?: string
    companyName?: string
    isActive: boolean
    lastLogin: Date
    createdAt: Date
  }
  session: {
    access_token: string
    token_type: string
    expires_in: number
  }
  token: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const body: LoginRequest = await request.json()
    
    // Validar campos obrigatórios
    validateRequiredFields(body, ['email', 'password'])
    
    const { email, password } = body
    
    // Validar formato do email
    if (!validateEmail(email)) {
      throw new ApiError('Formato de email inválido', 400)
    }

    // Por enquanto, vamos simular uma resposta de sucesso para teste
    // TODO: Implementar autenticação real com Firebase Admin
    
    if (email === 'admin@teste.com' && password === '123456') {
      const authUser = {
        id: 'test-admin-id',
        email: email,
        name: 'Administrador Teste',
        role: 'admin' as const,
        companyId: 'test-company-id',
        companyName: 'GolfFox Teste',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date()
      }

      const response: LoginResponse = {
        user: authUser,
        session: {
          access_token: 'test-token-123',
          token_type: 'Bearer',
          expires_in: 3600
        },
        token: 'test-token-123'
      }

      return NextResponse.json(
        createApiResponse(response, 'Login realizado com sucesso')
      )
    } else if (email === 'operator@teste.com' && password === '123456') {
      const authUser = {
        id: 'test-operator-id',
        email: email,
        name: 'Operador Teste',
        role: 'operator' as const,
        companyId: 'test-company-id',
        companyName: 'GolfFox Teste',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date()
      }

      const response: LoginResponse = {
        user: authUser,
        session: {
          access_token: 'test-operator-token-456',
          token_type: 'Bearer',
          expires_in: 3600
        },
        token: 'test-operator-token-456'
      }

      return NextResponse.json(
        createApiResponse(response, 'Login realizado com sucesso')
      )
    } else if (email === 'driver@teste.com' && password === '123456') {
      const authUser = {
        id: 'test-driver-id',
        email: email,
        name: 'Motorista Teste',
        role: 'driver' as const,
        companyId: 'test-company-id',
        companyName: 'GolfFox Teste',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date()
      }

      const response: LoginResponse = {
        user: authUser,
        session: {
          access_token: 'test-driver-token-789',
          token_type: 'Bearer',
          expires_in: 3600
        },
        token: 'test-driver-token-789'
      }

      return NextResponse.json(
        createApiResponse(response, 'Login realizado com sucesso')
      )
    } else {
      throw new ApiError('Credenciais inválidas', 401)
    }
  })
}

export const dynamic = 'force-dynamic'