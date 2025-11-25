import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import mongoose from 'mongoose';

/**
 * POST /api/v1/daily-logs/[id]/lock
 * 
 * Lock a daily log (change status from "draft" to "locked")
 * 
 * Purpose: Once locked, the log cannot be edited and is ready to be sent to Contracts Manager
 * 
 * Access: Site Managers (their own logs only)
 * 
 * Business Rules:
 * - Can only lock logs with "draft" status
 * - Headcount is required before locking
 * - Once locked, log cannot be edited
 * - Sets lockedAt timestamp
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

    // Only Site Managers can lock daily logs
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Site Managers can lock daily logs' } },
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
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only lock your own daily logs' } },
        { status: 403 }
      );
    }

    // Check if log is in draft status
    if (dailyLog.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot lock log with status "${dailyLog.status}". Only draft logs can be locked.`,
          },
        },
        { status: 400 }
      );
    }

    // Validate required fields before locking
    if (dailyLog.headcount === undefined || dailyLog.headcount === null) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Headcount is required before locking the log',
          },
        },
        { status: 400 }
      );
    }

    // Lock the log using the instance method
    // This sets status to "locked" and lockedAt timestamp
    await dailyLog.lock();

    // Populate references before returning
    const populatedLog = await DailyLog.findById(dailyLog._id)
      .populate('siteId', 'name siteCode address')
      .populate('siteManagerId', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedLog,
      message: 'Daily log locked successfully',
    });
  } catch (error) {
    // Handle business rule violations from the lock method
    if (error.message === 'Can only lock draft logs') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    if (error.message === 'Headcount is required before locking') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error locking daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while locking daily log',
        },
      },
      { status: 500 }
    );
  }
}







