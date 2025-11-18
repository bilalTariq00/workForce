import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Variation } from '@/lib/models/Variation';
import { z } from 'zod';

/**
 * Validation schema for variation approval
 */
const approveVariationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  commercialNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

/**
 * POST /api/v1/variations/[id]/approve
 * 
 * Approve or reject a variation
 * 
 * Access:
 * - Contracts Managers/HR/Admin only
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

    // Only Contracts Managers, HR, and Admin can approve/reject
    if (!['contracts_manager', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only Contracts Managers can approve/reject variations',
          },
        },
        { status: 403 }
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

    // Can only approve/reject pending variations
    if (!variation.canApprove()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only approve/reject pending variations',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = approveVariationSchema.parse(body);

    // Update variation status
    if (validatedData.action === 'approve') {
      variation.status = 'approved';
      variation.approvedBy = session.user.id;
      variation.approvedAt = new Date();
      variation.commercialNotes = validatedData.commercialNotes || '';
      variation.rejectionReason = undefined;
    } else if (validatedData.action === 'reject') {
      variation.status = 'rejected';
      variation.approvedBy = session.user.id;
      variation.approvedAt = new Date();
      variation.rejectionReason = validatedData.rejectionReason || 'Rejected by Contracts Manager';
      variation.commercialNotes = validatedData.commercialNotes || '';
    }

    await variation.save();

    await variation.populate('siteId', 'name siteCode');
    await variation.populate('siteManagerId', 'firstName lastName employeeId');
    await variation.populate('approvedBy', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: variation,
      message: `Variation ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });

  } catch (error) {
    console.error('Error approving variation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
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
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing variation',
        },
      },
      { status: 500 }
    );
  }
}

