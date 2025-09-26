import { NextRequest, NextResponse } from 'next/server';
import { AlertsService } from '@/services/alertsService';
import { withAuth, withRoleAuth, handleApiError, AuthenticatedRequest } from '../../middleware';

const alertsService = new AlertsService();

// GET - Obter alerta por ID
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
      const alerts = await alertsService.findAllWithDetails();
      result = alerts.data.find(alert => alert.id === id);
    } else {
      const alertResult = await alertsService.findById(id);
      result = alertResult.data;
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões baseadas no role
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    if ((userRole === 'driver' || userRole === 'passenger') && 
        result.user_id !== userId) {
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

// PUT - Atualizar alerta
export const PUT = withAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    // Verificar se o alerta existe
    const existingAlert = await alertsService.findById(id);
    if (!existingAlert.data) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissões
    const canEdit = 
      userRole === 'admin' ||
      userRole === 'operator' ||
      existingAlert.data.user_id === userId;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Não é possível atualizar este alerta' },
        { status: 403 }
      );
    }

    const result = await alertsService.update(id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Alerta atualizado com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE - Excluir alerta
export const DELETE = withRoleAuth(['admin', 'operator'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o alerta existe
    const existingAlert = await alertsService.findById(id);
    if (!existingAlert) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    // Operadores podem excluir alertas (verificação de empresa pode ser adicionada futuramente)

    await alertsService.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Alerta excluído com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});