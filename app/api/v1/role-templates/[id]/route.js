import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { RoleTemplate } from '@/lib/models/RoleTemplate';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import { z } from 'zod';

const updateRoleTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  baseRole: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']).optional(),
  isActive: z.boolean().optional(),
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
  ).optional(),
});

/**
 * GET /api/v1/role-templates/[id]
 * 
 * Get a single role template
 * 
 * Access: HR Officers, Admin
 */
export async function GET(req, { params }) {
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

    const template = await RoleTemplate.findById(params.id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching role template:', error);
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
 * PATCH /api/v1/role-templates/[id]
 * 
 * Update a role template
 * 
 * Access: HR Officers, Admin
 */
export async function PATCH(req, { params }) {
  try {
    // Check permission - requires 'hrm' module with 'edit' action
    const permissionCheck = await checkPermission('hrm', 'edit');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    const body = await req.json();
    const validatedData = updateRoleTemplateSchema.parse(body);

    await connectDB();

    const template = await RoleTemplate.findById(params.id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts
    if (validatedData.name && validatedData.name !== template.name) {
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
    }

    // Update template
    Object.assign(template, validatedData);
    await template.save();

    const templateResponse = await RoleTemplate.findById(template._id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: templateResponse,
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

    console.error('Error updating role template:', error);
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
 * DELETE /api/v1/role-templates/[id]
 * 
 * Delete a role template (cannot delete default templates)
 * 
 * Access: HR Officers, Admin
 */
export async function DELETE(req, { params }) {
  try {
    // Check permission - requires 'hrm' module with 'delete' action
    const permissionCheck = await checkPermission('hrm', 'delete');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const template = await RoleTemplate.findById(params.id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    // Only admins can delete default templates
    if (template.isDefault && permissionCheck.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete default template. Only admins can delete default templates.',
          },
        },
        { status: 403 }
      );
    }

    // Check if template is in use
    const { Employee } = await import('@/lib/models/Employee');
    const employeesUsingTemplate = await Employee.countDocuments({
      roleTemplateId: template._id,
    });

    if (employeesUsingTemplate > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_IN_USE',
            message: `Cannot delete template. ${employeesUsingTemplate} employee(s) are using this template.`,
          },
        },
        { status: 409 }
      );
    }

    // Delete template
    await RoleTemplate.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Role template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role template:', error);
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

