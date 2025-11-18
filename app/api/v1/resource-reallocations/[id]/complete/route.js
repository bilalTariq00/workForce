import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ResourceReallocation } from '@/lib/models/ResourceReallocation';

/**
 * POST /api/v1/resource-reallocations/[id]/complete
 * 
 * Mark a resource reallocation as completed
 * 
 * Access:
 * - Site Managers: Can complete reallocations for their assigned site
 * - Contracts Managers/HR/Admin: Can complete any reallocation
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

    await connectDB();

    const reallocation = await ResourceReallocation.findById(params.id);

    if (!reallocation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource reallocation not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only complete approved reallocations
    if (!reallocation.canComplete()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only complete approved reallocations after effective date',
          },
        },
        { status: 403 }
      );
    }

    // Site Managers can only complete reallocations for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (
        !siteManager?.siteId ||
        (reallocation.fromSiteId.toString() !== siteManager.siteId.toString() &&
          reallocation.toSiteId.toString() !== siteManager.siteId.toString())
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Can only complete reallocations for your assigned site',
            },
          },
          { status: 403 }
        );
      }
    }

    // Mark as completed
    reallocation.status = 'completed';
    reallocation.completedAt = new Date();
    await reallocation.save();

    await reallocation.populate('fromSiteId', 'name siteCode');
    await reallocation.populate('toSiteId', 'name siteCode');
    await reallocation.populate('employeeIds', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: reallocation,
      message: 'Resource reallocation marked as completed',
    });

  } catch (error) {
    console.error('Error completing resource reallocation:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while completing resource reallocation',
        },
      },
      { status: 500 }
    );
  }
}

