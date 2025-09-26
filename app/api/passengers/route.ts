import { NextRequest, NextResponse } from 'next/server';
import { PassengersService } from '@/services/passengersService';
import { withRoleAuth, withAuth, handleApiError, validateRequestBody } from '../middleware';

const passengersService = new PassengersService();

// GET - Listar passageiros
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const companyId = searchParams.get('company_id') || undefined;
    const routeId = searchParams.get('route_id') || undefined;
    const withDetails = searchParams.get('withDetails') === 'true';

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    let filters: any = {};

    // Aplicar filtros baseados no role
    if (userRole === 'passenger') {
      // Passageiros só podem ver seus próprios dados
      filters.user_id = userId;
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
    if (routeId) filters.route_id = routeId;

    let result;

    if (withDetails) {
      const allPassengers = await passengersService.findAllWithDetails();
      if (allPassengers.error) {
        return NextResponse.json(
          { error: allPassengers.error },
          { status: 500 }
        );
      }

      // Aplicar filtros manualmente
      let filteredData = allPassengers.data;
      
      if (filters.search) {
        filteredData = filteredData.filter(passenger => 
          passenger.name?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          passenger.email?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          passenger.cpf?.includes(filters.search!)
        );
      }
      
      if (filters.status) {
        filteredData = filteredData.filter(passenger => passenger.status === filters.status);
      }
      
      if (filters.route_id) {
        filteredData = filteredData.filter(passenger => 
          passenger.routes?.some(route => route.id === filters.route_id)
        );
      }

      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      result = {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      };
    } else {
      result = await passengersService.findWithFilters(filters);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = result.data.slice(startIndex, endIndex);

      result = {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total: result.data.length,
          totalPages: Math.ceil(result.data.length / limit)
        }
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

// POST - Criar passageiro
export const POST = withRoleAuth(['admin', 'operator', 'client'])(async (request) => {
  try {
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'name',
      'cpf',
      'phone',
      'email',
      'address',
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
    if ((userRole === 'operator' || userRole === 'client')) {
      if (!userCompanyId || body.company_id !== userCompanyId) {
        return NextResponse.json(
          { error: 'Não é possível criar passageiro para outra empresa' },
          { status: 403 }
        );
      }
    }

    const result = await passengersService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Passageiro criado com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});