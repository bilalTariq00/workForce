import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Inspection } from '@/lib/models/Inspection';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';

/**
 * Validation schema for creating inspections
 */
const createInspectionSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  type: z.enum(['safety', 'environmental', 'compliance', 'general']),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  inspectionDate: z.string().or(z.date()),
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
});

/**
 * GET /api/v1/inspections
 * 
 * List inspections with optional filters
 * 
 * Query parameters:
 * - siteId: Filter by site
 * - status: Filter by status
 * - type: Filter by inspection type
 * - inspectorId: Filter by inspector
 * 
 * Access:
 * - EHS officers: Can see all inspections
 * - Site Managers: Can see inspections for their assigned site
 * - HR/Admin: Can see all inspections
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
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const inspectorId = searchParams.get('inspectorId');

    const query = {};

    // Site Managers can only see inspections for their assigned site
    if (session.user.role === 'site_manager') {
      const { Employee } = await import('@/lib/models/Employee');
      const siteManager = await Employee.findById(session.user.id).lean();
      if (siteManager?.siteId) {
        query.siteId = siteManager.siteId;
      } else {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    // Apply filters
    if (siteId) {
      if (['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
        query.siteId = siteId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (inspectorId) {
      if (['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
        query.inspectorId = inspectorId;
      } else if (session.user.role === 'ehs_officer' && inspectorId === session.user.id) {
        query.inspectorId = inspectorId;
      }
    }

    const inspections = await Inspection.find(query)
      .populate('siteId', 'name siteCode')
      .populate('inspectorId', 'firstName lastName employeeId')
      .populate('issues.assignedTo', 'firstName lastName employeeId')
      .sort({ inspectionDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: inspections,
    });

  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching inspections',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/inspections
 * 
 * Create a new inspection
 * 
 * Access:
 * - EHS officers/HR/Admin only
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

    // Only EHS officers, HR, and Admin can create inspections
    if (!['ehs_officer', 'hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only EHS officers can create inspections',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createInspectionSchema.parse(body);

    await connectDB();

    // Verify site exists
    const site = await Site.findById(validatedData.siteId);
    if (!site) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Site not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse dates
    const inspectionDate = new Date(validatedData.inspectionDate);
    const followUpDate = validatedData.followUpDate
      ? new Date(validatedData.followUpDate)
      : undefined;

    // Create inspection
    const inspection = new Inspection({
      siteId: validatedData.siteId,
      inspectorId: session.user.id,
      type: validatedData.type,
      title: validatedData.title,
      inspectionDate,
      notes: validatedData.notes,
      checklistItems: validatedData.checklistItems || [],
      overallRating: validatedData.overallRating,
      followUpRequired: validatedData.followUpRequired || false,
      followUpDate,
      status: 'draft',
    });

    await inspection.save();

    // Populate references
    await inspection.populate('siteId', 'name siteCode');
    await inspection.populate('inspectorId', 'firstName lastName employeeId');

    return NextResponse.json(
      {
        success: true,
        data: inspection,
        message: 'Inspection created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating inspection:', error);

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
          message: 'An error occurred while creating inspection',
        },
      },
      { status: 500 }
    );
  }
}

