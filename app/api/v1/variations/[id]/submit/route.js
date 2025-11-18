import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Variation } from '@/lib/models/Variation';

/**
 * POST /api/v1/variations/[id]/submit
 * 
 * Submit a draft variation for approval (change status from draft to pending)
 * 
 * Access:
 * - Site Managers: Can submit their own draft variations
 */
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const variation = await Variation.findById(params.id);

    if (!variation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Variation not found',
          },
        },
        { status: 404 }
      );
    }

    // Only Site Managers can submit variations
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only Site Managers can submit variations',
          },
        },
        { status: 403 }
      );
    }

    // Site Managers can only submit their own variations
    if (variation.siteManagerId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    // Can only submit draft or rejected variations
    if (!variation.canSubmit()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only submit draft or rejected variations',
          },
        },
        { status: 403 }
      );
    }

    // Change status to pending
    variation.status = 'pending';
    await variation.save();

    await variation.populate('siteId', 'name siteCode');
    await variation.populate('siteManagerId', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: variation,
      message: 'Variation submitted for approval',
    });

  } catch (error) {
    console.error('Error submitting variation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while submitting variation',
        },
      },
      { status: 500 }
    );
  }
}

