import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']),
  payRate: z.number().min(0).optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
  }).optional(),
});

// GET - List all employees
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can view all employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    const employees = await Employee.find({ status: { $ne: 'terminated' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: employees,
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
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

// POST - Create new employee
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can create employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createEmployeeSchema.parse(body);

    await connectDB();

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: validatedData.email.toLowerCase() });
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

    // Generate employee ID
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let employeeId = 'EMP001';
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''));
      employeeId = `EMP${String(lastNum + 1).padStart(3, '0')}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create employee
    const employee = await Employee.create({
      ...validatedData,
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      employeeId,
      createdBy: session.user.id,
      status: 'active',
    });

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    return NextResponse.json(
      {
        success: true,
        data: employeeResponse,
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

    console.error('Error creating employee:', error);
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

