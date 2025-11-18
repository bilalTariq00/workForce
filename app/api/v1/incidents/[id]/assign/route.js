import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for assigning incidents
 */
const assignIncidentSchema = z.object({
  assignedTo: z.string().min(1, 'Assigned EHS officer is required'),
});

/**
 * POST /api/v1/incidents/[id]/assign
 * 
 * Assign an incident to an EHS officer for investigation
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

    // Only EHS officers, HR, and Admin can assign incidents
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS officers can assign incidents',
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

    // Can only assign reported or under_investigation incidents
    if (!incident.canAssign()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only assign incidents in "reported" or "under_investigation" status',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = assignIncidentSchema.parse(body);

    // Verify assigned employee is an EHS officer
    const assignedEmployee = await Employee.findById(validatedData.assignedTo);
    if (!assignedEmployee) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Assigned employee not found',
          },
        },
        { status: 404 }
      );
    }

    if (assignedEmployee.role !== 'ehs_officer') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Can only assign to EHS officers',
          },
        },
        { status: 400 }
      );
    }

    // Assign incident
    incident.assignedTo = validatedData.assignedTo;
    incident.status = 'under_investigation';
    incident.investigationStartedAt = new Date();
    await incident.save();

    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');
    await incident.populate('assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident assigned successfully',
    });

  } catch (error) {
    console.error('Error assigning incident:', error);

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
          message: 'An error occurred while assigning incident',
        },
      },
      { status: 500 }
    );
  }
}

