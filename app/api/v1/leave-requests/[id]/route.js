import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { LeaveRequest } from '@/lib/models/LeaveRequest';
import mongoose from 'mongoose';

/**
 * GET /api/v1/leave-requests/[id]
 * 
 * Get a single leave request by ID
 * 
 * Access:
 * - Employee: Can see their own request
 * - HR/Admin: Can see any request
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid leave request ID',
          },
        },
        { status: 400 }
      );
    }

    const leaveRequest = await LeaveRequest.findById(params.id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .lean();

    if (!leaveRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Leave request not found',
          },
        },
        { status: 404 }
      );
    }

    // Check access: employees can only see their own requests
    if (
      (session.user.role === 'labour' || session.user.role === 'site_manager') &&
      leaveRequest.employeeId._id.toString() !== session.user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own leave requests',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: leaveRequest,
    });
  } catch (error) {
    console.error('Error fetching leave request:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

