import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Tool } from '@/lib/models/Tool';
import { ToolRequest } from '@/lib/models/ToolRequest';
import { ToolAssignment } from '@/lib/models/ToolAssignment';
import { z } from 'zod';

const requestSchema = z.object({
  toolId: z.string(),
  quantity: z.number().min(1),
  expectedStartDate: z.string().datetime(),
  expectedReturnDate: z.string().datetime(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
});

const approveRequestSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
});

// GET - List tool requests
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

    const query = {};
    if (status) query.status = status;
    // If not HR/admin, only show user's own requests
    if (!['hr_officer', 'admin'].includes(session.user.role)) {
      query.employeeId = session.user.id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    const requests = await ToolRequest.find(query)
      .populate('toolId', 'name category brand model availableQuantity')
      .populate('employeeId', 'firstName lastName employeeId email')
      .populate('approvedBy', 'firstName lastName employeeId')
      .sort({ requestedDate: -1 });

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create tool request
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const validatedData = requestSchema.parse(body);

    // Check if tool exists
    const tool = await Tool.findById(validatedData.toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Check if requested quantity is available
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

    // Create request
    const request = new ToolRequest({
      employeeId: session.user.id,
      toolId: validatedData.toolId,
      quantity: validatedData.quantity,
      expectedStartDate: new Date(validatedData.expectedStartDate),
      expectedReturnDate: new Date(validatedData.expectedReturnDate),
      purpose: validatedData.purpose,
      notes: validatedData.notes,
      status: 'pending',
    });

    await request.save();

    await request.populate([
      { path: 'toolId', select: 'name category brand model' },
      { path: 'employeeId', select: 'firstName lastName employeeId email' },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: request,
        message: 'Tool request created successfully',
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
    console.error('Error creating request:', error);
    return NextResponse.json(
      { error: 'Failed to create request', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Approve/Reject request
export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only HR officers and admins can approve/reject requests
    if (!['hr_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only HR officers and admins can approve requests' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { requestId, ...validatedData } = approveRequestSchema.parse(body);

    if (!body.requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const request = await ToolRequest.findById(body.requestId).populate('toolId');
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (request.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    if (validatedData.status === 'approved') {
      // Check if tool still has available quantity
      if (request.toolId.availableQuantity < request.quantity) {
        return NextResponse.json(
          {
            error: 'Insufficient quantity available',
            available: request.toolId.availableQuantity,
            requested: request.quantity,
          },
          { status: 400 }
        );
      }

      // Create assignment
      const assignment = new ToolAssignment({
        toolId: request.toolId._id,
        employeeId: request.employeeId,
        quantity: request.quantity,
        expectedReturnDate: request.expectedReturnDate,
        assignedBy: session.user.id,
        notes: request.notes || `Approved from request ${request._id}`,
        status: 'assigned',
      });

      await assignment.save();

      // Update tool quantities
      request.toolId.availableQuantity -= request.quantity;
      request.toolId.assignedQuantity += request.quantity;
      await request.toolId.save();

      // Update request
      request.status = 'fulfilled';
      request.approvedBy = session.user.id;
      request.approvedDate = new Date();
      request.assignmentId = assignment._id;
    } else {
      // Rejected
      request.status = 'rejected';
      request.approvedBy = session.user.id;
      request.approvedDate = new Date();
      request.rejectionReason = validatedData.rejectionReason;
    }

    await request.save();

    await request.populate([
      { path: 'toolId', select: 'name category brand model' },
      { path: 'employeeId', select: 'firstName lastName employeeId email' },
      { path: 'approvedBy', select: 'firstName lastName employeeId' },
    ]);

    return NextResponse.json({
      success: true,
      data: request,
      message: `Request ${validatedData.status} successfully`,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', message: error.message },
      { status: 500 }
    );
  }
}

