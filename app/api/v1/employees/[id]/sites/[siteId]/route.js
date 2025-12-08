import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { EmployeeSite } from '@/lib/models/EmployeeSite';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { z } from 'zod';

// Validation schema for updating site assignment
const updateSiteSchema = z.object({
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

// GET - Get specific site assignment
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

    const assignment = await EmployeeSite.findOne({
      employeeId: params.id,
      siteId: params.siteId,
      isActive: true,
    })
      .populate('siteId', 'name siteCode address location')
      .populate('employeeId', 'firstName lastName email employeeId')
      .populate('assignedBy', 'firstName lastName')
      .lean();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site assignment not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });

  } catch (error) {
    console.error('Error fetching site assignment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching site assignment',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH - Update site assignment
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can update site assignments
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateSiteSchema.parse(body);

    await connectDB();

    // Find the assignment
    const assignment = await EmployeeSite.findOne({
      employeeId: params.id,
      siteId: params.siteId,
      isActive: true,
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site assignment not found' } },
        { status: 404 }
      );
    }

    // Update fields
    if (validatedData.role !== undefined) {
      assignment.role = validatedData.role;
    }
    if (validatedData.notes !== undefined) {
      assignment.notes = validatedData.notes;
    }
    if (validatedData.isPrimary !== undefined) {
      if (validatedData.isPrimary) {
        // Set as primary (will unset others)
        await assignment.setAsPrimary();
      } else {
        assignment.isPrimary = false;
        await assignment.save();
      }
    } else {
      await assignment.save();
    }

    // Populate for response
    await assignment.populate('siteId', 'name siteCode address location');
    await assignment.populate('assignedBy', 'firstName lastName');

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Site assignment updated successfully',
    });

  } catch (error) {
    console.error('Error updating site assignment:', error);

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
          message: 'An error occurred while updating site assignment',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Unassign employee from site (soft delete)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can unassign employees from sites
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Find the assignment
    const assignment = await EmployeeSite.findOne({
      employeeId: params.id,
      siteId: params.siteId,
      isActive: true,
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site assignment not found' } },
        { status: 404 }
      );
    }

    // Deactivate assignment (soft delete)
    await assignment.deactivate();

    return NextResponse.json({
      success: true,
      message: 'Employee unassigned from site successfully',
    });

  } catch (error) {
    console.error('Error unassigning employee from site:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while unassigning employee from site',
        },
      },
      { status: 500 }
    );
  }
}

