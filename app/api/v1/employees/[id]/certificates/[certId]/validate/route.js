import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import mongoose from 'mongoose';
import { z } from 'zod';

const validateCertificateSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(500).optional(),
});

// POST - Validate (approve/reject) a certificate
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Authorization: Only HR/Admin/EHS can validate
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin' && session.user.role !== 'ehs_officer') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    const { id: employeeId, certId } = params;
    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(certId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid Employee or Certificate ID' } },
        { status: 400 }
      );
    }

    const certificate = await EmployeeCertificate.findOne({
      _id: certId,
      employeeId,
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found' } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = validateCertificateSchema.parse(body);

    // Update certificate status
    const updateData = {
      validatedBy: session.user.id,
      validatedAt: new Date(),
    };

    if (validatedData.action === 'approve') {
      updateData.status = 'valid';
      updateData.rejectionReason = undefined;
    } else {
      updateData.status = 'rejected';
      updateData.rejectionReason = validatedData.rejectionReason || 'Rejected by validator';
    }

    const updatedCertificate = await EmployeeCertificate.findByIdAndUpdate(
      certId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('validatedBy', 'firstName lastName')
      .populate('uploadedBy', 'firstName lastName')
      .lean();

    return NextResponse.json({ success: true, data: updatedCertificate });
  } catch (error) {
    console.error('Error validating certificate:', error);
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
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

