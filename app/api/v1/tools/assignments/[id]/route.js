import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Tool } from '@/lib/models/Tool';
import { ToolAssignment } from '@/lib/models/ToolAssignment';
import { z } from 'zod';

const returnToolSchema = z.object({
  actualReturnDate: z.string().datetime().optional(),
  returnCondition: z.enum(['good', 'fair', 'poor', 'damaged', 'lost']).optional(),
  notes: z.string().optional(),
  finePaid: z.boolean().optional(),
});

// GET - Get single assignment
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const assignment = await ToolAssignment.findById(params.id)
      .populate('toolId', 'name category brand model finePerDay')
      .populate('employeeId', 'firstName lastName employeeId email phone')
      .populate('assignedBy', 'firstName lastName employeeId')
      .populate('returnedTo', 'firstName lastName employeeId');

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check if user has permission (HR, admin, or the assigned employee)
    if (
      !['hr_officer', 'admin'].includes(session.user.role) &&
      assignment.employeeId._id.toString() !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Return tool or update assignment
export async function PATCH(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = returnToolSchema.parse(body);

    const assignment = await ToolAssignment.findById(params.id).populate('toolId');
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Check permissions
    const isHR = ['hr_officer', 'admin'].includes(session.user.role);
    const isAssignedEmployee = assignment.employeeId.toString() === session.user.id;

    if (!isHR && !isAssignedEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If returning the tool
    if (validatedData.actualReturnDate || assignment.status === 'assigned') {
      const returnDate = validatedData.actualReturnDate
        ? new Date(validatedData.actualReturnDate)
        : new Date();

      // Calculate fine if overdue
      let fineAmount = 0;
      if (assignment.expectedReturnDate < returnDate) {
        const daysLate = Math.ceil(
          (returnDate - assignment.expectedReturnDate) / (1000 * 60 * 60 * 24)
        );
        if (daysLate > 1 && assignment.toolId.finePerDay) {
          fineAmount = daysLate * assignment.toolId.finePerDay * assignment.quantity;
        }
      }

      assignment.status = validatedData.returnCondition === 'lost' ? 'lost' : 'returned';
      assignment.actualReturnDate = returnDate;
      assignment.returnCondition = validatedData.returnCondition || 'good';
      assignment.fineAmount = fineAmount;
      assignment.finePaid = validatedData.finePaid || false;
      if (validatedData.finePaid) {
        assignment.finePaidDate = new Date();
      }
      assignment.returnedTo = isHR ? session.user.id : assignment.returnedTo;
      if (validatedData.notes) {
        assignment.notes = validatedData.notes;
      }

      await assignment.save();

      // Update tool quantities
      const tool = await Tool.findById(assignment.toolId._id);
      if (tool) {
        tool.availableQuantity += assignment.quantity;
        tool.assignedQuantity -= assignment.quantity;
        await tool.save();
      }
    } else {
      // Update other fields
      Object.assign(assignment, validatedData);
      await assignment.save();
    }

    await assignment.populate([
      { path: 'toolId', select: 'name category brand model' },
      { path: 'employeeId', select: 'firstName lastName employeeId email' },
      { path: 'assignedBy', select: 'firstName lastName employeeId' },
      { path: 'returnedTo', select: 'firstName lastName employeeId' },
    ]);

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Tool returned successfully',
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error returning tool:', error);
    return NextResponse.json(
      { error: 'Failed to return tool', message: error.message },
      { status: 500 }
    );
  }
}

