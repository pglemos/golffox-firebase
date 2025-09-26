import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    company_id?: string;
  };
}

export async function authenticateRequest(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token de autorização não fornecido' }
    }

    const token = authHeader.substring(7)

    // Verificar o token JWT usando o cliente servidor
    const { data: { user }, error } = await supabaseServer.auth.getUser(token)

    if (error || !user) {
      return { success: false, error: 'Token inválido ou expirado' }
    }

    // Buscar dados adicionais do usuário
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, email, name, role, company_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return { success: false, error: 'Usuário não encontrado' }
    }

    // Garantir que userData tem o tipo correto
    const typedUserData = userData as {
      id: string;
      email: string;
      name: string;
      role: string;
      company_id?: string;
    }

    return {
      success: true,
      user: {
        id: typedUserData.id,
        email: typedUserData.email,
        name: typedUserData.name,
        role: typedUserData.role,
        company_id: typedUserData.company_id,
      },
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return { success: false, error: 'Erro interno de autenticação' }
  }
}

export function withAuth(handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await authenticateRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Adicionar dados do usuário à requisição
    (request as AuthenticatedRequest).user = authResult.user;

    return handler(request as AuthenticatedRequest, context);
  };
}

export function withRoleAuth(allowedRoles: string[]) {
  return function (handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context?: any) => {
      const authResult = await authenticateRequest(request);

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error },
          { status: 401 }
        );
      }

      // Adicionar dados do usuário à requisição
      (request as AuthenticatedRequest).user = authResult.user;

      const userRole = authResult.user?.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Acesso negado. Permissões insuficientes.' },
          { status: 403 }
        );
      }

      return handler(request as AuthenticatedRequest, context);
    };
  };
}

export function handleApiError(error: any): NextResponse {
  console.error('Erro na API:', error);

  if (error.code === 'PGRST116') {
    return NextResponse.json(
      { error: 'Recurso não encontrado' },
      { status: 404 }
    );
  }

  if (error.code === '23505') {
    return NextResponse.json(
      { error: 'Dados duplicados. Verifique os campos únicos.' },
      { status: 409 }
    );
  }

  if (error.code === '23503') {
    return NextResponse.json(
      { error: 'Violação de chave estrangeira. Verifique as referências.' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Erro interno do servidor' },
    { status: 500 }
  );
}

export function validateRequestBody(body: any, requiredFields: string[]): {
  isValid: boolean;
  missingFields?: string[];
} {
  const missingFields = requiredFields.filter(field => 
    body[field] === undefined || body[field] === null || body[field] === ''
  );

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}