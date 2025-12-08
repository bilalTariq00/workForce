import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'],
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      index: true,
    },
    payRate: {
      type: Number,
      min: 0,
    },
    bankDetails: {
      accountNumber: String,
      sortCode: String,
    },
    // Annual leave balance (in days)
    annualLeaveBalance: {
      type: Number,
      min: 0,
      default: 0,
    },
    // HR Data
    dateOfBirth: {
      type: Date,
    },
    nationalInsuranceNumber: {
      type: String,
      trim: true,
      uppercase: true,
      // UK NI format: 2 letters, 6 digits, 1 letter (e.g., AB123456C)
      match: [/^[A-Z]{2}[0-9]{6}[A-Z]{1}$/, 'Invalid National Insurance number format'],
    },
    emergencyContact: {
      name: {
        type: String,
        maxlength: 100,
      },
      relationship: {
        type: String,
        enum: ['spouse', 'parent', 'sibling', 'child', 'other'],
      },
      phone: {
        type: String,
      },
    },
    employmentDetails: {
      startDate: {
        type: Date,
      },
      employmentType: {
        type: String,
        enum: ['full_time', 'part_time', 'contractor', 'temporary'],
        default: 'full_time',
      },
      department: {
        type: String,
        maxlength: 100,
      },
      position: {
        type: String,
        maxlength: 100,
      },
    },
    // Payroll Data
    payroll: {
      payType: {
        type: String,
        enum: ['hourly', 'salary', 'daily'],
        default: 'hourly',
      },
      payRate: {
        type: Number,
        min: 0,
      },
      currency: {
        type: String,
        enum: ['GBP', 'EUR', 'USD'],
        default: 'GBP',
      },
      taxCode: {
        type: String,
        trim: true,
        uppercase: true,
        // UK tax code format: Letter(s) + numbers (e.g., 1250L, BR, D0)
        match: [/^[A-Z]{0,2}[0-9]{1,4}[A-Z]{0,1}$/, 'Invalid UK tax code format'],
      },
      nationalInsuranceNumber: {
        type: String,
        trim: true,
        uppercase: true,
        // Duplicate for payroll reference
      },
      pensionScheme: {
        type: String,
        maxlength: 100,
      },
      pensionContribution: {
        type: Number,
        min: 0,
        max: 100,
        default: 0, // Percentage
      },
      studentLoan: {
        type: Boolean,
        default: false,
      },
      studentLoanPlan: {
        type: String,
        enum: ['plan1', 'plan2', 'plan4', 'postgraduate'],
      },
      otherDeductions: [{
        name: {
          type: String,
          required: true,
          maxlength: 100,
        },
        amount: {
          type: Number,
          min: 0,
        },
        type: {
          type: String,
          enum: ['fixed', 'percentage'],
          default: 'fixed',
        },
      }],
    },
    // Role Template Reference
    roleTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'RoleTemplate',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    purchasedModules: [{
      moduleCode: {
        type: String,
        enum: ['hrm', 'registers', 'process_management', 'finance_payroll', 'equipment', 'procurement'],
      },
      purchasedAt: {
        type: Date,
        default: Date.now,
      },
      isAdmin: {
        type: Boolean,
        default: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: email and employeeId already have unique indexes from schema definition
EmployeeSchema.index({ role: 1, status: 1 });

export const Employee =
  mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

