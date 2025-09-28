import { NextRequest, NextResponse } from 'next/server'

export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'operator' | 'driver' | 'passenger'
  companyId: string
  companyName: string
  isActive: boolean
  lastLogin: Date
  createdAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total?: number
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createApiResponse<T>(
  data?: T,
  message?: string,
  total?: number
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    total
  }
}

export function createErrorResponse(
  error: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error
    },
    { status }
  )
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError('Token de autorização não fornecido', 401)
  }

  const token = authHeader.split('Bearer ')[1]

  // TODO: Implementar verificação real com Firebase Admin
  // Por enquanto, simulando autenticação para desenvolvimento
  if (token === 'test-token-123') {
    return {
      id: 'test-admin-id',
      email: 'admin@teste.com',
      name: 'Administrador Teste',
      role: 'admin',
      companyId: 'test-company-id',
      companyName: 'GolfFox Teste',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date('2024-01-01')
    }
  }

  throw new ApiError('Token inválido', 401)
}

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    throw new ApiError(
      `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
      400
    )
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  return phoneRegex.test(phone)
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export async function withErrorHandling(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    console.error('API Error:', error)
    
    if (error instanceof ApiError) {
      return createErrorResponse(error.message, error.status)
    }
    
    return createErrorResponse('Erro interno do servidor', 500)
  }
}

export function checkPermissions(
  user: AuthenticatedUser,
  requiredRoles: string[]
): void {
  if (!requiredRoles.includes(user.role)) {
    throw new ApiError('Permissões insuficientes', 403)
  }
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser
}

export function validatePagination(
  searchParams: URLSearchParams
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error)
  
  if (error instanceof ApiError) {
    return createErrorResponse(error.message, error.status)
  }
  
  return createErrorResponse('Erro interno do servidor', 500)
}

export function withAuth<T extends any[]>(
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await authenticateRequest(request)
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      return await handler(authenticatedRequest, ...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

export function withRoleAuth<T extends any[]>(
  requiredRoles: string[],
  handler: (request: AuthenticatedRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await authenticateRequest(request)
      checkPermissions(user, requiredRoles)
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user
      return await handler(authenticatedRequest, ...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}