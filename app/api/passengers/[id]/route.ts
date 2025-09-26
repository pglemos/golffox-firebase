import { NextRequest, NextResponse } from 'next/server';
import { PassengersService } from '@/services/passengersService';
import { withAuth, withRoleAuth, handleApiError, AuthenticatedRequest } from '../../middleware';

const passengersService = new PassengersService();

// GET - Obter passageiro por ID
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
      const passengers = await passengersService.findAllWithDetails();
      result = passengers.data.find(passenger => passenger.id === id);
      if (!result) {
        return NextResponse.json(
          { error: 'Passageiro não encontrado' },
          { status: 404 }
        );
      }
    } else {
      const passengerResponse = await passengersService.findById(id);
      if (!passengerResponse.data) {
        return NextResponse.json(
          { error: 'Passageiro não encontrado' },
          { status: 404 }
        );
      }
      result = passengerResponse.data;
    }

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    if (userRole === 'passenger' && result.user_id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    if ((userRole === 'client' || userRole === 'operator') && 
        result.company_id !== userCompanyId) {
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

// PUT - Atualizar passageiro
export const PUT = withRoleAuth(['admin', 'operator', 'client'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o passageiro existe
    const existingPassenger = await passengersService.findById(id);
    if (!existingPassenger.data) {
      return NextResponse.json(
        { error: 'Passageiro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões de empresa
    if ((userRole === 'operator' || userRole === 'client') && 
        existingPassenger.data.company_id !== userCompanyId) {
      return NextResponse.json(
        { error: 'Não é possível atualizar passageiro de outra empresa' },
        { status: 403 }
      );
    }

    const result = await passengersService.update(id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Passageiro atualizado com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE - Excluir passageiro
export const DELETE = withRoleAuth(['admin', 'operator'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o passageiro existe
    const existingPassenger = await passengersService.findById(id);
    if (!existingPassenger.data) {
      return NextResponse.json(
        { error: 'Passageiro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões de empresa
    if (userRole === 'operator' && existingPassenger.data.company_id !== userCompanyId) {
      return NextResponse.json(
        { error: 'Não é possível excluir passageiro de outra empresa' },
        { status: 403 }
      );
    }

    await passengersService.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Passageiro excluído com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});