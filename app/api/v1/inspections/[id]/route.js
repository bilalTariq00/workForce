import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Inspection } from '@/lib/models/Inspection';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for updating inspections
 */
const updateInspectionSchema = z.object({
  title: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
  checklistItems: z
    .array(
      z.object({
        category: z.string().max(100),
        item: z.string().max(500),
        status: z.enum(['pass', 'fail', 'na']),
        notes: z.string().max(500).optional(),
      })
    )
    .optional(),
  overallRating: z.enum(['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor']).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: z.string().or(z.date()).optional(),
  issues: z
    .array(
      z.object({
        description: z.string().max(1000),
        severity: z.enum(['low', 'medium', 'high', 'critical']),
        location: z.string().max(200).optional(),
        photoUrl: z.string().url().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.string().or(z.date()).optional(),
      })
    )
    .optional(),
});

/**
 * GET /api/v1/inspections/[id]
 * 
 * Get a single inspection by ID
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

    const inspection = await Inspection.findById(params.id)
      .populate('siteId', 'name siteCode')
      .populate('inspectorId', 'firstName lastName employeeId')
      .populate('issues.assignedTo', 'firstName lastName employeeId')
      .lean();

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inspection not found',
          },
        },
        { status: 404 }
      );
    }

    // Site Managers can only see inspections for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (
        !siteManager?.siteId ||
        inspection.siteId._id.toString() !== siteManager.siteId.toString()
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
      data: inspection,
    });

  } catch (error) {
    console.error('Error fetching inspection:', error);
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
 * PUT /api/v1/inspections/[id]
 * 
 * Update an inspection
 * 
 * Access:
 * - EHS officers: Can update their own inspections
 * - HR/Admin: Can update any inspection
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

    const inspection = await Inspection.findById(params.id);

    if (!inspection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inspection not found',
          },
        },
        { status: 404 }
      );
    }

    // EHS officers can only update their own inspections
    if (session.user.role === 'ehs_officer') {
      if (inspection.inspectorId.toString() !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only update your own inspections',
            },
          },
          { status: 403 }
        );
      }
    }

    // Can only update draft inspections
    if (!inspection.canEdit()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only update draft inspections',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateInspectionSchema.parse(body);

    // Update fields
    if (validatedData.title) inspection.title = validatedData.title;
    if (validatedData.notes !== undefined) inspection.notes = validatedData.notes;
    if (validatedData.checklistItems) inspection.checklistItems = validatedData.checklistItems;
    if (validatedData.overallRating) inspection.overallRating = validatedData.overallRating;
    if (validatedData.followUpRequired !== undefined) {
      inspection.followUpRequired = validatedData.followUpRequired;
    }
    if (validatedData.followUpDate !== undefined) {
      inspection.followUpDate = validatedData.followUpDate
        ? new Date(validatedData.followUpDate)
        : undefined;
    }

    // Update issues
    if (validatedData.issues) {
      inspection.issues = validatedData.issues.map((issue) => ({
        description: issue.description,
        severity: issue.severity,
        location: issue.location,
        photoUrl: issue.photoUrl,
        assignedTo: issue.assignedTo,
        dueDate: issue.dueDate ? new Date(issue.dueDate) : undefined,
        status: 'open',
      }));
    }

    await inspection.save();

    await inspection.populate('siteId', 'name siteCode');
    await inspection.populate('inspectorId', 'firstName lastName employeeId');
    await inspection.populate('issues.assignedTo', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: inspection,
      message: 'Inspection updated successfully',
    });

  } catch (error) {
    console.error('Error updating inspection:', error);

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
          message: 'An error occurred while updating inspection',
        },
      },
      { status: 500 }
    );
  }
}

