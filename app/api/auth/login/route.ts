import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { handleApiError, validateRequestBody } from '../../middleware'
import type { Database } from '@/lib/supabase'

type UserRow = Database['public']['Tables']['users']['Row']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validação dos campos obrigatórios
    const validation = validateRequestBody(body, ['email', 'password'])
    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Campos obrigatórios ausentes: ${validation.missingFields?.join(', ')}` },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Realizar login usando o cliente servidor
    const { data: authData, error: authError } = await supabaseServer.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json(
        { error: `Erro de autenticação: ${authError.message}` },
        { status: 401 }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Falha na autenticação' },
        { status: 401 }
      )
    }

    // Buscar dados completos do usuário
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single() as { data: UserRow | null, error: any }

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}