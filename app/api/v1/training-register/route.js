import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { TrainingRegister } from '@/lib/models/TrainingRegister';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for creating training records
 */
const createTrainingSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  trainingType: z.enum([
    'SafePass',
    'CSCS',
    'FirstAid',
    'ManualHandling',
    'WorkingAtHeight',
    'ConfinedSpace',
    'FireSafety',
    'ToolboxTalk',
    'Other',
  ]),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000).optional(),
  isMandatory: z.boolean().optional(),
  dueDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()).optional(),
  certificationId: z.string().optional(),
  provider: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * GET /api/v1/training-register
 * 
 * List training records with optional filters
 * 
 * Query parameters:
 * - employeeId: Filter by employee
 * - status: Filter by status
 * - trainingType: Filter by training type
 * - overdue: Filter overdue training
 * - dueSoon: Filter training due soon
 * 
 * Access:
 * - Employees: Can see their own training
 * - EHS/HR/Admin: Can see all training
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
    const trainingType = searchParams.get('trainingType');
    const overdue = searchParams.get('overdue') === 'true';
    const dueSoon = searchParams.get('dueSoon') === 'true';

    const query = {};

    // Employees can only see their own training
    if (session.user.role === 'labour') {
      query.employeeId = session.user.id;
    }

    // Apply filters
    if (employeeId) {
      if (['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
        query.employeeId = employeeId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (trainingType) {
      query.trainingType = trainingType;
    }

    let trainings;

    if (overdue) {
      trainings = await TrainingRegister.findOverdue();
    } else if (dueSoon) {
      trainings = await TrainingRegister.findDueSoon();
    } else {
      trainings = await TrainingRegister.find(query)
        .populate('employeeId', 'firstName lastName employeeId email')
        .populate('certificationId', 'type expiryDate status')
        .populate('assignedBy', 'firstName lastName')
        .sort({ dueDate: 1 })
        .lean();
    }

    return NextResponse.json({
      success: true,
      data: trainings,
    });

  } catch (error) {
    console.error('Error fetching training register:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching training register',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/training-register
 * 
 * Create a new training record
 * 
 * Access:
 * - EHS/HR/Admin only
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

    // Only EHS, HR, and Admin can create training records
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS and HR officers can create training records',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createTrainingSchema.parse(body);

    await connectDB();

    // Verify employee exists
    const employee = await Employee.findById(validatedData.employeeId);
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

    // Parse dates
    const dueDate = new Date(validatedData.dueDate);
    const expiryDate = validatedData.expiryDate
      ? new Date(validatedData.expiryDate)
      : undefined;

    // Create training record
    const training = new TrainingRegister({
      employeeId: validatedData.employeeId,
      trainingType: validatedData.trainingType,
      title: validatedData.title,
      description: validatedData.description,
      isMandatory: validatedData.isMandatory !== undefined ? validatedData.isMandatory : true,
      dueDate,
      expiryDate,
      certificationId: validatedData.certificationId,
      provider: validatedData.provider,
      notes: validatedData.notes,
      assignedBy: session.user.id,
      status: 'not_started',
    });

    await training.save();

    // Populate references
    await training.populate('employeeId', 'firstName lastName employeeId email');
    await training.populate('assignedBy', 'firstName lastName');

    return NextResponse.json(
      {
        success: true,
        data: training,
        message: 'Training record created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating training record:', error);

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
          message: 'An error occurred while creating training record',
        },
      },
      { status: 500 }
    );
  }
}

