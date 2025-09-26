import { NextRequest, NextResponse } from 'next/server';
import { AlertsService } from '@/services/alertsService';
import { withRoleAuth, withAuth, handleApiError, validateRequestBody } from '../middleware';

const alertsService = new AlertsService();

// GET - Listar alertas
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const companyId = searchParams.get('company_id') || undefined;
    const userId = searchParams.get('user_id') || undefined;
    const withDetails = searchParams.get('withDetails') === 'true';

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const currentUserId = request.user?.id;

    let filters: any = {};

    // Aplicar filtros baseados no role
    if (userRole === 'driver' || userRole === 'passenger') {
      // Motoristas e passageiros só podem ver seus próprios alertas
      filters.user_id = currentUserId;
    } else if (userRole === 'client' || userRole === 'operator') {
      if (!userCompanyId) {
        return NextResponse.json(
          { error: 'Usuário não associado a uma empresa' },
          { status: 403 }
        );
      }
      filters.company_id = userCompanyId;
    } else if (companyId && (userRole === 'admin')) {
      filters.company_id = companyId;
    }

    if (search) filters.search = search;
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;
    if (userId && userRole === 'admin') filters.user_id = userId;

    let result;

    if (withDetails) {
      result = await alertsService.findAllWithDetails();
      // Aplicar filtros manualmente se necessário
      if (Object.keys(filters).length > 0) {
        result.data = result.data.filter(alert => {
          if (filters.status && alert.status !== filters.status) return false;
          if (filters.type && alert.type !== filters.type) return false;
          if (filters.priority && alert.priority !== filters.priority) return false;
          if (filters.user_id && alert.user_id !== filters.user_id) return false;
          return true;
        });
      }
      // Aplicar paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      result.data = result.data.slice(startIndex, endIndex);
    } else {
      result = await alertsService.findWithFilters(filters);
      // Aplicar paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      result.data = result.data.slice(startIndex, endIndex);
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// POST - Criar alerta
export const POST = withAuth(async (request) => {
  try {
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'type',
      'priority',
      'title',
      'description'
    ]);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios não fornecidos',
          missingFields: validation.missingFields 
        },
        { status: 400 }
      );
    }

    // Adicionar dados do usuário automaticamente
    body.user_id = userId;
    body.company_id = userCompanyId;

    const result = await alertsService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Alerta criado com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});