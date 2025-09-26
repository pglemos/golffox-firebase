import { NextRequest, NextResponse } from 'next/server';
import { CompaniesService } from '@/services/companiesService';
import { withRoleAuth, handleApiError } from '../../../middleware';

const companiesService = new CompaniesService();

// POST - Alternar status da empresa
export const POST = withRoleAuth(['admin'])(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;

    // Verificar se a empresa existe
    const existingCompany = await companiesService.findById(id);
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const result = await companiesService.toggleStatus(id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `Status da empresa ${result.data?.status === 'Ativo' ? 'ativado' : 'desativado'} com sucesso`,
    });

  } catch (error) {
    return handleApiError(error);
  }
});