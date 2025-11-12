import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';

const createSiteSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    postcode: z.string().min(1),
    country: z.string().default('UK'),
  }),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  attendanceRadius: z.number().min(10).max(1000).default(100),
  contractsManagerId: z.string().optional(), // Made optional - can be Site Manager or Contracts Manager
  status: z.enum(['planning', 'active', 'completed', 'on_hold']).default('active'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET - List all sites
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

    const sites = await Site.find()
      .populate('contractsManagerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sites,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
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

// POST - Create new site
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR, Admin, and Contracts Manager can create sites
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

    const body = await req.json();
    const validatedData = createSiteSchema.parse(body);

    await connectDB();

    // Generate site code
    const lastSite = await Site.findOne().sort({ siteCode: -1 });
    let siteCode = 'SITE001';
    if (lastSite && lastSite.siteCode) {
      const lastNum = parseInt(lastSite.siteCode.replace('SITE', ''));
      siteCode = `SITE${String(lastNum + 1).padStart(3, '0')}`;
    }

    // Create site
    // Note: contractsManagerId field is being used to store Site Manager ID
    const site = await Site.create({
      ...validatedData,
      siteCode,
      contractsManagerId: validatedData.contractsManagerId || undefined, // Optional
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    });

    // If a Site Manager was selected, automatically assign them to this site
    // This sets the Site Manager's siteId field so they can access the site in their dashboard
    if (validatedData.contractsManagerId) {
      const { Employee } = await import('@/lib/models/Employee');
      const siteManager = await Employee.findById(validatedData.contractsManagerId);
      
      if (siteManager && siteManager.role === 'site_manager') {
        // Assign the Site Manager to this site
        siteManager.siteId = site._id;
        await siteManager.save();
        console.log(`Site Manager ${siteManager.firstName} ${siteManager.lastName} assigned to site ${site.name}`);
      }
    }

    const siteResponse = await Site.findById(site._id)
      .populate('contractsManagerId', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: siteResponse,
      },
      { status: 201 }
    );
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

    console.error('Error creating site:', error);
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

