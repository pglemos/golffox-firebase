import { NextRequest, NextResponse } from 'next/server';
import { DriversService } from '@/services/driversService';
import { withRoleAuth, withAuth, handleApiError, validateRequestBody } from '../middleware';

const driversService = new DriversService();

// GET - Listar motoristas
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
      
      // Buscar o nome da empresa pelo ID para usar no filtro linked_company
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userCompanyId)
        .single();
        
      if (company) {
        filters.linked_company = company.name;
      }
    } else if (companyId && (userRole === 'admin')) {
      // Para admin, também converter company_id para linked_company
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
        
      if (company) {
        filters.linked_company = company.name;
      }
    }

    if (search) filters.search = search;
    if (status) filters.status = status;

    let result;

    if (withDetails) {
      result = await driversService.findAllWithDetails();
      
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      // Aplicar paginação manual para findAllWithDetails
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
    } else {
      result = await driversService.findWithFilters(filters);
      
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

// POST - Criar motorista
export const POST = withRoleAuth(['admin', 'operator'])(async (request) => {
  try {
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Validar campos obrigatórios
    const validation = validateRequestBody(body, [
      'name',
      'cpf',
      'cnh',
      'cnh_category',
      'cnh_expiry',
      'phone',
      'email',
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
          { error: 'Não é possível criar motorista para outra empresa' },
          { status: 403 }
        );
      }
    }

    const result = await driversService.create(body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Motorista criado com sucesso',
    }, { status: 201 });

  } catch (error) {
    return handleApiError(error);
  }
});