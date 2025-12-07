import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { searchAddressSuggestions } from '@/lib/utils/geocoding';
import { z } from 'zod';

const autocompleteSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters'),
  limit: z.number().min(1).max(10).optional().default(5),
});

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR, Admin, and Site Managers can use autocomplete
    if (
      session.user.role !== 'hr_officer' &&
      session.user.role !== 'admin' &&
      session.user.role !== 'site_manager'
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit'), 10) : 5;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const validatedData = autocompleteSchema.parse({ query: query.trim(), limit });
    const suggestions = await searchAddressSuggestions(validatedData.query, validatedData.limit);

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('Autocomplete API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AUTOCOMPLETE_ERROR',
          message: error.message || 'Failed to get address suggestions',
        },
      },
      { status: 500 }
    );
  }
}


