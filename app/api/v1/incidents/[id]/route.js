import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for updating incidents
 */
const updateIncidentSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).max(10).optional(),
  location: z.string().max(200).optional(),
  investigationNotes: z.string().max(5000).optional(),
});

/**
 * GET /api/v1/incidents/[id]
 * 
 * Get a single incident by ID
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

    const incident = await Incident.findById(params.id)
      .populate('siteId', 'name siteCode')
      .populate('reportedBy', 'firstName lastName employeeId')
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('actions.assignedTo', 'firstName lastName employeeId')
      .lean();

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

    // Employees and Site Managers can only see incidents for their assigned site
    if (['labour', 'site_manager'].includes(session.user.role)) {
      const employee = await Employee.findById(session.user.id).lean();
      if (
        !employee?.siteId ||
        incident.siteId._id.toString() !== employee.siteId.toString()
      ) {
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
      data: incident,
    });

  } catch (error) {
    console.error('Error fetching incident:', error);
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
 * PUT /api/v1/incidents/[id]
 * 
 * Update an incident
 * 
 * Access:
 * - Reporters: Can update their own reported incidents (if status is 'reported')
 * - EHS officers: Can update any incident
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

    // Reporters can only update their own incidents if status is 'reported'
    if (session.user.role !== 'ehs_officer' && session.user.role !== 'admin') {
      if (incident.reportedBy.toString() !== session.user.id) {
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
      if (incident.status !== 'reported') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only update incidents in "reported" status',
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validatedData = updateIncidentSchema.parse(body);

    // Update fields
    if (validatedData.severity) incident.severity = validatedData.severity;
    if (validatedData.description) incident.description = validatedData.description;
    if (validatedData.photos) incident.photos = validatedData.photos;
    if (validatedData.location !== undefined) incident.location = validatedData.location;
    if (validatedData.investigationNotes !== undefined) {
      incident.investigationNotes = validatedData.investigationNotes;
    }

    await incident.save();

    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');
    await incident.populate('assignedTo', 'firstName lastName employeeId');
    await incident.populate('actions.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident updated successfully',
    });

  } catch (error) {
    console.error('Error updating incident:', error);

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
          message: 'An error occurred while updating incident',
        },
      },
      { status: 500 }
    );
  }
}

