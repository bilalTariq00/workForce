import mongoose, { Schema } from 'mongoose';

/**
 * Payroll Run Model
 * 
 * Purpose: Track payroll runs and exports
 * Used in HR-05 (Payroll Run & Export)
 * 
 * Business Rules:
 * - One payroll run per pay period
 * - Includes multiple timesheets
 * - Calculates gross and net pay
 * - Can be exported to Sage
 * - Generates payslips
 */
const PayrollRunSchema = new Schema(
  {
    // Pay period
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },

    // Timesheets included in this payroll run
    timesheets: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Timesheet',
        required: true,
      },
    ],

    // Employees in this payroll run (auto-populated from timesheets)
    employees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    // Payroll items (detailed per-employee breakdown)
    payrollItems: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PayrollItem',
      },
    ],

    // Total amounts
    totalGross: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalNet: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalTax: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Payroll run status
    status: {
      type: String,
      enum: ['draft', 'calculated', 'exported', 'paid'],
      default: 'draft',
      required: true,
      index: true,
    },

    // Export information
    exportedToSage: {
      type: Boolean,
      default: false,
    },
    exportedAt: {
      type: Date,
    },
    exportFileUrl: {
      type: String,
    },
    exportFileName: {
      type: String,
    },

    // Payslip generation
    payslipsGenerated: {
      type: Boolean,
      default: false,
    },
    payslipsGeneratedAt: {
      type: Date,
    },

    // Created by
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware: Populate employees from timesheets and lock timesheets
 */
PayrollRunSchema.pre('save', async function (next) {
  if (this.timesheets && this.timesheets.length > 0) {
    const { Timesheet } = await import('@/lib/models/Timesheet');
    const timesheets = await Timesheet.find({
      _id: { $in: this.timesheets },
    }).select('employeeId status').lean();

    // Extract unique employee IDs
    const employeeIds = [...new Set(timesheets.map((t) => t.employeeId.toString()))];
    this.employees = employeeIds;

    // Auto-lock timesheets when included in payroll run (if not already locked)
    // This ensures timesheets are locked when added to a payroll run
    if (this.isNew || this.isModified('timesheets')) {
      const { Timesheet: TimesheetModel } = await import('@/lib/models/Timesheet');
      for (const timesheetId of this.timesheets) {
        const timesheet = await TimesheetModel.findById(timesheetId);
        if (timesheet && timesheet.status !== 'locked') {
          // Only lock if status is approved (safety check)
          if (timesheet.status === 'approved') {
            await timesheet.lock(this.createdBy || null);
          }
        }
      }
    }
  }
  next();
});

/**
 * Instance method: Calculate payroll
 */
PayrollRunSchema.methods.calculate = async function () {
  if (this.status !== 'draft') {
    throw new Error('Can only calculate draft payroll runs');
  }

  const { Timesheet } = await import('@/lib/models/Timesheet');
  const { Employee } = await import('@/lib/models/Employee');

  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;
  let totalDeductions = 0;

  // Calculate for each timesheet
  for (const timesheetId of this.timesheets) {
    const timesheet = await Timesheet.findById(timesheetId)
      .populate('employeeId')
      .lean();

    if (!timesheet || !timesheet.employeeId) {
      continue;
    }

    const employee = timesheet.employeeId;
    const payRate = employee.payRate || 0;
    const hours = timesheet.totalHours || 0;

    // Calculate gross pay
    const gross = payRate * hours;

    // Calculate tax (simplified - 20% for now)
    const tax = gross * 0.2;

    // Calculate deductions (simplified - can be extended)
    const deductions = 0;

    // Calculate net pay
    const net = gross - tax - deductions;

    totalGross += gross;
    totalNet += net;
    totalTax += tax;
    totalDeductions += deductions;
  }

  this.totalGross = Math.round(totalGross * 100) / 100;
  this.totalNet = Math.round(totalNet * 100) / 100;
  this.totalTax = Math.round(totalTax * 100) / 100;
  this.totalDeductions = Math.round(totalDeductions * 100) / 100;
  this.status = 'calculated';

  return this.save();
};

/**
 * Instance method: Mark as exported
 */
PayrollRunSchema.methods.markExported = function (exportFileUrl, exportFileName) {
  this.status = 'exported';
  this.exportedToSage = true;
  this.exportedAt = new Date();
  if (exportFileUrl) {
    this.exportFileUrl = exportFileUrl;
  }
  if (exportFileName) {
    this.exportFileName = exportFileName;
  }
  return this.save();
};

/**
 * Instance method: Mark payslips as generated
 */
PayrollRunSchema.methods.markPayslipsGenerated = function () {
  this.payslipsGenerated = true;
  this.payslipsGeneratedAt = new Date();
  return this.save();
};

// Indexes for performance
PayrollRunSchema.index({ periodStart: 1, periodEnd: 1 });
PayrollRunSchema.index({ status: 1, periodStart: -1 });
PayrollRunSchema.index({ createdBy: 1, periodStart: -1 });

export const PayrollRun =
  mongoose.models.PayrollRun || mongoose.model('PayrollRun', PayrollRunSchema);

