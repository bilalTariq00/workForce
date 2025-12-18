import mongoose, { Schema } from 'mongoose';

/**
 * PayrollItem Model
 * 
 * Purpose: Store detailed per-employee payroll breakdown for a payroll run
 * Used in HR-05 (Payroll Run & Export)
 * 
 * Business Rules:
 * - One PayrollItem per employee per payroll run
 * - Contains detailed breakdown of all calculations
 * - Links to timesheet(s) used for calculation
 * - Stores all deductions and contributions
 */
const PayrollItemSchema = new Schema(
  {
    // Payroll run this item belongs to
    payrollRunId: {
      type: Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true,
    },

    // Employee this payroll item is for
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Timesheet(s) used for this calculation
    timesheetIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Timesheet',
        required: true,
      },
    ],

    // Site(s) where work was performed
    siteIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Site',
      },
    ],

    // Hours breakdown
    hours: {
      // Total hours worked
      total: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      // Regular hours (up to standard work week)
      regular: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      // Overtime hours (above standard work week)
      overtime: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    // Pay rates
    payRates: {
      // Regular pay rate
      regular: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      // Overtime pay rate (if different)
      overtime: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Gross pay breakdown
    grossPay: {
      // Regular pay (regular hours × regular rate)
      regular: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      // Overtime pay (overtime hours × overtime rate)
      overtime: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      // Total gross pay
      total: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    // Tax calculation (PAYE)
    tax: {
      // Personal allowance used
      personalAllowanceUsed: {
        type: Number,
        min: 0,
        default: 0,
      },
      // Taxable income (gross - personal allowance)
      taxableIncome: {
        type: Number,
        min: 0,
        default: 0,
      },
      // Tax by band
      byBand: [
        {
          band: {
            type: String,
            enum: ['basic', 'higher', 'additional'],
          },
          income: {
            type: Number,
            min: 0,
          },
          rate: {
            type: Number,
            min: 0,
            max: 100,
          },
          amount: {
            type: Number,
            min: 0,
          },
        },
      ],
      // Total tax
      total: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    // National Insurance (Employee)
    nationalInsurance: {
      employee: {
        // Earnings subject to NI
        earnings: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Standard rate NI (12%)
        standardRate: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Additional rate NI (2% above upper limit)
        additionalRate: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Total employee NI
        total: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
      employer: {
        // Earnings subject to employer NI
        earnings: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Employer NI (13.8%)
        total: {
          type: Number,
          required: true,
          min: 0,
          default: 0,
        },
      },
    },

    // Pension contributions
    pension: {
      employee: {
        // Contribution rate (%)
        rate: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        // Contribution amount
        amount: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Pensionable earnings
        earnings: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
      employer: {
        // Contribution rate (%)
        rate: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        // Contribution amount
        amount: {
          type: Number,
          min: 0,
          default: 0,
        },
        // Pensionable earnings
        earnings: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
      // Pension scheme used
      schemeCode: {
        type: String,
      },
    },

    // Student loan deductions
    studentLoan: {
      // Plan type (Plan 1, Plan 2, Plan 4, Postgraduate)
      plan: {
        type: String,
        enum: ['Plan 1', 'Plan 2', 'Plan 4', 'Postgraduate', null],
        default: null,
      },
      // Threshold for this plan
      threshold: {
        type: Number,
        min: 0,
        default: 0,
      },
      // Rate (%)
      rate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      // Deduction amount
      amount: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Other deductions (from employee.payroll.otherDeductions)
    otherDeductions: [
      {
        description: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Total deductions
    totalDeductions: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Net pay (gross - all deductions)
    netPay: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Employer cost (gross + employer NI + employer pension)
    employerCost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Calculation metadata
    calculationDate: {
      type: Date,
      default: Date.now,
    },
    taxYear: {
      type: String,
      required: true,
    },
    taxConfigId: {
      type: Schema.Types.ObjectId,
      ref: 'TaxConfig',
    },
    niConfigId: {
      type: Schema.Types.ObjectId,
      ref: 'NIConfig',
    },
    pensionConfigId: {
      type: Schema.Types.ObjectId,
      ref: 'PensionConfig',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PayrollItemSchema.index({ payrollRunId: 1, employeeId: 1 }, { unique: true });
PayrollItemSchema.index({ employeeId: 1, calculationDate: -1 });
PayrollItemSchema.index({ payrollRunId: 1 });

/**
 * Pre-save middleware: Calculate totals
 */
PayrollItemSchema.pre('save', function (next) {
  // Calculate total deductions
  const deductions = [
    this.tax.total || 0,
    this.nationalInsurance.employee.total || 0,
    this.pension.employee.amount || 0,
    this.studentLoan.amount || 0,
    ...(this.otherDeductions || []).map(d => d.amount || 0),
  ];
  this.totalDeductions = Math.round(
    deductions.reduce((sum, val) => sum + val, 0) * 100
  ) / 100;

  // Calculate net pay
  this.netPay = Math.round(
    (this.grossPay.total - this.totalDeductions) * 100
  ) / 100;

  // Calculate employer cost
  this.employerCost = Math.round(
    (this.grossPay.total +
      (this.nationalInsurance.employer.total || 0) +
      (this.pension.employer.amount || 0)) *
      100
  ) / 100;

  next();
});

export const PayrollItem =
  mongoose.models.PayrollItem || mongoose.model('PayrollItem', PayrollItemSchema);

