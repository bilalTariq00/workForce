import mongoose, { Schema } from 'mongoose';

/**
 * Timesheet Model
 * 
 * Purpose: Track weekly hours worked by employees
 * Auto-generated from attendance records
 * Used in HR-04 (Timesheet Approval) for payroll processing
 * 
 * Business Rules:
 * - One timesheet per employee per week
 * - Auto-generated from attendance records
 * - Cannot edit after "locked" status
 * - Total hours = sum of daily hours
 */
const TimesheetSchema = new Schema(
  {
    // Employee this timesheet belongs to
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Week start date (Monday)
    weekStartDate: {
      type: Date,
      required: true,
    },

    // Week end date (Sunday)
    weekEndDate: {
      type: Date,
      required: true,
    },

    // Daily hours breakdown
    hours: [
      {
        // Date of work
        date: {
          type: Date,
          required: true,
        },
        // Hours worked on this date
        hours: {
          type: Number,
          required: true,
          min: 0,
          max: 24,
        },
        // Reference to attendance record
        attendanceId: {
          type: Schema.Types.ObjectId,
          ref: 'Attendance',
        },
        // Site where work was performed
        siteId: {
          type: Schema.Types.ObjectId,
          ref: 'Site',
        },
      },
    ],

    // Total hours for the week (auto-calculated)
    totalHours: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Timesheet status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'locked'],
      default: 'draft',
      required: true,
    },

    // Approval information
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvedAt: {
      type: Date,
    },
    approvalNotes: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    // Lock information
    lockedAt: {
      type: Date,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
TimesheetSchema.index({ employeeId: 1, weekStartDate: -1 }, { unique: true });
TimesheetSchema.index({ status: 1, weekStartDate: -1 });
TimesheetSchema.index({ employeeId: 1, status: 1 });

/**
 * Pre-save middleware: Calculate total hours
 */
TimesheetSchema.pre('save', function (next) {
  if (this.hours && this.hours.length > 0) {
    this.totalHours = this.hours.reduce((sum, day) => sum + (day.hours || 0), 0);
    // Round to 2 decimal places
    this.totalHours = Math.round(this.totalHours * 100) / 100;
  } else {
    this.totalHours = 0;
  }
  next();
});

/**
 * Instance method: Approve timesheet
 */
TimesheetSchema.methods.approve = function (approvedBy, notes) {
  if (this.status !== 'submitted' && this.status !== 'draft') {
    throw new Error('Can only approve submitted or draft timesheets');
  }

  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  if (notes) {
    this.approvalNotes = notes;
  }

  return this.save();
};

/**
 * Instance method: Lock timesheet for payroll
 */
TimesheetSchema.methods.lock = function (lockedBy) {
  if (this.status !== 'approved') {
    throw new Error('Can only lock approved timesheets');
  }

  this.status = 'locked';
  this.lockedAt = new Date();
  this.lockedBy = lockedBy;

  return this.save();
};

/**
 * Static method: Get week start date (Monday) for a given date
 */
TimesheetSchema.statics.getWeekStart = function (date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
};

/**
 * Static method: Get week end date (Sunday) for a given date
 */
TimesheetSchema.statics.getWeekEnd = function (date = new Date()) {
  const weekStart = this.getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
};

export const Timesheet =
  mongoose.models.Timesheet || mongoose.model('Timesheet', TimesheetSchema);

