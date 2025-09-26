import { NextRequest, NextResponse } from 'next/server';
import { RoutesService } from '@/services/routesService';
import { withRoleAuth, handleApiError, AuthenticatedRequest } from '../../../middleware';

const routesService = new RoutesService();

// POST - Iniciar rota
export const POST = withRoleAuth(['admin', 'operator', 'driver'])(async (
  request: AuthenticatedRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const userRole = request.user?.role;
    const userCompanyId = request.user?.company_id;
    const userId = request.user?.id;

    // Verificar se a rota existe
    const existingRoute = await routesService.findById(id);
    if (!existingRoute.data) {
      return NextResponse.json(
        { error: 'Rota não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissões
    const canStart = 
      userRole === 'admin' ||
      (userRole === 'operator' && existingRoute.data.company_id === userCompanyId) ||
      (userRole === 'driver' && existingRoute.data.driver_id === userId);

    if (!canStart) {
      return NextResponse.json(
        { error: 'Não é possível iniciar esta rota' },
        { status: 403 }
      );
    }

    const result = await routesService.startRoute(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Rota iniciada com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});