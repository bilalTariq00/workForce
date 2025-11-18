import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Certification } from '@/lib/models/Certification';
import { z } from 'zod';

/**
 * Validation schema for updating certifications
 */
const updateCertificationSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'Other']).optional(),
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
  ).optional(),
  documentType: z.enum(['pdf', 'jpg', 'png']).optional(),
  issueDate: z.string().or(z.date()).optional(),
  expiryDate: z.string().or(z.date()).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/certifications/[id]
 * 
 * Get a single certification by ID
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

    await connectDB();

    const certification = await Certification.findById(params.id)
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('validatedBy', 'firstName lastName employeeId')
      .lean();

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

    // Employees can only see their own certifications
    if (session.user.role === 'labour' && certification.employeeId._id.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: certification,
    });

  } catch (error) {
    console.error('Error fetching certification:', error);
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

/**
 * PUT /api/v1/certifications/[id]
 * 
 * Update a certification
 * 
 * Access:
 * - Employees: Can update their own pending certifications
 * - HR/EHS/Admin: Can update any certification
 */
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const certification = await Certification.findById(params.id);

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

    // Employees can only update their own pending certifications
    if (session.user.role === 'labour') {
      if (certification.employeeId.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }
      if (certification.status !== 'pending_validation' && certification.status !== 'rejected') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only update pending or rejected certifications',
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validatedData = updateCertificationSchema.parse(body);

    // Update fields
    if (validatedData.type) certification.type = validatedData.type;
    if (validatedData.documentUrl) certification.documentUrl = validatedData.documentUrl;
    if (validatedData.documentType) certification.documentType = validatedData.documentType;
    if (validatedData.issueDate) certification.issueDate = new Date(validatedData.issueDate);
    if (validatedData.expiryDate) certification.expiryDate = new Date(validatedData.expiryDate);
    if (validatedData.notes !== undefined) certification.notes = validatedData.notes;

    // Validate expiry date is after issue date
    if (certification.expiryDate <= certification.issueDate) {
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

    // If updating from rejected, reset to pending
    if (certification.status === 'rejected' && !['hr_officer', 'ehs_officer', 'admin'].includes(session.user.role)) {
      certification.status = 'pending_validation';
      certification.rejectionReason = undefined;
    }

    await certification.save();

    await certification.populate('employeeId', 'firstName lastName employeeId email');
    await certification.populate('validatedBy', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: certification,
      message: 'Certification updated successfully',
    });

  } catch (error) {
    console.error('Error updating certification:', error);

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
          message: 'An error occurred while updating certification',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/certifications/[id]
 * 
 * Delete a certification
 * 
 * Access:
 * - Employees: Can delete their own pending/rejected certifications
 * - HR/EHS/Admin: Can delete any certification
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const certification = await Certification.findById(params.id);

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

    // Employees can only delete their own pending/rejected certifications
    if (session.user.role === 'labour') {
      if (certification.employeeId.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }
      if (certification.status === 'valid') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot delete validated certifications',
            },
          },
          { status: 403 }
        );
      }
    }

    await certification.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting certification:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting certification',
        },
      },
      { status: 500 }
    );
  }
}

