import { NextRequest, NextResponse } from 'next/server';
import { RoutesService } from '@/services/routesService';
import { withRoleAuth, withAuth, handleApiError, validateRequestBody } from '../middleware';

const routesService = new RoutesService();

// GET - Listar rotas
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const companyId = searchParams.get('company_id') || undefined;
    const driverId = searchParams.get('driver_id') || undefined;
    const vehicleId = searchParams.get('vehicle_id') || undefined;
    const withDetails = searchParams.get('withDetails') === 'true';

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    let filters: any = {};

    // Aplicar filtros baseados no role
    if (userRole === 'driver') {
      // Motoristas só podem ver suas próprias rotas
      filters.driver_id = userId;
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
    if (driverId) filters.driver_id = driverId;
    if (vehicleId) filters.vehicle_id = vehicleId;

    let result;

    if (withDetails) {
      const allRoutes = await routesService.findAllWithDetails();
      if (allRoutes.error) {
        return NextResponse.json(
          { error: allRoutes.error },
          { status: 500 }
        );
      }

      // Aplicar filtros manualmente
      let filteredRoutes = allRoutes.data;
      if (filters.company_id) {
        filteredRoutes = filteredRoutes.filter(route => route.company_id === filters.company_id);
      }
      if (filters.driver_id) {
        filteredRoutes = filteredRoutes.filter(route => route.driver_id === filters.driver_id);
      }
      if (filters.vehicle_id) {
        filteredRoutes = filteredRoutes.filter(route => route.vehicle_id === filters.vehicle_id);
      }
      if (filters.status) {
        filteredRoutes = filteredRoutes.filter(route => route.status === filters.status);
      }

      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRoutes = filteredRoutes.slice(startIndex, endIndex);

      result = {
        data: paginatedRoutes,
        count: paginatedRoutes.length,
        totalCount: filteredRoutes.length,
        pagination: {
          page,
          limit,
          total: filteredRoutes.length,
          totalPages: Math.ceil(filteredRoutes.length / limit),
        },
      };
    } else {
      result = await routesService.findWithFilters(filters);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedRoutes = result.data.slice(startIndex, endIndex);

      result = {
        data: paginatedRoutes,
        count: paginatedRoutes.length,
        totalCount: result.data.length,
        pagination: {
          page,
          limit,
          total: result.data.length,
          totalPages: Math.ceil(result.data.length / limit),
        },
      };
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

// POST - Criar rota
export const POST = withRoleAuth(['admin', 'operator'])(async (request) => {
  try {
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'name',
      'origin',
      'destination',
      'departure_time',
      'estimated_duration',
      'days_of_week',
      'company_id'
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

    // Verificar permissões de empresa
    if (userRole === 'operator') {
      if (!userCompanyId || body.company_id !== userCompanyId) {
        return NextResponse.json(
          { error: 'Não é possível criar rota para outra empresa' },
          { status: 403 }
        );
      }
    }

    const result = await routesService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Rota criada com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});