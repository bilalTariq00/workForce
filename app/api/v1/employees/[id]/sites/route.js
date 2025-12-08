import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeSite } from '@/lib/models/EmployeeSite';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';

// Validation schema for assigning employee to site
const assignSiteSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']),
  isPrimary: z.boolean().optional().default(false),
  notes: z.string().max(500).optional(),
});

// GET - List all sites for an employee
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR, Admin, or the employee themselves can view
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin' && session.user.id !== params.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    const employeeId = params.id;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    // Get all active site assignments
    const sites = await EmployeeSite.getEmployeeSites(employeeId);

    return NextResponse.json({
      success: true,
      data: sites,
    });

  } catch (error) {
    console.error('Error fetching employee sites:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching employee sites',
        },
      },
      { status: 500 }
    );
  }
}

// POST - Assign employee to a site
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can assign employees to sites
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = assignSiteSchema.parse(body);

    await connectDB();

    const employeeId = params.id;

    // Verify employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    // Verify site exists
    const site = await Site.findById(validatedData.siteId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_SITE', message: 'Site not found' } },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await EmployeeSite.findOne({
      employeeId,
      siteId: validatedData.siteId,
      isActive: true,
    });

    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: { code: 'DUPLICATE_ASSIGNMENT', message: 'Employee is already assigned to this site' } },
        { status: 409 }
      );
    }

    // Create new assignment
    const assignment = await EmployeeSite.create({
      employeeId,
      siteId: validatedData.siteId,
      role: validatedData.role,
      isPrimary: validatedData.isPrimary,
      assignedBy: session.user.id,
      notes: validatedData.notes,
    });

    // If this is set as primary, unset others
    if (validatedData.isPrimary) {
      await assignment.setAsPrimary();
    }

    // Populate for response
    await assignment.populate('siteId', 'name siteCode address location');
    await assignment.populate('assignedBy', 'firstName lastName');

    return NextResponse.json(
      {
        success: true,
        data: assignment,
        message: 'Employee assigned to site successfully',
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error assigning employee to site:', error);

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
          message: 'An error occurred while assigning employee to site',
        },
      },
      { status: 500 }
    );
  }
}

