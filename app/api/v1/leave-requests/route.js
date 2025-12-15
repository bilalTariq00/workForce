import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { LeaveRequest } from '@/lib/models/LeaveRequest';
import { Employee } from '@/lib/models/Employee';
import { checkPermission, checkModuleAccess } from '@/lib/middleware/permissionMiddleware';
import { hasPermission } from '@/lib/utils/permissions';
import { z } from 'zod';

/**
 * Validation schema for creating leave requests
 */
const createLeaveRequestSchema = z.object({
  type: z.enum(['annual', 'sick', 'unpaid', 'compassionate']),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
});

/**
 * GET /api/v1/leave-requests
 * 
 * List leave requests with optional filters
 * 
 * Query parameters:
 * - employeeId: Filter by employee
 * - status: Filter by status (pending, approved, rejected)
 * - type: Filter by leave type
 * - startDate: Filter by start date
 * - endDate: Filter by end date
 * 
 * Access:
 * - Employees: Can see their own requests
 * - HR/Admin: Can see all requests
 * - Supervisors: Can see requests from their team
 */
export async function GET(req) {
  try {
    // Check module access
    const permissionCheck = await checkModuleAccess('leave_requests');
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
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query = {};

    // Check if user can only see their own requests
    const canManage = hasPermission(user, 'leave_requests', 'manage') || user.role === 'admin';
    
    if (!canManage) {
      query.employeeId = user._id;
    }

    // Apply filters
    if (employeeId) {
      // Only users with manage permission can filter by other employees
      if (canManage) {
        query.employeeId = employeeId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.startDate = { $gte: start };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.endDate = { $lte: end };
    }

    const leaveRequests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: leaveRequests,
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
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
 * POST /api/v1/leave-requests
 * 
 * Create a new leave request
 * 
 * Access: All authenticated employees
 * 
 * Business Rules:
 * - Start date must be in the future
 * - End date must be after start date
 * - Cannot overlap with existing approved leave
 * - For annual leave, must have sufficient balance
 */
export async function POST(req) {
  try {
    // Check permission - requires 'leave_requests' module with 'create' action
    const permissionCheck = await checkPermission('leave_requests', 'create');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    const body = await req.json();
    const validatedData = createLeaveRequestSchema.parse(body);

    await connectDB();

    // Parse dates
    const startDate = new Date(validatedData.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(validatedData.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Validate dates
    if (startDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Start date must be in the future',
          },
        },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'End date must be after start date',
          },
        },
        { status: 400 }
      );
    }

    // Check for overlapping approved leave
    const hasOverlap = await LeaveRequest.hasOverlappingLeave(
      user._id,
      startDate,
      endDate
    );

    if (hasOverlap) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OVERLAPPING_LEAVE',
            message: 'Leave request overlaps with existing approved leave',
          },
        },
        { status: 400 }
      );
    }

    // For annual leave, check balance
    if (validatedData.type === 'annual') {
      const employee = await Employee.findById(user._id).lean();
      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EMPLOYEE_NOT_FOUND',
              message: 'Employee not found',
            },
          },
          { status: 404 }
        );
      }

      // Calculate days (excluding weekends)
      let days = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          days++;
        }
        current.setDate(current.getDate() + 1);
      }

      if ((employee.annualLeaveBalance || 0) < days) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_BALANCE',
              message: `Insufficient annual leave balance. Available: ${employee.annualLeaveBalance || 0} days, Requested: ${days} days`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Create leave request
    const leaveRequest = await LeaveRequest.create({
      employeeId: user._id,
      type: validatedData.type,
      startDate,
      endDate,
      reason: validatedData.reason,
      status: 'pending',
    });

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('employeeId', 'firstName lastName email employeeId')
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Leave request created successfully',
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

    console.error('Error creating leave request:', error);
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

