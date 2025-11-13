import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Alert } from '@/lib/models/Alert';
import mongoose from 'mongoose';
import { z } from 'zod';

const acknowledgeAlertSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/v1/alerts/[id]/acknowledge
 * 
 * Acknowledge an alert
 * 
 * Access: Contracts Manager, Admin only
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

    // Only Contracts Managers and Admin can acknowledge alerts
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

    const alert = await Alert.findById(params.id);

    if (!alert) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Alert not found' } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = acknowledgeAlertSchema.parse(body);

    // Acknowledge the alert
    await alert.acknowledge(session.user.id, validatedData.notes);

    // Populate before returning
    const populatedAlert = await Alert.findById(alert._id)
      .populate('siteId', 'name siteCode')
      .populate('acknowledgedBy', 'firstName lastName')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedAlert,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while acknowledging alert',
        },
      },
      { status: 500 }
    );
  }
}

