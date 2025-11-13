import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import mongoose from 'mongoose';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// GET - Get single employee
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const employee = await Employee.findById(params.id).select('-password').lean();

    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
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

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']).optional(),
  payRate: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  siteId: z.string().nullable().optional(), // Allow assigning/unassigning site
  annualLeaveBalance: z.number().min(0).optional(), // Annual leave balance in days
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
  }).optional(),
});

// PATCH - Update employee
export async function PATCH(req, { params }) {
  try {
    // Await params for Next.js 15+ compatibility (backward compatible)
    const resolvedParams = params instanceof Promise ? await params : params;
    const employeeId = resolvedParams.id;

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can update employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log('PATCH /api/v1/employees/[id] - Updating employee:', employeeId, 'with data:', body);
    
    const validatedData = updateEmployeeSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if email is being updated and if it already exists
    if (validatedData.email) {
      const existingEmployee = await Employee.findOne({ 
        email: validatedData.email.toLowerCase(),
        _id: { $ne: params.id }
      });
      if (existingEmployee) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'Email already exists',
            },
          },
          { status: 409 }
        );
      }
      validatedData.email = validatedData.email.toLowerCase();
    }

    // Hash password if provided
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Handle siteId assignment/unassignment
    // If siteId is null or empty string, unassign from site
    if (validatedData.siteId !== undefined) {
      if (validatedData.siteId === null || validatedData.siteId === '') {
        validatedData.siteId = null; // Unassign from site
      } else {
        // Validate that the site exists
        const { Site } = await import('@/lib/models/Site');
        const site = await Site.findById(validatedData.siteId);
        if (!site) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SITE', message: 'Site not found' } },
            { status: 400 }
          );
        }
      }
    }

    // Update employee
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      console.error('Employee not found:', employeeId);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    console.log('Employee updated successfully:', employee._id, 'New role:', employee.role);
    return NextResponse.json({
      success: true,
      data: employee,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete employee
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can delete employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const employee = await Employee.findByIdAndUpdate(
      params.id,
      { status: 'terminated' },
      { new: true }
    ).select('-password');

    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
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

