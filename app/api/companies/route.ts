import { NextRequest, NextResponse } from 'next/server';
import { CompaniesService } from '@/services/companiesService';
import { withRoleAuth, handleApiError, validateRequestBody } from '../middleware';

const companiesService = new CompaniesService();

// GET - Listar empresas
export const GET = withRoleAuth(['admin', 'operator'])(async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const withStats = searchParams.get('withStats') === 'true';

    let result;

    if (withStats) {
      const allCompaniesWithStats = await companiesService.findAllWithStats();
      
      if (allCompaniesWithStats.error) {
        return NextResponse.json(
          { error: allCompaniesWithStats.error },
          { status: 400 }
        );
      }

      let filteredData = allCompaniesWithStats.data || [];
      
      // Aplicar filtros manualmente
      if (search) {
        filteredData = filteredData.filter(company => 
          company.name.toLowerCase().includes(search.toLowerCase()) ||
          company.cnpj.includes(search)
        );
      }
      
      if (status) {
        filteredData = filteredData.filter(company => company.status === status);
      }

      // Aplicar paginação manual
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      result = {
        data: paginatedData,
        error: null,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit)
        }
      };
    } else {
      const filters: any = {};
      if (search) filters.name = search;
      if (status) filters.status = status;

      result = await companiesService.findWithFilters(filters);
      
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Aplicar paginação manual para findWithFilters também
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = (result.data || []).slice(startIndex, endIndex);

      result = {
        data: paginatedData,
        error: null,
        pagination: {
          page,
          limit,
          total: result.data?.length || 0,
          totalPages: Math.ceil((result.data?.length || 0) / limit)
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

// POST - Criar empresa
export const POST = withRoleAuth(['admin'])(async (request) => {
  try {
    const body = await request.json();

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'name',
      'cnpj',
      'email',
      'phone',
      'address'
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

    const result = await companiesService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Empresa criada com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});