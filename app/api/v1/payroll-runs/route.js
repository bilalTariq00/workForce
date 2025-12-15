import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { Timesheet } from '@/lib/models/Timesheet';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

/**
 * Validation schema for creating payroll runs
 */
const createPayrollRunSchema = z.object({
  periodStart: z.string().or(z.date()),
  periodEnd: z.string().or(z.date()),
  timesheetIds: z.array(z.string()).min(1, 'At least one timesheet is required'),
});

/**
 * GET /api/v1/payroll-runs
 * 
 * List payroll runs with optional filters
 * 
 * Query parameters:
 * - status: Filter by status
 * - periodStart: Filter by period start
 * - periodEnd: Filter by period end
 * 
 * Access: Requires 'finance_payroll' module with 'view' action
 */
export async function GET(req) {
  try {
    // Check permission using template
    const permissionCheck = await checkPermission('finance_payroll', 'view');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    const query = {};

    if (status) {
      query.status = status;
    }

    if (periodStart) {
      query.periodStart = { $gte: new Date(periodStart) };
    }

    if (periodEnd) {
      query.periodEnd = { $lte: new Date(periodEnd) };
    }

    const payrollRuns = await PayrollRun.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('employees', 'firstName lastName employeeId')
      .sort({ periodStart: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: payrollRuns,
    });
  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/payroll-runs
 * 
 * Create a new payroll run
 * 
 * Access: HR Officers, Admin
 * 
 * Business Rules:
 * - Only locked timesheets can be included
 * - Timesheets must be within the pay period
 * - One payroll run per pay period (optional validation)
 */
export async function POST(req) {
  try {
    // Check permission using template
    const permissionCheck = await checkPermission('finance_payroll', 'create');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;

    const body = await req.json();
    const validatedData = createPayrollRunSchema.parse(body);

    await connectDB();

    // Parse dates
    const periodStart = new Date(validatedData.periodStart);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(validatedData.periodEnd);
    periodEnd.setHours(23, 59, 59, 999);

    // Validate dates
    if (periodEnd < periodStart) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Period end must be after period start',
          },
        },
        { status: 400 }
      );
    }

    // Validate timesheets exist and are locked
    const timesheets = await Timesheet.find({
      _id: { $in: validatedData.timesheetIds },
    }).lean();

    if (timesheets.length !== validatedData.timesheetIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TIMESHEETS',
            message: 'Some timesheets not found',
          },
        },
        { status: 400 }
      );
    }

    // Check all timesheets are locked
    const unlockedTimesheets = timesheets.filter((t) => t.status !== 'locked');
    if (unlockedTimesheets.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNLOCKED_TIMESHEETS',
            message: 'All timesheets must be locked before including in payroll run',
          },
        },
        { status: 400 }
      );
    }

    // Create payroll run
    const payrollRun = await PayrollRun.create({
      periodStart,
      periodEnd,
      timesheets: validatedData.timesheetIds,
      createdBy: user._id.toString(),
      status: 'draft',
    });

    const populated = await PayrollRun.findById(payrollRun._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('employees', 'firstName lastName employeeId')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Payroll run created successfully',
        data: populated,
      },
      { status: 201 }
    );
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

    console.error('Error creating payroll run:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

