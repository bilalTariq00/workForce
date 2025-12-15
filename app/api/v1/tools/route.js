import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Tool } from '@/lib/models/Tool';
import { checkPermission, checkModuleAccess } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

const toolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    'hand_tools',
    'power_tools',
    'safety_equipment',
    'heavy_machinery',
    'vehicles',
    'measuring_tools',
    'other',
  ]),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  totalQuantity: z.number().min(0),
  unit: z.enum(['unit', 'piece', 'set', 'pair']).optional(),
  condition: z.enum(['new', 'good', 'fair', 'poor', 'needs_repair']).optional(),
  location: z.string().optional(),
  cost: z.number().min(0).optional(),
  finePerDay: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// GET - List all tools with filters
export async function GET(req) {
  try {
    // Check module access
    const permissionCheck = await checkModuleAccess('equipment');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'active';
    const search = searchParams.get('search');

    const query = { status };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const tools = await Tool.find(query)
      .populate('createdBy', 'firstName lastName employeeId')
      .sort({ name: 1 });

    // Calculate statistics
    const stats = {
      totalTools: tools.length,
      totalQuantity: tools.reduce((sum, t) => sum + t.totalQuantity, 0),
      totalAvailable: tools.reduce((sum, t) => sum + t.availableQuantity, 0),
      totalAssigned: tools.reduce((sum, t) => sum + t.assignedQuantity, 0),
    };

    return NextResponse.json({
      success: true,
      data: tools,
      stats,
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools', message: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new tool
export async function POST(req) {
  try {
    // Check permission - requires 'equipment' module with 'create' action
    const permissionCheck = await checkPermission('equipment', 'create');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    await connectDB();

    const body = await req.json();
    const validatedData = toolSchema.parse(body);

    const tool = new Tool({
      ...validatedData,
      availableQuantity: validatedData.totalQuantity,
      assignedQuantity: 0,
      createdBy: user._id,
    });

    await tool.save();

    return NextResponse.json(
      {
        success: true,
        data: tool,
        message: 'Tool created successfully',
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
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool', message: error.message },
      { status: 500 }
    );
  }
}

