import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import mongoose from 'mongoose';

/**
 * GET /api/v1/timesheets/[id]
 * 
 * Get a single timesheet by ID
 * 
 * Access: HR, Admin (all timesheets), Employees (their own timesheets)
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
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid timesheet ID' } },
        { status: 400 }
      );
    }

    const timesheet = await Timesheet.findById(params.id)
      .populate('employeeId', 'firstName lastName employeeId email payRate')
      .populate('approvedBy', 'firstName lastName')
      .populate('lockedBy', 'firstName lastName')
      .populate('hours.attendanceId', 'signInTime signOutTime hoursWorked')
      .populate('hours.siteId', 'name siteCode')
      .lean();

    if (!timesheet) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 }
      );
    }

    // Check access: Employees can only view their own
    if (
      session.user.role === 'labour' &&
      timesheet.employeeId._id.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    console.error('Error fetching timesheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching timesheet',
        },
      },
      { status: 500 }
    );
  }
}

