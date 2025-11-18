import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { z } from 'zod';

/**
 * Validation schema for resolving incidents
 */
const resolveIncidentSchema = z.object({
  investigationNotes: z.string().max(5000).optional(),
  actions: z
    .array(
      z.object({
        description: z.string().min(1).max(1000),
        assignedTo: z.string().min(1),
        dueDate: z.string().or(z.date()),
        notes: z.string().max(500).optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/v1/incidents/[id]/resolve
 * 
 * Resolve an incident (mark as resolved with investigation notes and actions)
 * 
 * Access:
 * - EHS officers/HR/Admin only
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

    // Only EHS officers, HR, and Admin can resolve incidents
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS officers can resolve incidents',
          },
        },
        { status: 403 }
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

    // Can only resolve incidents under investigation
    if (!incident.canResolve()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only resolve incidents under investigation',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = resolveIncidentSchema.parse(body);

    // Update incident
    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    if (validatedData.investigationNotes) {
      incident.investigationNotes = validatedData.investigationNotes;
    }

    // Add corrective actions if provided
    if (validatedData.actions && validatedData.actions.length > 0) {
      incident.actions = validatedData.actions.map((action) => ({
        description: action.description,
        assignedTo: action.assignedTo,
        dueDate: new Date(action.dueDate),
        status: 'pending',
        notes: action.notes || '',
      }));
    }

    await incident.save();

    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');
    await incident.populate('assignedTo', 'firstName lastName employeeId');
    await incident.populate('actions.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident resolved successfully',
    });

  } catch (error) {
    console.error('Error resolving incident:', error);

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
          message: 'An error occurred while resolving incident',
        },
      },
      { status: 500 }
    );
  }
}

