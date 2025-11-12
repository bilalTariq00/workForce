import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import mongoose from 'mongoose';
import { z } from 'zod';

const approveTimesheetSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/v1/timesheets/[id]/approve
 * 
 * Approve a timesheet
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

    // Only HR and Admin can approve timesheets
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

    const body = await req.json();
    const validatedData = approveTimesheetSchema.parse(body);

    // Approve the timesheet
    await timesheet.approve(session.user.id, validatedData.notes);

    // Populate before returning
    const populatedTimesheet = await Timesheet.findById(timesheet._id)
      .populate('employeeId', 'firstName lastName employeeId email payRate')
      .populate('approvedBy', 'firstName lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedTimesheet,
    });
  } catch (error) {
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

    console.error('Error approving timesheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while approving timesheet',
        },
      },
      { status: 500 }
    );
  }
}

