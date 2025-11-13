import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { calculatePayrollForTimesheets } from '@/lib/services/payrollCalculator';
import mongoose from 'mongoose';

/**
 * POST /api/v1/payroll-runs/[id]/calculate
 * 
 * Calculate payroll for a payroll run
 * 
 * Access: HR Officers, Admin
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

    // Only HR and Admin can calculate payroll
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only HR Officers and Admin can calculate payroll',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid payroll run ID',
          },
        },
        { status: 400 }
      );
    }

    const payrollRun = await PayrollRun.findById(params.id);

    if (!payrollRun) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payroll run not found',
          },
        },
        { status: 404 }
      );
    }

    if (payrollRun.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only calculate draft payroll runs',
          },
        },
        { status: 400 }
      );
    }

    // Calculate payroll
    await payrollRun.calculate();

    const populated = await PayrollRun.findById(payrollRun._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('employees', 'firstName lastName employeeId')
      .lean();

    return NextResponse.json({
      success: true,
      message: 'Payroll calculated successfully',
      data: populated,
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

