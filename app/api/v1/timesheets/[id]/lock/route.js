import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import mongoose from 'mongoose';

/**
 * POST /api/v1/timesheets/[id]/lock
 * 
 * Lock a timesheet for payroll (only approved timesheets can be locked)
 * 
 * Access: HR, Admin only
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

    // Only HR and Admin can lock timesheets
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid timesheet ID' } },
        { status: 400 }
      );
    }

    const timesheet = await Timesheet.findById(params.id);

    if (!timesheet) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 }
      );
    }

    // Lock the timesheet
    await timesheet.lock(session.user.id);

    // Populate before returning
    const populatedTimesheet = await Timesheet.findById(timesheet._id)
      .populate('employeeId', 'firstName lastName employeeId email payRate')
      .populate('lockedBy', 'firstName lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedTimesheet,
    });
  } catch (error) {
    console.error('Error locking timesheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while locking timesheet',
        },
      },
      { status: 500 }
    );
  }
}

