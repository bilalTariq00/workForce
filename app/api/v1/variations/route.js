import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Variation } from '@/lib/models/Variation';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';

/**
 * Validation schema for creating variations
 */
const createVariationSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  cost: z.number().min(0, 'Cost must be positive'),
  delayDays: z.number().min(0, 'Delay days must be non-negative'),
  status: z.enum(['draft', 'pending']).optional(),
});

/**
 * GET /api/v1/variations
 * 
 * List variations with optional filters
 * 
 * Query parameters:
 * - siteId: Filter by site
 * - status: Filter by status
 * - siteManagerId: Filter by site manager
 * 
 * Access:
 * - Site Managers: Can see variations for their assigned site
 * - Contracts Managers: Can see all variations
 * - HR/Admin: Can see all variations
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
    const siteManagerId = searchParams.get('siteManagerId');

    const query = {};

    // Site Managers can only see variations for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (siteManager?.siteId) {
        query.siteId = siteManager.siteId;
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
      // Only CM/HR/Admin can filter by other sites
      if (['contracts_manager', 'hr_officer', 'admin'].includes(session.user.role)) {
        query.siteId = siteId;
      }
    }

    if (status) {
      query.status = status;
    }

    if (siteManagerId) {
      // Only CM/HR/Admin can filter by other site managers
      if (['contracts_manager', 'hr_officer', 'admin'].includes(session.user.role)) {
        query.siteManagerId = siteManagerId;
      }
    }

    const variations = await Variation.find(query)
      .populate('siteId', 'name siteCode')
      .populate('siteManagerId', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: variations,
    });

  } catch (error) {
    console.error('Error fetching variations:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching variations',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/variations
 * 
 * Create a new variation
 * 
 * Access:
 * - Site Managers: Can create variations for their assigned site
 * - Contracts Managers/HR/Admin: Can create variations for any site
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

    const body = await req.json();
    const validatedData = createVariationSchema.parse(body);

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

    // Site Managers can only create variations for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id);
      if (!siteManager || siteManager.siteId?.toString() !== validatedData.siteId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only create variations for your assigned site',
            },
          },
          { status: 403 }
        );
      }
    }

    // Create variation
    const variation = new Variation({
      siteId: validatedData.siteId,
      siteManagerId: session.user.id,
      title: validatedData.title,
      description: validatedData.description,
      cost: validatedData.cost,
      delayDays: validatedData.delayDays,
      status: validatedData.status || 'draft',
    });

    await variation.save();

    // Populate references
    await variation.populate('siteId', 'name siteCode');
    await variation.populate('siteManagerId', 'firstName lastName employeeId');

    return NextResponse.json(
      {
        success: true,
        data: variation,
        message: 'Variation created successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating variation:', error);

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
          message: 'An error occurred while creating variation',
        },
      },
      { status: 500 }
    );
  }
}

