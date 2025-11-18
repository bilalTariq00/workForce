import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Inspection } from '@/lib/models/Inspection';

/**
 * POST /api/v1/inspections/[id]/complete
 * 
 * Mark an inspection as completed
 * 
 * Access:
 * - EHS officers: Can complete their own inspections
 * - HR/Admin: Can complete any inspection
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

    // Only EHS officers, HR, and Admin can complete inspections
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS officers can complete inspections',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    const inspection = await Inspection.findById(params.id);

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inspection not found',
          },
        },
        { status: 404 }
      );
    }

    // EHS officers can only complete their own inspections
    if (session.user.role === 'ehs_officer') {
      if (inspection.inspectorId.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only complete your own inspections',
            },
          },
          { status: 403 }
        );
      }
    }

    // Can only complete draft inspections
    if (!inspection.canEdit()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Inspection is already completed',
          },
        },
        { status: 403 }
      );
    }

    // Mark as completed
    inspection.status = 'completed';
    await inspection.save();

    await inspection.populate('siteId', 'name siteCode');
    await inspection.populate('inspectorId', 'firstName lastName employeeId');
    await inspection.populate('issues.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: inspection,
      message: 'Inspection completed successfully',
    });

  } catch (error) {
    console.error('Error completing inspection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while completing inspection',
        },
      },
      { status: 500 }
    );
  }
}

