import { NextRequest, NextResponse } from 'next/server'

// Inline utility functions to bypass import issues
function createApiResponse<T>(data: T, message?: string) {
  return {
    success: true,
    data,
    message
  }
}

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'admin' | 'operator' | 'driver' | 'passenger'
  companyId?: string
  companyName?: string
  isActive: boolean
  lastLogin: Date
  createdAt: Date
  permissions?: string[]
  avatar?: string
  phone?: string
  address?: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
    companyId: 'test-company-id',
    companyName: 'Test Company',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date()
  }
  
  // Simular dados completos do perfil baseado no usuário autenticado
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: user.companyName,
    isActive: user.isActive,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    permissions: getUserPermissions(user.role),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`,
    phone: getPhoneByRole(user.role),
    address: 'Endereço de exemplo, 123 - Centro'
  }

  return NextResponse.json({
    success: true,
    data: userProfile,
    message: 'Perfil do usuário recuperado com sucesso'
  })
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin' as const,
    companyId: 'test-company-id',
    companyName: 'Test Company',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date()
  }
  const body = await request.json()
  
  // Campos que podem ser atualizados
  const allowedFields = ['name', 'phone', 'address', 'avatar']
  const updates: Partial<UserProfile> = {}
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field as keyof Pick<UserProfile, 'name' | 'phone' | 'address' | 'avatar'>] = body[field]
    }
  }
  
  // Simular atualização do perfil
  const updatedProfile: UserProfile = {
    id: user.id,
    email: user.email,
    name: updates.name || user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: user.companyName,
    isActive: user.isActive,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    permissions: getUserPermissions(user.role),
    avatar: updates.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`,
    phone: updates.phone || getPhoneByRole(user.role),
    address: updates.address || 'Endereço de exemplo, 123 - Centro'
  }

  return NextResponse.json({
    success: true,
    data: updatedProfile,
    message: 'Perfil atualizado com sucesso'
  })
}

function getUserPermissions(role: string): string[] {
  switch (role) {
    case 'admin':
      return [
        'manage_users',
        'manage_companies',
        'manage_routes',
        'manage_vehicles',
        'manage_drivers',
        'view_reports',
        'manage_alerts',
        'system_settings'
      ]
    case 'operator':
      return [
        'manage_routes',
        'manage_vehicles',
        'manage_drivers',
        'view_reports',
        'manage_alerts'
      ]
    case 'driver':
      return [
        'view_routes',
        'update_route_status',
        'view_vehicle_info',
        'report_issues'
      ]
    case 'passenger':
      return [
        'view_routes',
        'book_trips',
        'view_trip_history',
        'rate_trips'
      ]
    default:
      return []
  }
}

function getPhoneByRole(role: string): string {
  switch (role) {
    case 'admin':
      return '(11) 99999-0001'
    case 'operator':
      return '(11) 99999-0002'
    case 'driver':
      return '(11) 99999-0003'
    case 'passenger':
      return '(11) 99999-0004'
    default:
      return '(11) 99999-0000'
  }
}

export const dynamic = 'force-dynamic'