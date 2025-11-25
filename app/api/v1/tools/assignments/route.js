import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Tool } from '@/lib/models/Tool';
import { ToolAssignment } from '@/lib/models/ToolAssignment';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

const assignmentSchema = z.object({
  toolId: z.string(),
  employeeId: z.string(),
  quantity: z.number().min(1),
  expectedReturnDate: z.string().datetime(),
  notes: z.string().optional(),
});

// GET - List all assignments with filters
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employeeId = searchParams.get('employeeId');
    const toolId = searchParams.get('toolId');
    const overdue = searchParams.get('overdue') === 'true';

    const query = {};
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (toolId) query.toolId = toolId;
    if (overdue) {
      query.status = 'overdue';
      query.expectedReturnDate = { $lt: new Date() };
    }

    const assignments = await ToolAssignment.find(query)
      .populate('toolId', 'name category brand model finePerDay')
      .populate('employeeId', 'firstName lastName employeeId email phone')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('returnedTo', 'firstName lastName employeeId')
      .sort({ assignedDate: -1 });

    // Calculate overdue assignments
    const now = new Date();
    const overdueAssignments = assignments.filter(
      (a) =>
        a.status === 'assigned' &&
        new Date(a.expectedReturnDate) < now &&
        !a.actualReturnDate
    );

    // Update status for overdue assignments
    if (overdueAssignments.length > 0) {
      await ToolAssignment.updateMany(
        {
          _id: { $in: overdueAssignments.map((a) => a._id) },
        },
        { $set: { status: 'overdue' } }
      );
    }

    return NextResponse.json({
      success: true,
      data: assignments,
      stats: {
        total: assignments.length,
        assigned: assignments.filter((a) => a.status === 'assigned').length,
        overdue: assignments.filter((a) => a.status === 'overdue').length,
        returned: assignments.filter((a) => a.status === 'returned').length,
      },
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Assign tool to employee
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR officers and admins can assign tools
    if (!['hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR officers and admins can assign tools' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const validatedData = assignmentSchema.parse(body);

    // Check if tool exists and has available quantity
    const tool = await Tool.findById(validatedData.toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.availableQuantity < validatedData.quantity) {
      return NextResponse.json(
        {
          error: 'Insufficient quantity available',
          available: tool.availableQuantity,
          requested: validatedData.quantity,
        },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await Employee.findById(validatedData.employeeId);
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create assignment
    const assignment = new ToolAssignment({
      toolId: validatedData.toolId,
      employeeId: validatedData.employeeId,
      quantity: validatedData.quantity,
      expectedReturnDate: new Date(validatedData.expectedReturnDate),
      assignedBy: session.user.id,
      notes: validatedData.notes,
      status: 'assigned',
    });

    await assignment.save();

    // Update tool quantities
    tool.availableQuantity -= validatedData.quantity;
    tool.assignedQuantity += validatedData.quantity;
    await tool.save();

    // Populate assignment for response
    await assignment.populate([
      { path: 'toolId', select: 'name category brand model' },
      { path: 'employeeId', select: 'firstName lastName employeeId email' },
      { path: 'assignedBy', select: 'firstName lastName employeeId' },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: assignment,
        message: 'Tool assigned successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error assigning tool:', error);
    return NextResponse.json(
      { error: 'Failed to assign tool', message: error.message },
      { status: 500 }
    );
  }
}

