import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { AttendanceEvent } from '@/lib/models/AttendanceEvent';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import mongoose from 'mongoose';

/**
 * GET /api/v1/attendance/events
 * 
 * List attendance events with filtering
 * 
 * Query parameters:
 * - employeeId: Filter by employee ID
 * - siteId: Filter by site ID
 * - startDate: Start date (ISO string)
 * - endDate: End date (ISO string)
 * - type: Filter by event type (IN/OUT)
 * - isValid: Filter by validity (true/false)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * 
 * Access: Requires 'attendance' module with 'view' action
 */
export async function GET(req) {
  try {
    // Check permission
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const permissionCheck = await checkPermission('attendance', 'view', session);
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const employeeId = searchParams.get('employeeId');
    const siteId = searchParams.get('siteId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const isValidParam = searchParams.get('isValid');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    // Build query
    const query = {};

    // Filter by employee (non-admin users can only see their own)
    if (employeeId) {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.employeeId = employeeId;
      }
    } else if (permissionCheck.user.role !== 'admin' && permissionCheck.user.role !== 'hr_officer') {
      // Non-admin/non-HR users can only see their own events
      query.employeeId = permissionCheck.user._id;
    }

    // Filter by site
    if (siteId && mongoose.Types.ObjectId.isValid(siteId)) {
      query.siteId = siteId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.timestamp.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.timestamp.$lte = end;
      }
    }

    // Filter by type
    if (type && ['IN', 'OUT'].includes(type)) {
      query.type = type;
    }

    // Filter by validity
    if (isValidParam !== null) {
      query.isValid = isValidParam === 'true';
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      AttendanceEvent.find(query)
        .populate('employeeId', 'firstName lastName email employeeId')
        .populate('siteId', 'name siteCode')
        .populate('timesheetId', 'date hours')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AttendanceEvent.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance events:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching attendance events',
        },
      },
      { status: 500 }
    );
  }
}

