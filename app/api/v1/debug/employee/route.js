import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check employee existence
 * GET /api/v1/debug/employee
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated'
      }, { status: 401 });
    }

    await connectDB();

    const sessionUserId = session.user.id;
    const sessionEmail = session.user.email;
    const sessionRole = session.user.role;

    // Try to find by ID
    const employeeById = await Employee.findById(sessionUserId).lean();
    
    // Try to find by email
    const employeeByEmail = sessionEmail 
      ? await Employee.findOne({ email: sessionEmail.toLowerCase() }).lean()
      : null;

    // Get all employees (for debugging - limit to 10)
    const allEmployees = await Employee.find()
      .select('_id email employeeId role status')
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        session: {
          userId: sessionUserId,
          email: sessionEmail,
          role: sessionRole,
        },
        employeeById: employeeById ? {
          _id: employeeById._id.toString(),
          email: employeeById.email,
          employeeId: employeeById.employeeId,
          role: employeeById.role,
          status: employeeById.status,
        } : null,
        employeeByEmail: employeeByEmail ? {
          _id: employeeByEmail._id.toString(),
          email: employeeByEmail.email,
          employeeId: employeeByEmail.employeeId,
          role: employeeByEmail.role,
          status: employeeByEmail.status,
        } : null,
        idMatch: employeeById ? (employeeById._id.toString() === sessionUserId) : false,
        emailMatch: employeeByEmail ? (employeeByEmail.email === sessionEmail?.toLowerCase()) : false,
        allEmployees: allEmployees.map(emp => ({
          _id: emp._id.toString(),
          email: emp.email,
          employeeId: emp.employeeId,
          role: emp.role,
          status: emp.status,
        })),
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

