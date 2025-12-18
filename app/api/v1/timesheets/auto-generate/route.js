import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { generateTimesheetsForWeek, generateTimesheetForEmployee } from '@/lib/services/timesheetGenerator';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

/**
 * POST /api/v1/timesheets/auto-generate
 * 
 * Auto-generate timesheets from attendance events
 * 
 * Body:
 * - employeeId: Optional - generate for specific employee (default: all employees)
 * - weekStartDate: Optional - week to generate (default: current week)
 * - source: Optional - 'QR' or 'MANUAL' (default: 'QR')
 * 
 * Access: HR, Admin (can generate for all), Employees (can generate their own)
 */
const autoGenerateSchema = z.object({
  employeeId: z.string().optional(),
  weekStartDate: z.string().optional(),
  source: z.enum(['QR', 'MANUAL']).optional().default('QR'),
});

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
    const validated = autoGenerateSchema.parse(body);
    const { employeeId, weekStartDate, source } = validated;

    // Determine target employee
    let targetEmployeeId = employeeId;
    if (!targetEmployeeId) {
      if (session.user.role === 'labour') {
        // Employees can only generate their own
        targetEmployeeId = session.user.id;
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

    // Check if user has permission to generate for all
    if (!targetEmployeeId) {
      const permissionCheck = await checkPermission('timesheets', 'manage', session);
      if (permissionCheck.error) {
        return NextResponse.json(
          { success: false, error: permissionCheck.error },
          { status: permissionCheck.status }
        );
      }
    }

    // Generate timesheet(s)
    const targetDate = weekStartDate ? new Date(weekStartDate) : new Date();

    if (!targetEmployeeId) {
      // Generate for all employees
      const { timesheets, errors } = await generateTimesheetsForWeek(targetDate, source);
      
      return NextResponse.json(
        {
          success: true,
          data: {
            timesheets,
            count: timesheets.length,
            errors: errors.length > 0 ? errors : undefined,
          },
        },
        { status: 201 }
      );
    } else {
      // Generate for specific employee
      const timesheet = await generateTimesheetForEmployee(targetEmployeeId, targetDate, source);
      
      return NextResponse.json(
        {
          success: true,
          data: { timesheet },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Error auto-generating timesheet:', error);
    
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
          message: error.message || 'An error occurred while generating timesheet',
        },
      },
      { status: 500 }
    );
  }
}

