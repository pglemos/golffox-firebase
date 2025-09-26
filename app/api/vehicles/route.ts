import { NextRequest, NextResponse } from 'next/server';
import { VehiclesService } from '@/services/vehiclesService';
import { withRoleAuth, withAuth, handleApiError, validateRequestBody } from '../middleware';

const vehiclesService = new VehiclesService();

// GET - Listar veículos
export const GET = withAuth(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const companyId = searchParams.get('company_id') || undefined;
    const withDetails = searchParams.get('withDetails') === 'true';

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    let filters: any = {};

    // Aplicar filtros baseados no role
    if (userRole === 'client' || userRole === 'operator') {
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

    let result;

    if (withDetails) {
      const allVehicles = await vehiclesService.findAllWithDetails();
      if (allVehicles.error) {
        return NextResponse.json({ error: allVehicles.error }, { status: 500 });
      }
      
      // Aplicar filtros manualmente
      let filteredData = allVehicles.data || [];
      
      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      result = {
        data: paginatedData,
        count: filteredData.length,
        error: null
      };
    } else {
      const allVehicles = await vehiclesService.findWithFilters(filters);
      if (allVehicles.error) {
        return NextResponse.json({ error: allVehicles.error }, { status: 500 });
      }
      
      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = (allVehicles.data || []).slice(startIndex, endIndex);
      
      result = {
        data: paginatedData,
        count: allVehicles.count || 0,
        error: null
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

// POST - Criar veículo
export const POST = withRoleAuth(['admin', 'operator'])(async (request) => {
  try {
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'plate',
      'brand',
      'model',
      'year',
      'capacity',
      'fuel_type',
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
          { error: 'Não é possível criar veículo para outra empresa' },
          { status: 403 }
        );
      }
    }

    const result = await vehiclesService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Veículo criado com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});