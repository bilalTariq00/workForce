import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']),
  payRate: z.number().min(0).optional(),
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
});

// GET - List all employees
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can view all employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    const employees = await Employee.find({ status: { $ne: 'terminated' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Get assigned sites for each employee
    const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
    const employeesWithSites = await Promise.all(
      employees.map(async (employee) => {
        const assignedSites = await EmployeeSite.getEmployeeSites(employee._id);
        return {
          ...employee,
          assignedSites,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: employeesWithSites,
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
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

// POST - Create new employee
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only HR and Admin can create employees
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = createEmployeeSchema.parse(body);

    await connectDB();

    // Check if email already exists
    const existingEmployee = await Employee.findOne({ email: validatedData.email.toLowerCase() });
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

    // Generate employee ID
    const lastEmployee = await Employee.findOne().sort({ employeeId: -1 });
    let employeeId = 'EMP001';
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''));
      employeeId = `EMP${String(lastNum + 1).padStart(3, '0')}`;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Handle site assignments
    const { EmployeeSite } = await import('@/lib/models/EmployeeSite');
    const { Site } = await import('@/lib/models/Site');
    
    // Prepare employee data (exclude assignedSites - will handle separately)
    const { assignedSites, ...employeeData } = validatedData;
    
    // Validate sites if assignedSites provided
    if (assignedSites && assignedSites.length > 0) {
      for (const assignment of assignedSites) {
        const site = await Site.findById(assignment.siteId);
        if (!site) {
          return NextResponse.json(
            { success: false, error: { code: 'INVALID_SITE', message: `Site ${assignment.siteId} not found` } },
            { status: 400 }
          );
        }
      }
    }
    
    // Validate legacy siteId if provided (for backward compatibility)
    if (validatedData.siteId) {
      const site = await Site.findById(validatedData.siteId);
      if (!site) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_SITE', message: 'Site not found' } },
          { status: 400 }
        );
      }
    }

    // Create employee
    const employee = await Employee.create({
      ...employeeData,
      email: employeeData.email.toLowerCase(),
      password: hashedPassword,
      employeeId,
      createdBy: session.user.id,
      status: 'active',
    });

    // Create site assignments if provided
    if (assignedSites && assignedSites.length > 0) {
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
    } else if (validatedData.siteId) {
      // Legacy: Create single site assignment from siteId
      await EmployeeSite.create({
        employeeId: employee._id,
        siteId: validatedData.siteId,
        role: validatedData.role,
        isPrimary: true,
        assignedBy: session.user.id,
      });
    }

    const employeeResponse = employee.toObject();
    delete employeeResponse.password;

    // Get assigned sites for response
    const assignedSitesResponse = await EmployeeSite.getEmployeeSites(employee._id);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...employeeResponse,
          assignedSites: assignedSitesResponse,
        },
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

    console.error('Error creating employee:', error);
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

