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
 * Access: HR, Admin (all timesheets), Employees (their own timesheets)
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

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const weekStartDate = searchParams.get('weekStartDate');
    const status = searchParams.get('status');

    const query = {};

    // Employees can only see their own timesheets
    if (session.user.role === 'labour') {
      query.employeeId = session.user.id;
    }

    // Apply filters
    if (employeeId) {
      // HR and Admin can filter by any employee
      if (session.user.role === 'hr_officer' || session.user.role === 'admin') {
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
    const timesheets = await Timesheet.find(query)
      .populate('employeeId', 'firstName lastName employeeId email payRate')
      .populate('approvedBy', 'firstName lastName')
      .populate('lockedBy', 'firstName lastName')
      .sort({ weekStartDate: -1, createdAt: -1 })
      .lean();

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

      const timesheets = await generateTimesheetsForWeek(targetDate);
      result = { timesheets, count: timesheets.length };
    } else {
      const timesheet = await generateTimesheetForEmployee(targetEmployeeId, targetDate);
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

