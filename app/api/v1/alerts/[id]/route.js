import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Alert } from '@/lib/models/Alert';
import mongoose from 'mongoose';

/**
 * GET /api/v1/alerts/[id]
 * 
 * Get a single alert by ID
 * 
 * Access: Contracts Manager, Admin only
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

    // Only Contracts Managers and Admin can access
    if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid alert ID' } },
        { status: 400 }
      );
    }

    const alert = await Alert.findById(params.id)
      .populate('siteId', 'name siteCode address')
      .populate('acknowledgedBy', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName email')
      .lean();

    if (!alert) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching alert',
        },
      },
      { status: 500 }
    );
  }
}

