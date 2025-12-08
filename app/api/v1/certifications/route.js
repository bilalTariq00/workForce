import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for creating certifications
 */
const createCertificationSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'CPCS', 'IPAF', 'PASMA', 'Other']),
  certificateNumber: z.string().max(100).optional(),
  documentUrl: z.string().refine(
    (url) => {
      // Accept absolute URLs (http/https) or relative URLs starting with /
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }
      // Accept relative URLs starting with /
      return url.startsWith('/');
    },
    {
      message: 'Document URL must be a valid absolute URL (http/https) or relative URL (starting with /)',
    }
  ),
  documentType: z.enum(['pdf', 'jpg', 'jpeg', 'png']),
  issueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
  notes: z.string().max(1000).optional(),
  uploadMethod: z.enum(['camera', 'file']).optional().default('file'),
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
      query.status = { $in: ['valid', 'pending_validation', 'expiring_soon'] };
    }

    const certifications = await EmployeeCertificate.find(query)
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
    const certification = await EmployeeCertificate.create({
      employeeId: targetEmployeeId,
      type: validatedData.type,
      certificateNumber: validatedData.certificateNumber,
      documentUrl: validatedData.documentUrl,
      documentType: validatedData.documentType,
      issueDate,
      expiryDate,
      status: 'pending_validation',
      notes: validatedData.notes,
      uploadMethod: validatedData.uploadMethod || 'file',
      uploadedBy: session.user.id,
    });

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

