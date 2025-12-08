import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Debug endpoint to check HR admin credentials
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password required',
      }, { status: 400 });
    }

    await connectDB();

    // Find employee
    const employee = await Employee.findOne({ 
      email: email.toLowerCase(),
    });

    if (!employee) {
      return NextResponse.json({
        success: false,
        error: 'Employee not found',
        searchedEmail: email.toLowerCase(),
      }, { status: 404 });
    }

    // Check status
    if (employee.status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'Employee is not active',
        status: employee.status,
      }, { status: 403 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, employee.password);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee._id.toString(),
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        status: employee.status,
        employeeId: employee.employeeId,
      },
      passwordMatch: isValid,
      message: isValid ? 'Credentials are valid!' : 'Password does not match',
    });

  } catch (error) {
    console.error('Debug auth error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

