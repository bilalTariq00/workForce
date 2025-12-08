import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import mongoose from 'mongoose';
import { z } from 'zod';

const updateCertificateSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'CPCS', 'IPAF', 'PASMA', 'Other']).optional(),
  certificateNumber: z.string().max(100).optional(),
  issueDate: z.string().datetime().or(z.string().date()).optional(),
  expiryDate: z.string().datetime().or(z.string().date()).optional(),
  notes: z.string().max(1000).optional(),
});

// GET - Get a specific certificate
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
    })
      .populate('validatedBy', 'firstName lastName')
      .populate('uploadedBy', 'firstName lastName')
      .lean();

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found' } },
        { status: 404 }
      );
    }

    // Authorization: Only HR/Admin or the employee themselves can view
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin' && session.user.id !== employeeId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: certificate });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

// PATCH - Update a certificate
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
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

    // Authorization: Only HR/Admin can update, or employee can update their own pending/rejected certificates
    const canUpdate = session.user.role === 'hr_officer' || 
                      session.user.role === 'admin' ||
                      (session.user.id === employeeId && 
                       (certificate.status === 'pending_validation' || certificate.status === 'rejected'));

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateCertificateSchema.parse(body);

    // Prepare update data
    const updateData = {};
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.certificateNumber !== undefined) updateData.certificateNumber = validatedData.certificateNumber;
    if (validatedData.issueDate) updateData.issueDate = new Date(validatedData.issueDate);
    if (validatedData.expiryDate) updateData.expiryDate = new Date(validatedData.expiryDate);
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    // Update certificate
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
    console.error('Error updating certificate:', error);
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

// DELETE - Delete a certificate
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Authorization: Only HR/Admin can delete
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
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

    const deletedCertificate = await EmployeeCertificate.findOneAndDelete({
      _id: certId,
      employeeId,
    }).lean();

    if (!deletedCertificate) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Certificate not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedCertificate,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

