import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { matchAllDeliveries } from '@/lib/services/poMatching';
import { z } from 'zod';

/**
 * Validation schema for creating/updating daily logs
 * Ensures all required fields are present and valid
 */
const createDailyLogSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  date: z.string().or(z.date()), // Accept string or Date object
  weather: z.string().max(200).optional(),
  headcount: z.number().min(0, 'Headcount must be 0 or greater').default(0),
  plannedHeadcount: z.number().min(0).optional(),
  deliveries: z
    .array(
      z.object({
        material: z.string().min(1, 'Material description is required'),
        docketNumber: z.string().min(1, 'Docket number is required'),
        docketPhoto: z.string().url('Invalid photo URL'),
        poMatchStatus: z.enum(['matched', 'pending', 'unmatched']).default('pending'),
        poId: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  issues: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/daily-logs
 * 
 * List all daily logs with optional filters
 * 
 * Query parameters:
 * - siteId: Filter by site
 * - date: Filter by specific date
 * - status: Filter by status (draft, locked, sent)
 * - siteManagerId: Filter by site manager
 * 
 * Access: Site Managers (their own logs), Contracts Managers (all logs), HR, Admin
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    // Build query based on user role and filters
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const siteManagerId = searchParams.get('siteManagerId');

    const query = {};

    // Site Managers can only see their own logs
    if (session.user.role === 'site_manager') {
      query.siteManagerId = session.user.id;
    }

    // Apply filters
    if (siteId) {
      query.siteId = siteId;
    }

    if (date) {
      // Parse date and set to start of day for comparison
      const filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: filterDate, $lt: nextDay };
    }

    if (status) {
      query.status = status;
    }

    if (siteManagerId) {
      // Only HR, Admin, and Contracts Managers can filter by site manager
      if (
        session.user.role === 'hr_officer' ||
        session.user.role === 'admin' ||
        session.user.role === 'contracts_manager'
      ) {
        query.siteManagerId = siteManagerId;
      }
    }

    // Fetch logs with populated references
    const logs = await DailyLog.find(query)
      .populate('siteId', 'name siteCode address')
      .populate('siteManagerId', 'firstName lastName email')
      .sort({ date: -1, createdAt: -1 }) // Most recent first
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching daily logs',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/daily-logs
 * 
 * Create a new daily log
 * 
 * Access: Site Managers only (for their assigned sites)
 * 
 * Business Rules:
 * - Only one log per site per day (enforced by unique index)
 * - Site Manager must be assigned to the site
 * - Log starts in "draft" status
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Site Managers can create daily logs
    if (session.user.role !== 'site_manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Site Managers can create daily logs' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createDailyLogSchema.parse(body);

    await connectDB();

    // Parse date and set to start of day
    const logDate = new Date(validatedData.date);
    logDate.setHours(0, 0, 0, 0);

    // Check if log already exists for this site and date
    const existingLog = await DailyLog.findOne({
      siteId: validatedData.siteId,
      date: logDate,
    });

    if (existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_LOG',
            message: 'A daily log already exists for this site and date',
          },
        },
        { status: 400 }
      );
    }

    // Auto-match deliveries to Purchase Orders
    let matchedDeliveries = validatedData.deliveries || [];
    if (matchedDeliveries.length > 0) {
      matchedDeliveries = await matchAllDeliveries(matchedDeliveries, validatedData.siteId);
    }

    // Create new daily log
    const dailyLog = await DailyLog.create({
      siteId: validatedData.siteId,
      siteManagerId: session.user.id, // Use logged-in user as site manager
      date: logDate,
      weather: validatedData.weather,
      headcount: validatedData.headcount,
      plannedHeadcount: validatedData.plannedHeadcount,
      deliveries: matchedDeliveries,
      issues: validatedData.issues,
      status: 'draft', // Always start as draft
    });

    // Populate references before returning
    const populatedLog = await DailyLog.findById(dailyLog._id)
      .populate('siteId', 'name siteCode address')
      .populate('siteManagerId', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: populatedLog,
      },
      { status: 201 }
    );
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

    // Handle duplicate key error (from unique index)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_LOG',
            message: 'A daily log already exists for this site and date',
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating daily log:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating daily log',
        },
      },
      { status: 500 }
    );
  }
}


