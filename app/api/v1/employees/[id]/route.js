import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import mongoose from 'mongoose';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// GET - Get single employee
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

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const employee = await Employee.findById(params.id).select('-password').lean();

    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    // Get assigned sites
    const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
    const assignedSites = await EmployeeSite.getEmployeeSites(params.id);

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        assignedSites,
      },
    });

  } catch (error) {
    console.error('Error fetching employee:', error);
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

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']).optional(),
  payRate: z.number().min(0).optional(),
  status: z.enum(['active', 'inactive', 'terminated']).optional(),
  siteId: z.string().nullable().optional(), // Legacy: single site assignment (for backward compatibility)
  assignedSites: z.array(z.object({
    siteId: z.string(),
    role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']),
    isPrimary: z.boolean().optional().default(false),
    notes: z.string().max(500).optional(),
  })).optional(), // New: multi-site assignment
  annualLeaveBalance: z.number().min(0).optional(), // Annual leave balance in days
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    sortCode: z.string().optional(),
  }).optional(),
  // HR Data
  dateOfBirth: z.string().datetime().optional().or(z.string().date().optional()),
  nationalInsuranceNumber: z.string().regex(/^[A-Z]{2}[0-9]{6}[A-Z]{1}$/i).optional(),
  emergencyContact: z.object({
    name: z.string().min(1).max(100),
    relationship: z.enum(['spouse', 'parent', 'sibling', 'child', 'other']).optional(),
    phone: z.string().optional(),
  }).optional(),
  employmentDetails: z.object({
    startDate: z.string().datetime().optional().or(z.string().date().optional()),
    employmentType: z.enum(['full_time', 'part_time', 'contractor', 'temporary']).optional(),
    department: z.string().max(100).optional(),
    position: z.string().max(100).optional(),
  }).optional(),
  // Payroll Data
  payroll: z.object({
    payType: z.enum(['hourly', 'salary', 'daily']).optional(),
    currency: z.enum(['GBP', 'EUR', 'USD']).optional(),
    taxCode: z.string().regex(/^[A-Z]{0,2}[0-9]{1,4}[A-Z]{0,1}$/i).optional(),
    pensionScheme: z.string().max(100).optional(),
    pensionContribution: z.number().min(0).max(100).optional(),
    studentLoan: z.boolean().optional(),
    studentLoanPlan: z.enum(['plan1', 'plan2', 'plan4', 'postgraduate']).optional(),
    otherDeductions: z.array(z.object({
      name: z.string().min(1).max(100),
      amount: z.number().min(0),
      type: z.enum(['fixed', 'percentage']).default('fixed'),
    })).optional(),
  }).optional(),
  // Role Template
  roleTemplateId: z.string().optional(),
});

// PATCH - Update employee
export async function PATCH(req, { params }) {
  try {
    // Await params for Next.js 15+ compatibility (backward compatible)
    const resolvedParams = params instanceof Promise ? await params : params;
    const employeeId = resolvedParams.id;

    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can update employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const body = await req.json();
    console.log('PATCH /api/v1/employees/[id] - Updating employee:', employeeId, 'with data:', body);
    
    const validatedData = updateEmployeeSchema.parse(body);
    console.log('Validated data:', validatedData);

    // Check if email is being updated and if it already exists
    if (validatedData.email) {
      const existingEmployee = await Employee.findOne({ 
        email: validatedData.email.toLowerCase(),
        _id: { $ne: params.id }
      });
      if (existingEmployee) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'Email already exists',
            },
          },
          { status: 409 }
        );
      }
      validatedData.email = validatedData.email.toLowerCase();
    }

    // Hash password if provided
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

    // Validate role template if provided
    if (validatedData.roleTemplateId) {
      const { RoleTemplate } = await import('@/lib/models/RoleTemplate');
      const roleTemplate = await RoleTemplate.findById(validatedData.roleTemplateId);
      if (!roleTemplate) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_ROLE_TEMPLATE', message: 'Role template not found' } },
          { status: 400 }
        );
      }
    }

    // Handle site assignments
    const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
    const { Site } = await import('@/lib/models/Site');
    
    // Extract assignedSites if provided
    const { assignedSites, ...employeeUpdateData } = validatedData;
    
    // Handle legacy siteId assignment/unassignment (for backward compatibility)
    if (employeeUpdateData.siteId !== undefined) {
      if (employeeUpdateData.siteId === null || employeeUpdateData.siteId === '') {
        employeeUpdateData.siteId = null; // Unassign from site
      } else {
        // Validate that the site exists
        const site = await Site.findById(employeeUpdateData.siteId);
        if (!site) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SITE', message: 'Site not found' } },
            { status: 400 }
          );
        }
      }
    }

    // Update employee
    const employee = await Employee.findByIdAndUpdate(
      employeeId,
      { $set: employeeUpdateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      console.error('Employee not found:', employeeId);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    // Handle multi-site assignments if provided
    if (assignedSites !== undefined) {
      // Validate all sites exist
      for (const assignment of assignedSites) {
        const site = await Site.findById(assignment.siteId);
        if (!site) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SITE', message: `Site ${assignment.siteId} not found` } },
            { status: 400 }
          );
        }
      }

      // Deactivate all existing assignments
      await EmployeeSite.updateMany(
        { employeeId, isActive: true },
        { $set: { isActive: false } }
      );

      // Create new assignments
      if (assignedSites.length > 0) {
        const assignments = [];
        for (const assignment of assignedSites) {
          const siteAssignment = await EmployeeSite.create({
            employeeId: employee._id,
            siteId: assignment.siteId,
            role: assignment.role,
            isPrimary: assignment.isPrimary || false,
            assignedBy: session.user.id,
            notes: assignment.notes,
          });
          
          // If this is primary, set it as primary (will unset others)
          if (assignment.isPrimary) {
            await siteAssignment.setAsPrimary();
          }
          
          assignments.push(siteAssignment);
        }
        
        // If no primary was set, set the first one as primary
        if (!assignments.some(a => a.isPrimary)) {
          await assignments[0].setAsPrimary();
        }
      }
    }

    // Get updated assigned sites
    const updatedAssignedSites = await EmployeeSite.getEmployeeSites(employeeId);

    console.log('Employee updated successfully:', employee._id, 'New role:', employee.role);
    return NextResponse.json({
      success: true,
      data: {
        ...employee.toObject(),
        assignedSites: updatedAssignedSites,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
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

    console.error('Error updating employee:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete employee
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can delete employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_ID', message: 'Invalid employee ID' } },
        { status: 400 }
      );
    }

    const employee = await Employee.findByIdAndUpdate(
      params.id,
      { status: 'terminated' },
      { new: true }
    ).select('-password');

    if (!employee) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: employee,
    });

  } catch (error) {
    console.error('Error deleting employee:', error);
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

