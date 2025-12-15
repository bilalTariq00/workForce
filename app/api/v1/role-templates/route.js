import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { RoleTemplate } from '@/lib/models/RoleTemplate';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

const createRoleTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  baseRole: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']).optional(),
  isDefault: z.boolean().optional().default(false),
  permissions: z.array(
    z.object({
      module: z.enum([
        'hrm',
        'registers',
        'process_management',
        'finance_payroll',
        'equipment',
        'procurement',
        'attendance',
        'certifications',
        'timesheets',
        'leave_requests',
        'sites',
        'reports',
      ]),
      actions: z.array(
        z.enum(['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'])
      ),
    })
  ),
});

/**
 * GET /api/v1/role-templates
 * 
 * List all role templates
 * 
 * Access: HR Officers, Admin
 */
export async function GET(req) {
  try {
    // Check permission - requires 'hrm' module with 'view' action
    const permissionCheck = await checkPermission('hrm', 'view');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const baseRole = searchParams.get('baseRole');
    const isActive = searchParams.get('isActive');

    const query = {};
    if (baseRole) {
      query.baseRole = baseRole;
    }
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    const templates = await RoleTemplate.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('Error fetching role templates:', error);
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

/**
 * POST /api/v1/role-templates
 * 
 * Create a new role template
 * 
 * Access: HR Officers, Admin
 */
export async function POST(req) {
  try {
    // Check permission - requires 'hrm' module with 'create' action
    const permissionCheck = await checkPermission('hrm', 'create');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const user = permissionCheck.user;
    const body = await req.json();
    const validatedData = createRoleTemplateSchema.parse(body);

    await connectDB();

    // Check if template name already exists
    const existingTemplate = await RoleTemplate.findOne({ name: validatedData.name });
    if (existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'Template name already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create template
    const template = await RoleTemplate.create({
      ...validatedData,
      createdBy: user._id,
    });

    const templateResponse = await RoleTemplate.findById(template._id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: templateResponse,
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

    console.error('Error creating role template:', error);
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

