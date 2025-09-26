import { NextRequest, NextResponse } from 'next/server';
import { AlertsService } from '@/services/alertsService';
import { withRoleAuth, handleApiError, validateRequestBody, AuthenticatedRequest } from '../../../middleware';

const alertsService = new AlertsService();

// POST - Resolver alerta
export const POST = withRoleAuth(['admin', 'operator'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;

    // Verificar se o alerta existe
    const existingAlert = await alertsService.findById(id);
    if (!existingAlert.data) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      );
    }

    // Para operadores, verificar se podem resolver este alerta
    // (a verificação de empresa será feita através do usuário associado ao alerta se necessário)
    if (userRole === 'operator') {
      // Aqui podemos adicionar verificações específicas se necessário
      // Por enquanto, operadores podem resolver qualquer alerta
    }

    const result = await alertsService.markAsRead(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Alerta marcado como lido com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});