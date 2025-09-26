import { NextRequest, NextResponse } from 'next/server';
import { CompaniesService } from '@/services/companiesService';
import { withRoleAuth, handleApiError, validateRequestBody } from '../../middleware';

const companiesService = new CompaniesService();

// GET - Obter empresa por ID
export const GET = withRoleAuth(['admin', 'operator', 'client'])(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get('withStats') === 'true';

    let result;

    if (withStats) {
      const companies = await companiesService.findAllWithStats();
      result = companies.data?.find(company => company.id === id);
    } else {
      const companyResult = await companiesService.findById(id);
      result = companyResult.data;
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
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

// PUT - Atualizar empresa
export const PUT = withRoleAuth(['admin'])(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();

    // Verificar se a empresa existe
    const existingCompany = await companiesService.findById(id);
    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    const result = await companiesService.update(id, body);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Empresa atualizada com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// DELETE - Excluir empresa
export const DELETE = withRoleAuth(['admin'])(async (
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

    await companiesService.delete(id);

    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});