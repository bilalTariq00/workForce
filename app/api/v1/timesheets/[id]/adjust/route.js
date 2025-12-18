import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import mongoose from 'mongoose';
import { z } from 'zod';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';

/**
 * POST /api/v1/timesheets/[id]/adjust
 * 
 * Make a manual adjustment to a timesheet
 * 
 * Body:
 * - date: Date string - Date of the day to adjust
 * - originalHours: Number - Original hours before adjustment
 * - adjustedHours: Number - New hours (0-24)
 * - reason: String - Reason for adjustment (required, max 500 chars)
 * - notes: String - Additional notes (optional, max 1000 chars)
 * 
 * Access: HR, Admin only
 */
const adjustSchema = z.object({
  date: z.string().or(z.date()),
  originalHours: z.number().min(0).max(24),
  adjustedHours: z.number().min(0).max(24),
  reason: z.string().min(1).max(500),
  notes: z.string().max(1000).optional(),
});

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check permission
    const permissionCheck = await checkPermission('timesheets', 'manage', session);
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid timesheet ID' } },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validated = adjustSchema.parse(body);
    const { date, originalHours, adjustedHours, reason, notes } = validated;

    // Find timesheet
    const timesheet = await Timesheet.findById(params.id);

    if (!timesheet) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Timesheet not found' } },
        { status: 404 }
      );
    }

    // Check if timesheet is locked
    if (timesheet.status === 'locked') {
      return NextResponse.json(
        { success: false, error: { code: 'LOCKED', message: 'Cannot adjust locked timesheet' } },
        { status: 400 }
      );
    }

    // Find the day to adjust
    const adjustDate = new Date(date);
    adjustDate.setHours(0, 0, 0, 0);

    const dayIndex = timesheet.hours.findIndex((day) => {
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      return dayDate.getTime() === adjustDate.getTime();
    });

    if (dayIndex === -1) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Day not found in timesheet' } },
        { status: 404 }
      );
    }

    const day = timesheet.hours[dayIndex];

    // Verify original hours match
    if (Math.abs(day.hours - originalHours) > 0.01) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Original hours do not match current hours. Please refresh and try again.',
          },
        },
        { status: 400 }
      );
    }

    // Update the day's hours
    day.hours = adjustedHours;

    // Add adjustment to audit trail
    timesheet.adjustments.push({
      date: adjustDate,
      originalHours,
      adjustedHours,
      reason: reason.trim(),
      adjustedBy: session.user.id,
      adjustedAt: new Date(),
      notes: notes?.trim() || undefined,
    });

    // Save timesheet (pre-save middleware will recalculate totalHours)
    await timesheet.save();

    // Populate references for response
    await timesheet.populate('employeeId', 'firstName lastName employeeId');
    await timesheet.populate('adjustments.adjustedBy', 'firstName lastName');

    return NextResponse.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    console.error('Error adjusting timesheet:', error);

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
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while adjusting timesheet',
        },
      },
      { status: 500 }
    );
  }
}

