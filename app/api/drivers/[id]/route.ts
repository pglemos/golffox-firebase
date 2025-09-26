import { NextRequest, NextResponse } from 'next/server';
import { DriversService } from '@/services/driversService';
import { withAuth, withRoleAuth, handleApiError, AuthenticatedRequest } from '../../middleware';

const driversService = new DriversService();

// GET - Obter motorista por ID
export const GET = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const withDetails = searchParams.get('withDetails') === 'true';

    let result;

    if (withDetails) {
      const drivers = await driversService.findAllWithDetails();
      result = drivers.data.find(driver => driver.id === id);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Motorista não encontrado' },
          { status: 404 }
        );
      }
    } else {
      const driverResponse = await driversService.findById(id);
      if (!driverResponse.data) {
        return NextResponse.json(
          { error: 'Motorista não encontrado' },
          { status: 404 }
        );
      }
      result = driverResponse.data;
    }

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    if ((userRole === 'client' || userRole === 'operator') && 
        result.linked_company !== userCompanyId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT - Atualizar motorista
export const PUT = withRoleAuth(['admin', 'operator'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o motorista existe
    const existingDriver = await driversService.findById(id);
    if (!existingDriver.data) {
      return NextResponse.json(
        { error: 'Motorista não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões de empresa
    if (userRole === 'operator' && existingDriver.data.linked_company !== userCompanyId) {
      return NextResponse.json(
        { error: 'Não é possível atualizar motorista de outra empresa' },
        { status: 403 }
      );
    }

    const result = await driversService.update(id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Motorista atualizado com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE - Excluir motorista
export const DELETE = withRoleAuth(['admin', 'operator'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o motorista existe
    const existingDriver = await driversService.findById(id);
    if (!existingDriver.data) {
      return NextResponse.json(
        { error: 'Motorista não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões de empresa
    if (userRole === 'operator' && existingDriver.data.linked_company !== userCompanyId) {
      return NextResponse.json(
        { error: 'Não é possível excluir motorista de outra empresa' },
        { status: 403 }
      );
    }

    await driversService.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Motorista excluído com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});