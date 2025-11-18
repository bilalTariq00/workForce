import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { z } from 'zod';

/**
 * Validation schema for updating action status
 */
const updateActionSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']),
  notes: z.string().max(500).optional(),
});

/**
 * PUT /api/v1/incidents/[id]/actions/[actionId]
 * 
 * Update a corrective action status
 * 
 * Access:
 * - Assigned employee: Can update their own actions
 * - EHS officers/HR/Admin: Can update any action
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

    const incident = await Incident.findById(params.id);

    if (!incident) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Incident not found',
          },
        },
        { status: 404 }
      );
    }

    // Find the action
    const action = incident.actions.id(params.actionId);
    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Action not found',
          },
        },
        { status: 404 }
      );
    }

    // Employees can only update their own actions
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      if (action.assignedTo.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only update your own assigned actions',
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validatedData = updateActionSchema.parse(body);

    // Update action
    action.status = validatedData.status;
    if (validatedData.notes !== undefined) {
      action.notes = validatedData.notes;
    }
    if (validatedData.status === 'completed') {
      action.completedAt = new Date();
    }

    await incident.save();

    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');
    await incident.populate('assignedTo', 'firstName lastName employeeId');
    await incident.populate('actions.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Action updated successfully',
    });

  } catch (error) {
    console.error('Error updating action:', error);

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
          message: 'An error occurred while updating action',
        },
      },
      { status: 500 }
    );
  }
}

