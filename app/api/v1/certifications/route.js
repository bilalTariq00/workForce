import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Certification } from '@/lib/models/Certification';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for creating certifications
 */
const createCertificationSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'Other']),
  documentUrl: z.string().url('Document URL must be a valid URL'),
  documentType: z.enum(['pdf', 'jpg', 'png']),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/certifications
 * 
 * List certifications with optional filters
 * 
 * Query parameters:
 * - employeeId: Filter by employee
 * - status: Filter by status
 * - type: Filter by certification type
 * - expiringSoon: Filter certifications expiring in next 30 days
 * 
 * Access:
 * - Employees: Can see their own certifications
 * - HR/EHS/Admin: Can see all certifications
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const expiringSoon = searchParams.get('expiringSoon') === 'true';

    const query = {};

    // Employees can only see their own certifications
    if (session.user.role === 'labour') {
      query.employeeId = session.user.id;
    }

    // Apply filters
    if (employeeId) {
      // Only HR/EHS/Admin can filter by other employees
      if (['hr_officer', 'ehs_officer', 'admin'].includes(session.user.role)) {
        query.employeeId = employeeId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    // Filter for expiring soon
    if (expiringSoon) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const expiryThreshold = new Date();
      expiryThreshold.setDate(today.getDate() + 30);
      expiryThreshold.setHours(23, 59, 59, 999);

      query.expiryDate = {
        $gte: today,
        $lte: expiryThreshold,
      };
      query.status = { $in: ['valid', 'pending_validation'] };
    }

    const certifications = await Certification.find(query)
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('validatedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: certifications,
    });

  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching certifications',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/certifications
 * 
 * Create a new certification
 * 
 * Access:
 * - Employees: Can create their own certifications
 * - HR/EHS/Admin: Can create certifications for any employee
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = createCertificationSchema.parse(body);

    await connectDB();

    // Parse dates
    const issueDate = new Date(validatedData.issueDate);
    const expiryDate = new Date(validatedData.expiryDate);

    // Validate expiry date is after issue date
    if (expiryDate <= issueDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Expiry date must be after issue date',
          },
        },
        { status: 400 }
      );
    }

    // Determine employeeId - employees can only create for themselves
    let targetEmployeeId = session.user.id;
    
    // HR/EHS/Admin can create for other employees if employeeId is provided
    if (['hr_officer', 'ehs_officer', 'admin'].includes(session.user.role) && body.employeeId) {
      targetEmployeeId = body.employeeId;
    }

    // Verify employee exists
    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Employee not found',
          },
        },
        { status: 404 }
      );
    }

    // Create certification
    const certification = new Certification({
      employeeId: targetEmployeeId,
      type: validatedData.type,
      documentUrl: validatedData.documentUrl,
      documentType: validatedData.documentType,
      issueDate,
      expiryDate,
      status: 'pending_validation',
      notes: validatedData.notes,
    });

    await certification.save();

    // Populate employee info
    await certification.populate('employeeId', 'firstName lastName employeeId email');

    return NextResponse.json(
      {
        success: true,
        data: certification,
        message: 'Certification uploaded successfully. Pending HR/EHS validation.',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating certification:', error);

    if (error instanceof z.ZodError) {
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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating certification',
        },
      },
      { status: 500 }
    );
  }
}

