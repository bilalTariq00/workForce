import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { matchAllDeliveries } from '@/lib/services/poMatching';
import { z } from 'zod';
import mongoose from 'mongoose';

/**
 * Validation schema for updating daily logs
 * Only allows updating draft logs
 */
const updateDailyLogSchema = z.object({
  weather: z.string().max(200).optional(),
  headcount: z.number().min(0).optional(),
  plannedHeadcount: z.number().min(0).optional(),
  deliveries: z
    .array(
      z.object({
        material: z.string().min(1),
        docketNumber: z.string().min(1),
        docketPhoto: z.string().url(),
        poMatchStatus: z.enum(['matched', 'pending', 'unmatched']).default('pending'),
        poId: z.string().optional(),
      })
    )
    .optional(),
  issues: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/daily-logs/[id]
 * 
 * Get a single daily log by ID
 * 
 * Access: Site Managers (their own logs), Contracts Managers, HR, Admin
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid daily log ID' } },
        { status: 400 }
      );
    }

    // Find the log
    const dailyLog = await DailyLog.findById(params.id)
      .populate('siteId', 'name siteCode address location')
      .populate('siteManagerId', 'firstName lastName email')
      .lean();

    if (!dailyLog) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily log not found' } },
        { status: 404 }
      );
    }

    // Site Managers can only view their own logs
    if (
      session.user.role === 'site_manager' &&
      dailyLog.siteManagerId._id.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dailyLog,
    });
  } catch (error) {
    console.error('Error fetching daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching daily log',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/daily-logs/[id]
 * 
 * Update a daily log (only if status is "draft")
 * 
 * Access: Site Managers (their own logs only)
 * 
 * Business Rules:
 * - Cannot update if status is "locked" or "sent"
 * - Only the Site Manager who created it can update it
 */
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Site Managers can update daily logs
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Site Managers can update daily logs' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid daily log ID' } },
        { status: 400 }
      );
    }

    // Find the log
    const dailyLog = await DailyLog.findById(params.id);

    if (!dailyLog) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily log not found' } },
        { status: 404 }
      );
    }

    // Check if user is the site manager who created this log
    if (dailyLog.siteManagerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only update your own daily logs' } },
        { status: 403 }
      );
    }

    // Check if log can be edited (must be draft status)
    if (dailyLog.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_LOCKED',
            message: 'Cannot update locked or sent daily log',
          },
        },
        { status: 400 }
      );
    }

    // Parse and validate update data
    const body = await req.json();
    const validatedData = updateDailyLogSchema.parse(body);

    // Update fields
    if (validatedData.weather !== undefined) {
      dailyLog.weather = validatedData.weather;
    }
    if (validatedData.headcount !== undefined) {
      dailyLog.headcount = validatedData.headcount;
    }
    if (validatedData.plannedHeadcount !== undefined) {
      dailyLog.plannedHeadcount = validatedData.plannedHeadcount;
    }
    if (validatedData.deliveries !== undefined) {
      // Auto-match deliveries to Purchase Orders
      const matchedDeliveries = await matchAllDeliveries(
        validatedData.deliveries,
        dailyLog.siteId.toString()
      );
      dailyLog.deliveries = matchedDeliveries;
    }
    if (validatedData.issues !== undefined) {
      dailyLog.issues = validatedData.issues;
    }

    // Save the updated log
    await dailyLog.save();

    // Populate references before returning
    const populatedLog = await DailyLog.findById(dailyLog._id)
      .populate('siteId', 'name siteCode address')
      .populate('siteManagerId', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedLog,
    });
  } catch (error) {
    // Handle validation errors
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

    console.error('Error updating daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating daily log',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/daily-logs/[id]
 * 
 * Delete a daily log (only if status is "draft")
 * 
 * Access: Site Managers (their own logs only)
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Site Managers can delete daily logs
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Site Managers can delete daily logs' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid daily log ID' } },
        { status: 400 }
      );
    }

    // Find the log
    const dailyLog = await DailyLog.findById(params.id);

    if (!dailyLog) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily log not found' } },
        { status: 404 }
      );
    }

    // Check if user is the site manager who created this log
    if (dailyLog.siteManagerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own daily logs' } },
        { status: 403 }
      );
    }

    // Only allow deletion of draft logs
    if (dailyLog.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_LOCKED',
            message: 'Cannot delete locked or sent daily log',
          },
        },
        { status: 400 }
      );
    }

    // Delete the log
    await DailyLog.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      data: { message: 'Daily log deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting daily log',
        },
      },
      { status: 500 }
    );
  }
}


