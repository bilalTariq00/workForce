import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ResourceReallocation } from '@/lib/models/ResourceReallocation';
import { Employee } from '@/lib/models/Employee';

/**
 * GET /api/v1/resource-reallocations/[id]
 * 
 * Get a single resource reallocation by ID
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

    const reallocation = await ResourceReallocation.findById(params.id)
      .populate('fromSiteId', 'name siteCode')
      .populate('toSiteId', 'name siteCode')
      .populate('employeeIds', 'firstName lastName employeeId')
      .populate('requestedBy', 'firstName lastName employeeId')
      .populate('approvedBy', 'firstName lastName employeeId')
      .lean();

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

    // Site Managers can only see reallocations for their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (
        siteManager?.siteId &&
        reallocation.fromSiteId._id.toString() !== siteManager.siteId.toString() &&
        reallocation.toSiteId._id.toString() !== siteManager.siteId.toString()
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
      data: reallocation,
    });

  } catch (error) {
    console.error('Error fetching resource reallocation:', error);
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

