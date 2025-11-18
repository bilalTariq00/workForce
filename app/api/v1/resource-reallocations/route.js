import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ResourceReallocation } from '@/lib/models/ResourceReallocation';
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for creating resource reallocations
 */
const createReallocationSchema = z.object({
  fromSiteId: z.string().min(1, 'Source site is required'),
  toSiteId: z.string().min(1, 'Destination site is required'),
  resourceType: z.enum(['crew', 'plant', 'equipment']),
  employeeIds: z.array(z.string()).optional(),
  plantDetails: z
    .object({
      name: z.string().optional(),
      type: z.string().optional(),
      registrationNumber: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  effectiveDate: z.string().or(z.date()),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason must be less than 1000 characters'),
});

/**
 * GET /api/v1/resource-reallocations
 * 
 * List resource reallocations with optional filters
 * 
 * Query parameters:
 * - fromSiteId: Filter by source site
 * - toSiteId: Filter by destination site
 * - status: Filter by status
 * - resourceType: Filter by resource type
 * 
 * Access:
 * - Contracts Managers: Can see all reallocations
 * - Site Managers: Can see reallocations for their assigned site
 * - HR/Admin: Can see all reallocations
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
    const fromSiteId = searchParams.get('fromSiteId');
    const toSiteId = searchParams.get('toSiteId');
    const status = searchParams.get('status');
    const resourceType = searchParams.get('resourceType');

    const query = {};

    // Site Managers can only see reallocations for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (siteManager?.siteId) {
        query.$or = [
          { fromSiteId: siteManager.siteId },
          { toSiteId: siteManager.siteId },
        ];
      } else {
        // No site assigned, return empty
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    // Apply filters
    if (fromSiteId) {
      query.fromSiteId = fromSiteId;
    }

    if (toSiteId) {
      query.toSiteId = toSiteId;
    }

    if (status) {
      query.status = status;
    }

    if (resourceType) {
      query.resourceType = resourceType;
    }

    const reallocations = await ResourceReallocation.find(query)
      .populate('fromSiteId', 'name siteCode')
      .populate('toSiteId', 'name siteCode')
      .populate('employeeIds', 'firstName lastName employeeId')
      .populate('requestedBy', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: reallocations,
    });

  } catch (error) {
    console.error('Error fetching resource reallocations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching resource reallocations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/resource-reallocations
 * 
 * Create a new resource reallocation request
 * 
 * Access:
 * - Contracts Managers/HR/Admin only
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

    // Only Contracts Managers, HR, and Admin can create reallocations
    if (
      !['contracts_manager', 'hr_officer', 'admin'].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only Contracts Managers can create resource reallocations',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createReallocationSchema.parse(body);

    await connectDB();

    // Verify sites exist
    const fromSite = await Site.findById(validatedData.fromSiteId);
    const toSite = await Site.findById(validatedData.toSiteId);

    if (!fromSite || !toSite) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'One or both sites not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot reallocate to the same site
    if (validatedData.fromSiteId === validatedData.toSiteId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Source and destination sites must be different',
          },
        },
        { status: 400 }
      );
    }

    // Validate resource type specific requirements
    if (validatedData.resourceType === 'crew') {
      if (!validatedData.employeeIds || validatedData.employeeIds.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Employee IDs are required for crew reallocation',
            },
          },
          { status: 400 }
        );
      }

      // Verify employees exist and are assigned to source site
      const employees = await Employee.find({
        _id: { $in: validatedData.employeeIds },
        siteId: validatedData.fromSiteId,
        status: 'active',
      });

      if (employees.length !== validatedData.employeeIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Some employees not found or not assigned to source site',
            },
          },
          { status: 400 }
        );
      }
    } else if (validatedData.resourceType === 'plant' || validatedData.resourceType === 'equipment') {
      if (!validatedData.plantDetails || !validatedData.plantDetails.name) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Plant/equipment details are required',
            },
          },
          { status: 400 }
        );
      }
    }

    // Parse effective date
    const effectiveDate = new Date(validatedData.effectiveDate);

    // Create reallocation
    const reallocation = new ResourceReallocation({
      fromSiteId: validatedData.fromSiteId,
      toSiteId: validatedData.toSiteId,
      resourceType: validatedData.resourceType,
      employeeIds: validatedData.employeeIds || [],
      plantDetails: validatedData.plantDetails,
      effectiveDate,
      reason: validatedData.reason,
      status: 'pending',
      requestedBy: session.user.id,
    });

    await reallocation.save();

    // Populate references
    await reallocation.populate('fromSiteId', 'name siteCode');
    await reallocation.populate('toSiteId', 'name siteCode');
    await reallocation.populate('employeeIds', 'firstName lastName employeeId');
    await reallocation.populate('requestedBy', 'firstName lastName employeeId');

    return NextResponse.json(
      {
        success: true,
        data: reallocation,
        message: 'Resource reallocation request created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating resource reallocation:', error);

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
          message: 'An error occurred while creating resource reallocation',
        },
      },
      { status: 500 }
    );
  }
}

