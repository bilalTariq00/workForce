import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import { checkPermission, checkModuleAccess } from '@/lib/middleware/permissionMiddleware';
import { hasPermission } from '@/lib/utils/permissions';
import { z } from 'zod';

/**
 * Validation schema for creating incidents
 */
const createIncidentSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  type: z.enum(['incident', 'near_miss']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  photos: z.array(z.string().url()).max(10, 'Maximum 10 photos allowed').optional(),
  location: z.string().max(200).optional(),
  occurredAt: z.string().or(z.date()),
});

/**
 * GET /api/v1/incidents
 * 
 * List incidents with optional filters
 * 
 * Query parameters:
 * - siteId: Filter by site
 * - status: Filter by status
 * - severity: Filter by severity
 * - type: Filter by type (incident/near_miss)
 * - assignedTo: Filter by assigned EHS officer
 * 
 * Access:
 * - All authenticated users: Can see incidents for their assigned site
 * - EHS/HR/Admin: Can see all incidents
 */
export async function GET(req) {
  try {
    // Check module access - incidents are part of reports module
    const permissionCheck = await checkModuleAccess('reports');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    await connectDB();

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const assignedTo = searchParams.get('assignedTo');

    const query = {};

    // Check if user can only see incidents for their assigned sites
    const canManage = hasPermission(user, 'reports', 'manage') || user.role === 'admin';
    
    if (!canManage) {
      // Get user's assigned sites
      const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
      const siteAssignments = await EmployeeSite.getEmployeeSites(user._id);
      if (siteAssignments.length > 0) {
        query.siteId = { $in: siteAssignments.map(s => s.siteId._id || s.siteId) };
      } else {
        // No site assigned, return empty
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    // Apply filters
    if (siteId) {
      // Only users with manage permission can filter by other sites
      if (canManage) {
        query.siteId = siteId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (type) {
      query.type = type;
    }

    if (assignedTo) {
      // Only users with manage permission can filter by assigned officer
      if (canManage) {
        query.assignedTo = assignedTo;
      } else if (assignedTo === user._id.toString()) {
        // Users can see incidents assigned to them
        query.assignedTo = assignedTo;
      }
    }

    const incidents = await Incident.find(query)
      .populate('siteId', 'name siteCode')
      .populate('reportedBy', 'firstName lastName employeeId')
      .populate('assignedTo', 'firstName lastName employeeId')
      .populate('actions.assignedTo', 'firstName lastName employeeId')
      .sort({ occurredAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: incidents,
    });

  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching incidents',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/incidents
 * 
 * Create a new incident report
 * 
 * Access:
 * - All authenticated users (employees, site managers, EHS officers)
 */
export async function POST(req) {
  try {
    // Check permission - requires 'reports' module with 'create' action
    const permissionCheck = await checkPermission('reports', 'create');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    const body = await req.json();
    const validatedData = createIncidentSchema.parse(body);

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

    // Check if user can only report for their assigned sites
    const canManage = hasPermission(user, 'reports', 'manage') || user.role === 'admin';
    
    if (!canManage) {
      // Get user's assigned sites
      const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
      const siteAssignments = await EmployeeSite.getEmployeeSites(user._id);
      const assignedSiteIds = siteAssignments.map(s => s.siteId._id?.toString() || s.siteId.toString());
      
      if (!assignedSiteIds.includes(validatedData.siteId)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only report incidents for your assigned site',
            },
          },
          { status: 403 }
        );
      }
    }

    // Parse occurredAt date
    const occurredAt = new Date(validatedData.occurredAt);

    // Create incident
    const incident = new Incident({
      siteId: validatedData.siteId,
      reportedBy: user._id,
      type: validatedData.type,
      severity: validatedData.severity,
      description: validatedData.description,
      photos: validatedData.photos || [],
      location: validatedData.location,
      occurredAt,
      status: 'reported',
    });

    await incident.save();

    // Populate references
    await incident.populate('siteId', 'name siteCode');
    await incident.populate('reportedBy', 'firstName lastName employeeId');

    return NextResponse.json(
      {
        success: true,
        data: incident,
        message: 'Incident reported successfully. EHS will review and investigate.',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating incident:', error);

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
          message: 'An error occurred while creating incident',
        },
      },
      { status: 500 }
    );
  }
}

