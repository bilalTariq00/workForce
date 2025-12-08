import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import { Employee } from '@/lib/models/Employee';
import { uploadFile } from '@/lib/services/fileUpload';
import mongoose from 'mongoose';
import { z } from 'zod';

const createCertificateSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'CPCS', 'IPAF', 'PASMA', 'Other']),
  certificateNumber: z.string().max(100).optional(),
  issueDate: z.string().datetime().or(z.string().date()),
  expiryDate: z.string().datetime().or(z.string().date()),
  notes: z.string().max(1000).optional(),
  uploadMethod: z.enum(['camera', 'file']).optional().default('file'),
});

// GET - List all certificates for an employee
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

    const employeeId = params.id;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid Employee ID' } },
        { status: 400 }
      );
    }

    // Convert to ObjectId for query
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    // Authorization: Only HR/Admin or the employee themselves can view certificates
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin' && session.user.id !== employeeId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Query certificates using ObjectId
    const certificates = await EmployeeCertificate.find({ employeeId: employeeObjectId })
      .populate('validatedBy', 'firstName lastName')
      .populate('uploadedBy', 'firstName lastName')
      .sort({ expiryDate: 1 })
      .lean();

    return NextResponse.json({ success: true, data: certificates });
  } catch (error) {
    console.error('Error fetching employee certificates:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    );
  }
}

// POST - Create/upload a certificate for an employee
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const employeeId = params.id;
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid Employee ID' } },
        { status: 400 }
      );
    }

    // Authorization: Only HR/Admin or the employee themselves can upload certificates
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin' && session.user.id !== employeeId) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type');
    const certificateNumber = formData.get('certificateNumber');
    const issueDate = formData.get('issueDate');
    const expiryDate = formData.get('expiryDate');
    const notes = formData.get('notes');
    const uploadMethod = formData.get('uploadMethod') || 'file';

    // Validate file
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No file provided' },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file type. Only PDF, JPG, and PNG files are allowed',
          },
        },
        { status: 400 }
      );
    }

    // Validate other fields
    const validatedData = createCertificateSchema.parse({
      type,
      certificateNumber: certificateNumber || undefined,
      issueDate,
      expiryDate,
      notes: notes || undefined,
      uploadMethod,
    });

    // Determine file extension
    const fileExtension = file.type === 'application/pdf' ? 'pdf' :
                         file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 'png';

    // Upload file
    const uploadResult = await uploadFile(file, 'employee-certificates', {
      maxSize: 5 * 1024 * 1024, // 5MB
      filename: `cert_${employeeId}_${Date.now()}`,
      mimeType: file.type,
    });

    // Convert employeeId to ObjectId for consistency
    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);
    const uploadedByObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Create certificate record
    const certificate = await EmployeeCertificate.create({
      employeeId: employeeObjectId,
      type: validatedData.type,
      certificateNumber: validatedData.certificateNumber,
      documentUrl: uploadResult.url,
      documentType: fileExtension,
      issueDate: new Date(validatedData.issueDate),
      expiryDate: new Date(validatedData.expiryDate),
      notes: validatedData.notes,
      uploadMethod: validatedData.uploadMethod,
      uploadedBy: uploadedByObjectId,
      status: 'pending_validation',
    });

    const certificateResponse = await EmployeeCertificate.findById(certificate._id)
      .populate('uploadedBy', 'firstName lastName')
      .lean();

    return NextResponse.json(
      { success: true, data: certificateResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating employee certificate:', error);
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
    if (error.message?.includes('exceeds')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
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

