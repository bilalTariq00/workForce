import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';
import mongoose from 'mongoose';

const updateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.object({
    street: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    postcode: z.string().min(1).optional(),
    country: z.string().optional(),
  }).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  attendanceRadius: z.number().min(10).max(1000).optional(),
  contractsManagerId: z.string().nullable().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - Get single site
export async function GET(req, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const siteId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid site ID' } },
        { status: 400 }
      );
    }

    const site = await Site.findById(siteId)
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

// PATCH - Update site
export async function PATCH(req, { params }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const siteId = resolvedParams.id;

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR, Admin, and Contracts Manager can update sites
    if (
      session.user.role !== 'hr_officer' &&
      session.user.role !== 'admin' &&
      session.user.role !== 'contracts_manager'
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid site ID' } },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = updateSiteSchema.parse(body);

    // Handle date conversion
    if (validatedData.startDate) {
      validatedData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate) {
      validatedData.endDate = new Date(validatedData.endDate);
    }

    // Handle contractsManagerId
    if (validatedData.contractsManagerId === null || validatedData.contractsManagerId === '') {
      validatedData.contractsManagerId = null;
    }

    // Update site
    const site = await Site.findByIdAndUpdate(
      siteId,
      { $set: validatedData },
      { new: true, runValidators: true }
    )
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

    console.error('Error updating site:', error);
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
    const resolvedParams = params instanceof Promise ? await params : params;
    const siteId = resolvedParams.id;

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

    if (!mongoose.Types.ObjectId.isValid(siteId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid site ID' } },
        { status: 400 }
      );
    }

    const site = await Site.findByIdAndDelete(siteId);

    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Site deleted successfully',
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
