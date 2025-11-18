import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Variation } from '@/lib/models/Variation';
import { z } from 'zod';

/**
 * Validation schema for updating variations
 */
const updateVariationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  cost: z.number().min(0).optional(),
  delayDays: z.number().min(0).optional(),
});

/**
 * GET /api/v1/variations/[id]
 * 
 * Get a single variation by ID
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

    const variation = await Variation.findById(params.id)
      .populate('siteId', 'name siteCode')
      .populate('siteManagerId', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName employeeId')
      .lean();

    if (!variation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Variation not found',
          },
        },
        { status: 404 }
      );
    }

    // Site Managers can only see variations for their assigned site
    if (session.user.role === 'site_manager') {
      if (variation.siteManagerId._id.toString() !== session.user.id) {
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
      data: variation,
    });

  } catch (error) {
    console.error('Error fetching variation:', error);
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
 * PUT /api/v1/variations/[id]
 * 
 * Update a variation
 * 
 * Access:
 * - Site Managers: Can update their own draft/rejected variations
 * - Contracts Managers/HR/Admin: Can update any variation
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

    const variation = await Variation.findById(params.id);

    if (!variation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Variation not found',
          },
        },
        { status: 404 }
      );
    }

    // Site Managers can only update their own draft/rejected variations
    if (session.user.role === 'site_manager') {
      if (variation.siteManagerId.toString() !== session.user.id) {
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
      if (!variation.canEdit()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot edit variation in current status',
            },
          },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const validatedData = updateVariationSchema.parse(body);

    // Update fields
    if (validatedData.title) variation.title = validatedData.title;
    if (validatedData.description) variation.description = validatedData.description;
    if (validatedData.cost !== undefined) variation.cost = validatedData.cost;
    if (validatedData.delayDays !== undefined) variation.delayDays = validatedData.delayDays;

    await variation.save();

    await variation.populate('siteId', 'name siteCode');
    await variation.populate('siteManagerId', 'firstName lastName employeeId');
    await variation.populate('approvedBy', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: variation,
      message: 'Variation updated successfully',
    });

  } catch (error) {
    console.error('Error updating variation:', error);

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
          message: 'An error occurred while updating variation',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/variations/[id]
 * 
 * Delete a variation
 * 
 * Access:
 * - Site Managers: Can delete their own draft/rejected variations
 * - Contracts Managers/HR/Admin: Can delete any variation
 */
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const variation = await Variation.findById(params.id);

    if (!variation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Variation not found',
          },
        },
        { status: 404 }
      );
    }

    // Site Managers can only delete their own draft/rejected variations
    if (session.user.role === 'site_manager') {
      if (variation.siteManagerId.toString() !== session.user.id) {
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
      if (!variation.canEdit()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot delete variation in current status',
            },
          },
          { status: 403 }
        );
      }
    }

    await variation.deleteOne();

    return NextResponse.json({
      success: true,
      message: 'Variation deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting variation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting variation',
        },
      },
      { status: 500 }
    );
  }
}

