import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import {
  generateTimesheetForEmployee,
  generateTimesheetsForWeek,
  generateCurrentWeekTimesheet,
} from '@/lib/services/timesheetGenerator';
import { AttendanceEvent } from '@/lib/models/AttendanceEvent';
import { checkPermission, checkModuleAccess } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

/**
 * GET /api/v1/timesheets
 * 
 * List all timesheets with optional filters
 * 
 * Query parameters:
 * - employeeId: Filter by employee
 * - weekStartDate: Filter by week start date
 * - status: Filter by status (draft, submitted, approved, locked)
 * 
 * Access: Requires 'timesheets' module with 'view' action
 */
export async function GET(req) {
  try {
    // Check permission using template
    const permissionCheck = await checkPermission('timesheets', 'view');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const weekStartDate = searchParams.get('weekStartDate');
    const status = searchParams.get('status');
    const siteIds = searchParams.get('siteIds'); // Comma-separated list of site IDs

    const query = {};

    // Check if user can only view their own timesheets (labour role typically)
    // If user doesn't have 'manage' permission, they can only see their own
    const { hasPermission } = await import('@/lib/utils/permissions');
    const canManage = hasPermission(user, 'timesheets', 'manage') || user.role === 'admin';
    
    if (!canManage) {
      query.employeeId = user._id;
    }

    // Apply filters
    if (employeeId) {
      // Only users with manage permission can filter by any employee
      if (canManage) {
        query.employeeId = employeeId;
      }
    }

    if (weekStartDate) {
      const weekStart = Timesheet.getWeekStart(new Date(weekStartDate));
      weekStart.setHours(0, 0, 0, 0);
      query.weekStartDate = weekStart;
    }

    if (status) {
      query.status = status;
    }

    // Fetch timesheets with populated references
    let timesheets = await Timesheet.find(query)
      .populate('employeeId', 'firstName lastName employeeId email payRate')
      .populate('approvedBy', 'firstName lastName')
      .populate('lockedBy', 'firstName lastName')
      .populate('hours.siteId', 'name siteCode')
      .sort({ weekStartDate: -1, createdAt: -1 })
      .lean();

    // Filter by site IDs if provided (for site manager view)
    if (siteIds) {
      const siteIdArray = siteIds.split(',').map(id => id.trim());
      timesheets = timesheets.filter(timesheet => {
        // Check if any day in the timesheet has a siteId in the filter list
        return timesheet.hours?.some(day => 
          day.siteId && siteIdArray.includes(day.siteId._id?.toString() || day.siteId.toString())
        );
      });
    }

    return NextResponse.json({
      success: true,
      data: timesheets,
    });
  } catch (error) {
    console.error('Error fetching timesheets:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching timesheets',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/timesheets
 * 
 * Create or generate timesheet(s)
 * 
 * Body:
 * - employeeId: Optional - generate for specific employee (default: all employees)
 * - weekStartDate: Optional - week to generate (default: current week)
 * - generateForAll: Optional - generate for all employees (HR only)
 * 
 * Access: HR, Admin (can generate for all), Employees (can generate their own)
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

    await connectDB();

    const body = await req.json();
    const { employeeId, weekStartDate, generateForAll } = body;

    // Determine target employee
    let targetEmployeeId = employeeId;
    if (!targetEmployeeId) {
      if (session.user.role === 'labour') {
        // Employees can only generate their own
        targetEmployeeId = session.user.id;
      } else if (!generateForAll) {
        // HR/Admin must specify employeeId or generateForAll
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'employeeId or generateForAll is required',
            },
          },
          { status: 400 }
        );
      }
    }

    // Check permissions
    if (targetEmployeeId && session.user.role === 'labour') {
      if (targetEmployeeId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    // Generate timesheet(s)
    let result;
    const targetDate = weekStartDate ? new Date(weekStartDate) : new Date();

    if (generateForAll) {
      // Only HR and Admin can generate for all
      if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }

      const { timesheets, errors } = await generateTimesheetsForWeek(targetDate, 'QR');
      result = { timesheets, count: timesheets.length, errors: errors.length > 0 ? errors : undefined };
    } else {
      const timesheet = await generateTimesheetForEmployee(targetEmployeeId, targetDate, 'QR');
      result = { timesheet };
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating timesheet:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while generating timesheet',
        },
      },
      { status: 500 }
    );
  }
}

