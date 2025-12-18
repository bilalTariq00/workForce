import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { generateTimesheetsForWeek } from '@/lib/services/timesheetGenerator';

/**
 * Cron Job: Daily Timesheet Generation
 * 
 * Purpose: Automatically generate timesheets for the previous week
 * This should be called daily (e.g., every Monday at 2 AM) to generate timesheets for the previous week
 * 
 * Security: Should be protected with a secret token or only accessible from cron service
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Call this endpoint with Authorization header
 * 
 * Query params:
 * - weekStartDate: Optional - specific week to generate (default: previous week)
 * - secret: Required - secret token to prevent unauthorized access
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const weekStartDate = searchParams.get('weekStartDate');

    // Verify secret token (use environment variable)
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid secret' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Determine which week to generate
    // Default: previous week (Monday to Sunday)
    let targetDate;
    if (weekStartDate) {
      targetDate = new Date(weekStartDate);
    } else {
      // Get previous week's Monday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek; // If Sunday, go back 7 days
      targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysToSubtract - 7); // Go to previous week's Monday
    }

    // Generate timesheets for the week
    const { timesheets, errors } = await generateTimesheetsForWeek(targetDate, 'QR');

    return NextResponse.json({
      success: true,
      data: {
        weekStartDate: targetDate.toISOString(),
        timesheetsGenerated: timesheets.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in timesheet generation cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while generating timesheets',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for cron services that use POST requests
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, weekStartDate } = body;

    // Verify secret token
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid secret' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Determine which week to generate
    let targetDate;
    if (weekStartDate) {
      targetDate = new Date(weekStartDate);
    } else {
      // Get previous week's Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 7 : dayOfWeek;
      targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - daysToSubtract - 7);
    }

    // Generate timesheets for the week
    const { timesheets, errors } = await generateTimesheetsForWeek(targetDate, 'QR');

    return NextResponse.json({
      success: true,
      data: {
        weekStartDate: targetDate.toISOString(),
        timesheetsGenerated: timesheets.length,
        errors: errors.length > 0 ? errors : undefined,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in timesheet generation cron job:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while generating timesheets',
        },
      },
      { status: 500 }
    );
  }
}

