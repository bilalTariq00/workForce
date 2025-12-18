import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { PayrollRun } from '@/lib/models/PayrollRun';
import mongoose from 'mongoose';

/**
 * GET /api/v1/payroll-runs/[id]
 * 
 * Get a single payroll run by ID with detailed calculations
 * 
 * Access: HR Officers, Admin
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can access
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only HR Officers and Admin can access payroll runs',
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

    const payrollRun = await PayrollRun.findById(params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('employees', 'firstName lastName employeeId payRate')
      .populate({
        path: 'timesheets',
        populate: {
          path: 'employeeId',
          select: 'firstName lastName employeeId payRate',
        },
      })
      .populate({
        path: 'payrollItems',
        populate: {
          path: 'employeeId',
          select: 'firstName lastName employeeId payRate',
        },
      })
      .lean();

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

    return NextResponse.json({
      success: true,
      data: payrollRun,
    });
  } catch (error) {
    console.error('Error fetching payroll run:', error);
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

