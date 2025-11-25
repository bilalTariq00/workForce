import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Tool } from '@/lib/models/Tool';
import { ToolAssignment } from '@/lib/models/ToolAssignment';
import { z } from 'zod';

const updateToolSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z
    .enum([
      'hand_tools',
      'power_tools',
      'safety_equipment',
      'heavy_machinery',
      'vehicles',
      'measuring_tools',
      'other',
    ])
    .optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  totalQuantity: z.number().min(0).optional(),
  unit: z.enum(['unit', 'piece', 'set', 'pair']).optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'needs_repair']).optional(),
  location: z.string().optional(),
  cost: z.number().min(0).optional(),
  finePerDay: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'disposed']).optional(),
  notes: z.string().optional(),
});

// GET - Get single tool with assignment details
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tool = await Tool.findById(params.id).populate(
      'createdBy',
      'firstName lastName employeeId'
    );

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Get current assignments
    const assignments = await ToolAssignment.find({
      toolId: params.id,
      status: { $in: ['assigned', 'overdue'] },
    })
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('assignedBy', 'firstName lastName employeeId')
      .sort({ assignedDate: -1 });

    return NextResponse.json({
      success: true,
      data: {
        tool,
        assignments,
      },
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update tool
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR officers and admins can update tools
    if (!['hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR officers and admins can update tools' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const validatedData = updateToolSchema.parse(body);

    const tool = await Tool.findById(params.id);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // If totalQuantity is being updated, adjust availableQuantity
    if (validatedData.totalQuantity !== undefined) {
      const quantityDiff = validatedData.totalQuantity - tool.totalQuantity;
      validatedData.availableQuantity = Math.max(
        0,
        tool.availableQuantity + quantityDiff
      );
    }

    Object.assign(tool, validatedData);
    await tool.save();

    return NextResponse.json({
      success: true,
      data: tool,
      message: 'Tool updated successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating tool:', error);
    return NextResponse.json(
      { error: 'Failed to update tool', message: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete tool (soft delete by setting status to disposed)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR officers and admins can delete tools
    if (!['hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR officers and admins can delete tools' },
        { status: 403 }
      );
    }

    await connectDB();

    const tool = await Tool.findById(params.id);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Check if there are active assignments
    const activeAssignments = await ToolAssignment.countDocuments({
      toolId: params.id,
      status: { $in: ['assigned', 'overdue'] },
    });

    if (activeAssignments > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete tool with active assignments',
          activeAssignments,
        },
        { status: 400 }
      );
    }

    // Soft delete
    tool.status = 'disposed';
    await tool.save();

    return NextResponse.json({
      success: true,
      message: 'Tool deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json(
      { error: 'Failed to delete tool', message: error.message },
      { status: 500 }
    );
  }
}

