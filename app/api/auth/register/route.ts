import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { handleApiError, validateRequestBody } from '../../middleware'
import type { Database } from '@/lib/supabase'

type UserInsert = Database['public']['Tables']['users']['Insert']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação dos campos obrigatórios
    const validation = validateRequestBody(body, ['email', 'password', 'name', 'role'])
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${validation.missingFields?.join(', ')}` },
        { status: 400 }
      )
    }

    const { email, password, name, role, company_id } = body

    // Validação do role
    const allowedRoles = ['admin', 'operator', 'driver', 'passenger']
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      )
    }

    // Primeiro, cria o usuário no Supabase Auth usando admin client
    const { data: authData, error: authError } = await supabaseServer.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Confirma email automaticamente
    })

    if (authError) {
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário' },
        { status: 400 }
      )
    }

    // Depois, cria o perfil do usuário na tabela users
    const userData = {
      id: authData.user.id,
      email,
      name,
      role,
      company_id: company_id || null
    }
    
    const { error: profileError } = await supabaseServer
      .from('users')
      .insert(userData as any)

    if (profileError) {
      // Se falhar ao criar perfil, remove o usuário do Auth
      await supabaseServer.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { error: `Erro ao criar perfil: ${profileError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: authData.user.id,
        email,
        name,
        role
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}