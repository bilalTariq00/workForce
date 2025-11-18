import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';

/**
 * POST /api/v1/incidents/[id]/close
 * 
 * Close a resolved incident
 * 
 * Access:
 * - EHS officers/HR/Admin only
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

    // Only EHS officers, HR, and Admin can close incidents
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS officers can close incidents',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    const incident = await Incident.findById(params.id);

    if (!incident) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Incident not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only close resolved incidents
    if (!incident.canClose()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only close resolved incidents',
          },
        },
        { status: 403 }
      );
    }

    // Close incident
    incident.status = 'closed';
    incident.closedAt = new Date();
    await incident.save();

    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');
    await incident.populate('assignedTo', 'firstName lastName employeeId');
    await incident.populate('actions.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident closed successfully',
    });

  } catch (error) {
    console.error('Error closing incident:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while closing incident',
        },
      },
      { status: 500 }
    );
  }
}

