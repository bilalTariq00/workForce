import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';

// Test endpoint to check MongoDB connection
export async function GET() {
  try {
    // Test database connection
    await connectDB();
    
    // Test query - count employees
    const employeeCount = await Employee.countDocuments();
    
    // Check if HR admin exists
    const hrAdmin = await Employee.findOne({ role: 'hr_officer' });
    
    return NextResponse.json({
      success: true,
      message: 'Backend is connected!',
      database: {
        connected: true,
        employeeCount: employeeCount,
        hrAdminExists: !!hrAdmin,
        hrAdminEmail: hrAdmin ? hrAdmin.email : null,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Connection test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Backend connection failed',
      error: error.message,
      database: {
        connected: false,
      },
    }, { status: 500 });
  }
}

