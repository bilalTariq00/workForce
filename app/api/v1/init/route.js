import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

// This endpoint creates the default HR admin user if it doesn't exist
export async function POST() {
  try {
    await connectDB();

    const defaultEmail = process.env.DEFAULT_HR_EMAIL || 'hr@workforce.com';
    const defaultPassword = process.env.DEFAULT_HR_PASSWORD || 'Admin@123';

    // Check if HR admin already exists
    const existingHR = await Employee.findOne({ 
      email: defaultEmail.toLowerCase(),
      role: 'hr_officer'
    });

    if (existingHR) {
      return NextResponse.json({
        success: false,
        message: 'HR admin already exists',
      }, { status: 409 });
    }

    // Create default HR admin
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const hrAdmin = await Employee.create({
      employeeId: 'EMP001',
      firstName: 'HR',
      lastName: 'Admin',
      email: defaultEmail.toLowerCase(),
      phone: '+441234567890',
      password: hashedPassword,
      role: 'hr_officer',
      status: 'active',
    });

    const response = hrAdmin.toObject();
    delete response.password;

    return NextResponse.json({
      success: true,
      message: 'Default HR admin created successfully',
      data: {
        email: defaultEmail,
        password: defaultPassword,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing HR admin:', error);
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

