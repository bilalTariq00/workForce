import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { TrainingRegister } from '@/lib/models/TrainingRegister';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for updating training records
 */
const updateTrainingSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'overdue', 'expired']).optional(),
  completedDate: z.string().or(z.date()).optional(),
  certificateUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/training-register/[id]
 * 
 * Get a single training record by ID
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

    const training = await TrainingRegister.findById(params.id)
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('certificationId', 'type expiryDate status documentUrl')
      .populate('assignedBy', 'firstName lastName')
      .lean();

    if (!training) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Training record not found',
          },
        },
        { status: 404 }
      );
    }

    // Employees can only see their own training
    if (session.user.role === 'labour') {
      if (training.employeeId._id.toString() !== session.user.id) {
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
    }

    return NextResponse.json({
      success: true,
      data: training,
    });

  } catch (error) {
    console.error('Error fetching training record:', error);
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
 * PUT /api/v1/training-register/[id]
 * 
 * Update a training record
 * 
 * Access:
 * - Employees: Can update their own training status
 * - EHS/HR/Admin: Can update any training
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

    const training = await TrainingRegister.findById(params.id);

    if (!training) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Training record not found',
          },
        },
        { status: 404 }
      );
    }

    // Employees can only update their own training
    if (session.user.role === 'labour') {
      if (training.employeeId.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only update your own training records',
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validatedData = updateTrainingSchema.parse(body);

    // Update fields
    if (validatedData.status) training.status = validatedData.status;
    if (validatedData.completedDate) {
      training.completedDate = new Date(validatedData.completedDate);
      if (validatedData.status !== 'completed') {
        training.status = 'completed';
      }
    }
    if (validatedData.certificateUrl) training.certificateUrl = validatedData.certificateUrl;
    if (validatedData.notes !== undefined) training.notes = validatedData.notes;

    await training.save();

    await training.populate('employeeId', 'firstName lastName employeeId email');
    await training.populate('certificationId', 'type expiryDate status');
    await training.populate('assignedBy', 'firstName lastName');

    return NextResponse.json({
      success: true,
      data: training,
      message: 'Training record updated successfully',
    });

  } catch (error) {
    console.error('Error updating training record:', error);

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
          message: 'An error occurred while updating training record',
        },
      },
      { status: 500 }
    );
  }
}

