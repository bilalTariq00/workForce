import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import mongoose from 'mongoose';

// GET - Get single site
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid site ID' } },
        { status: 400 }
      );
    }

    const site = await Site.findById(params.id)
      .populate('contractsManagerId', 'firstName lastName email')
      .lean();

    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error fetching site:', error);
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

// DELETE - Delete site
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can delete sites
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid site ID' } },
        { status: 400 }
      );
    }

    const site = await Site.findByIdAndDelete(params.id);

    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Site deleted successfully' },
    });
  } catch (error) {
    console.error('Error deleting site:', error);
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


