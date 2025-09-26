import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/authService';
import { withAuth, handleApiError, validateRequestBody } from '../../middleware';

const authService = new AuthService();

// GET - Obter perfil do usuário
export const GET = withAuth(async (request) => {
  try {
    const user = request.user;

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 400 }
      );
    }

    // O middleware já fornece os dados do usuário completos
    return NextResponse.json({
      success: true,
      data: user,
    });

  } catch (error) {
    return handleApiError(error);
  }
});

// PUT - Atualizar perfil do usuário
export const PUT = withAuth(async (request) => {
  try {
    const userId = request.user?.id;
    const body = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não encontrado' },
        { status: 400 }
      );
    }

    // Campos permitidos para atualização
    const allowedFields = ['name', 'phone', 'cpf', 'avatar_url'];
    const updateData: any = {};

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo válido fornecido para atualização' },
        { status: 400 }
      );
    }

    const result = await authService.updateProfile(updateData);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso'
    });

  } catch (error) {
    return handleApiError(error);
  }
});