import mongoose, { Schema } from 'mongoose';

/**
 * Leave Request Model
 * 
 * Purpose: Track employee leave requests and approvals
 * Used in LB-03 (Leave/Absence Request) and HR-03 (Leave Balance Management)
 * 
 * Business Rules:
 * - Cannot overlap with existing approved leave
 * - Days calculated excluding weekends
 * - Auto-updates employee leave balance on approval
 * - Status: pending -> approved/rejected
 */
const LeaveRequestSchema = new Schema(
  {
    // Employee requesting leave
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Leave type
    type: {
      type: String,
      enum: ['annual', 'sick', 'unpaid', 'compassionate'],
      required: true,
      index: true,
    },

    // Leave start date
    startDate: {
      type: Date,
      required: true,
      index: true,
      // Set to start of day
      set: (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },

    // Leave end date
    endDate: {
      type: Date,
      required: true,
      // Set to end of day
      set: (date) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d;
      },
    },

    // Number of days (excluding weekends)
    days: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Reason for leave
    reason: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },

    // Request status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },

    // Approver information
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Calculate number of days excluding weekends
 */
function calculateDays(startDate, endDate) {
  let days = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Count only weekdays (Monday=1 to Friday=5)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Pre-save middleware: Calculate days and validate
 */
LeaveRequestSchema.pre('save', function (next) {
  // Calculate days excluding weekends
  if (this.startDate && this.endDate) {
    this.days = calculateDays(this.startDate, this.endDate);
  }

  // Validate end date is after start date
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be after start date'));
  }

  // Validate dates are in the future (for new requests)
  if (this.isNew && this.startDate < new Date()) {
    return next(new Error('Start date must be in the future'));
  }

  next();
});

/**
 * Static method: Check for overlapping leave
 */
LeaveRequestSchema.statics.hasOverlappingLeave = async function (
  employeeId,
  startDate,
  endDate,
  excludeId = null
) {
  const query = {
    employeeId,
    status: 'approved',
    $or: [
      // Start date within existing leave
      {
        startDate: { $lte: startDate },
        endDate: { $gte: startDate },
      },
      // End date within existing leave
      {
        startDate: { $lte: endDate },
        endDate: { $gte: endDate },
      },
      // Existing leave completely within new leave
      {
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      },
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const overlapping = await this.findOne(query);
  return !!overlapping;
};

/**
 * Instance method: Approve leave request
 */
LeaveRequestSchema.methods.approve = async function (approvedBy) {
  if (this.status !== 'pending') {
    throw new Error('Can only approve pending leave requests');
  }

  // Check for overlapping approved leave
  const LeaveRequest = mongoose.model('LeaveRequest');
  const hasOverlap = await LeaveRequest.hasOverlappingLeave(
    this.employeeId,
    this.startDate,
    this.endDate,
    this._id
  );

  if (hasOverlap) {
    throw new Error('Leave request overlaps with existing approved leave');
  }

  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();

  // Update employee leave balance (if annual leave)
  if (this.type === 'annual') {
    const { Employee } = await import('@/lib/models/Employee');
    const employee = await Employee.findById(this.employeeId);
    if (employee) {
      // Deduct from annual leave balance
      employee.annualLeaveBalance = (employee.annualLeaveBalance || 0) - this.days;
      await employee.save();
    }
  }

  return this.save();
};

/**
 * Instance method: Reject leave request
 */
LeaveRequestSchema.methods.reject = function (rejectedBy, reason) {
  if (this.status !== 'pending') {
    throw new Error('Can only reject pending leave requests');
  }

  this.status = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvedAt = new Date();
  if (reason) {
    this.rejectionReason = reason;
  }

  return this.save();
};

// Indexes for performance
LeaveRequestSchema.index({ employeeId: 1, startDate: 1 });
LeaveRequestSchema.index({ employeeId: 1, status: 1 });
LeaveRequestSchema.index({ status: 1, startDate: 1 });

export const LeaveRequest =
  mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);

