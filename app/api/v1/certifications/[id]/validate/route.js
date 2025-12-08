import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import { z } from 'zod';

/**
 * Validation schema for certification validation
 */
const validateCertificationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

/**
 * POST /api/v1/certifications/[id]/validate
 * 
 * Validate (approve or reject) a certification
 * 
 * Access:
 * - HR/EHS/Admin only
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

    // Only HR, EHS, and Admin can validate certifications
    if (!['hr_officer', 'ehs_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only HR and EHS officers can validate certifications',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    const certification = await EmployeeCertificate.findById(params.id);

    if (!certification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Certification not found',
          },
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = validateCertificationSchema.parse(body);

    // Update certification status
    if (validatedData.action === 'approve') {
      certification.status = 'valid';
      certification.validatedBy = session.user.id;
      certification.validatedAt = new Date();
      certification.rejectionReason = undefined;
    } else if (validatedData.action === 'reject') {
      certification.status = 'rejected';
      certification.validatedBy = session.user.id;
      certification.validatedAt = new Date();
      certification.rejectionReason = validatedData.rejectionReason || 'Rejected by validator';
    }

    await certification.save();

    await certification.populate('employeeId', 'firstName lastName employeeId email');
    await certification.populate('validatedBy', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: certification,
      message: `Certification ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });

  } catch (error) {
    console.error('Error validating certification:', error);

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
          message: 'An error occurred while validating certification',
        },
      },
      { status: 500 }
    );
  }
}

