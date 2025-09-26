import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/authService';
import { withAuth, handleApiError } from '../../middleware';

const authService = new AuthService();

export const POST = withAuth(async (request) => {
  try {
    const result = await authService.signOut();

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });

  } catch (error) {
    return handleApiError(error);
  }
});