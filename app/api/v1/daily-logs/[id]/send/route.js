import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import mongoose from 'mongoose';

/**
 * POST /api/v1/daily-logs/[id]/send
 * 
 * Send a locked daily log to the Contracts Manager
 * 
 * Purpose: Once sent, the log is marked as "sent" and the Contracts Manager is notified
 * 
 * Access: Site Managers (their own logs only)
 * 
 * Business Rules:
 * - Can only send logs with "locked" status
 * - Once sent, log cannot be edited or unlocked
 * - Sets sentAt timestamp
 * - Triggers notification to Contracts Manager (future: event bus)
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

    // Only Site Managers can send daily logs
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Site Managers can send daily logs' } },
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

    // Find the log with populated site to get Contracts Manager
    const dailyLog = await DailyLog.findById(params.id).populate('siteId');

    if (!dailyLog) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Daily log not found' } },
        { status: 404 }
      );
    }

    // Check if user is the site manager who created this log
    if (dailyLog.siteManagerId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'You can only send your own daily logs' } },
        { status: 403 }
      );
    }

    // Check if log is in locked status
    if (dailyLog.status !== 'locked') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot send log with status "${dailyLog.status}". Only locked logs can be sent.`,
          },
        },
        { status: 400 }
      );
    }

    // Send the log using the instance method
    // This sets status to "sent" and sentAt timestamp
    await dailyLog.send();

    // TODO: Trigger event/notification to Contracts Manager
    // Example: eventBus.emit('daily_log.sent', { logId: dailyLog._id, siteId: dailyLog.siteId });

    // Populate references before returning
    const populatedLog = await DailyLog.findById(dailyLog._id)
      .populate('siteId', 'name siteCode address contractsManagerId')
      .populate('siteManagerId', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedLog,
      message: 'Daily log sent to Contracts Manager successfully',
    });
  } catch (error) {
    // Handle business rule violations from the send method
    if (error.message === 'Can only send locked logs') {
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

    console.error('Error sending daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while sending daily log',
        },
      },
      { status: 500 }
    );
  }
}


