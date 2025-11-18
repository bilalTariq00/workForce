import mongoose, { Schema } from 'mongoose';

/**
 * Training Register Model
 * 
 * Purpose: Track mandatory training completion for employees
 * Used in EHS-03 (Training Register Oversight)
 * 
 * Business Rules:
 * - Tracks mandatory training requirements
 * - Links to certifications (HR-06)
 * - Monitors completion status
 * - Sends reminders for overdue training
 */
const TrainingRegisterSchema = new Schema(
  {
    // Employee who needs training
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Training type/category
    trainingType: {
      type: String,
      enum: [
        'SafePass',
        'CSCS',
        'FirstAid',
        'ManualHandling',
        'WorkingAtHeight',
        'ConfinedSpace',
        'FireSafety',
        'ToolboxTalk',
        'Other',
      ],
      required: true,
      index: true,
    },

    // Training title
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },

    // Training description
    description: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Is this training mandatory?
    isMandatory: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Completion status
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'overdue', 'expired'],
      default: 'not_started',
      required: true,
      index: true,
    },

    // Due date (when training must be completed)
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Completion date
    completedDate: {
      type: Date,
    },

    // Expiry date (if training expires)
    expiryDate: {
      type: Date,
      index: true,
    },

    // Link to certification (if applicable)
    certificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Certification',
      index: true,
    },

    // Training provider/instructor
    provider: {
      type: String,
      maxlength: 200,
      trim: true,
    },

    // Training certificate/document URL
    certificateUrl: {
      type: String,
      maxlength: 500,
    },

    // Notes
    notes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Assigned by (EHS/HR officer)
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },

    // Last reminder sent date
    lastReminderSent: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
TrainingRegisterSchema.index({ employeeId: 1, status: 1 });
TrainingRegisterSchema.index({ trainingType: 1, status: 1 });
TrainingRegisterSchema.index({ dueDate: 1, status: 1 });
TrainingRegisterSchema.index({ isMandatory: 1, status: 1 });

// Middleware to auto-update status based on dates
TrainingRegisterSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If completed, don't change status
  if (this.status === 'completed') {
    // Check if expired
    if (this.expiryDate && this.expiryDate < today) {
      this.status = 'expired';
    }
    next();
    return;
  }

  // Check if overdue
  if (this.dueDate < today) {
    this.status = 'overdue';
  } else if (this.status === 'overdue' && this.dueDate >= today) {
    // If due date is updated to future, change from overdue
    this.status = 'not_started';
  }

  // Check if expired
  if (this.expiryDate && this.expiryDate < today) {
    this.status = 'expired';
  }

  next();
});

// Static method to find overdue training
TrainingRegisterSchema.statics.findOverdue = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    status: { $in: ['not_started', 'in_progress', 'overdue'] },
    dueDate: { $lt: today },
    isMandatory: true,
  })
    .populate('employeeId', 'firstName lastName email employeeId')
    .populate('assignedBy', 'firstName lastName')
    .sort({ dueDate: 1 });
};

// Static method to find training due soon
TrainingRegisterSchema.statics.findDueSoon = function(days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const threshold = new Date();
  threshold.setDate(today.getDate() + days);
  threshold.setHours(23, 59, 59, 999);

  return this.find({
    status: { $in: ['not_started', 'in_progress'] },
    dueDate: {
      $gte: today,
      $lte: threshold,
    },
    isMandatory: true,
  })
    .populate('employeeId', 'firstName lastName email employeeId')
    .populate('assignedBy', 'firstName lastName')
    .sort({ dueDate: 1 });
};

// Static method to find expired training
TrainingRegisterSchema.statics.findExpired = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    status: 'expired',
    expiryDate: { $lt: today },
  })
    .populate('employeeId', 'firstName lastName email employeeId')
    .populate('assignedBy', 'firstName lastName')
    .sort({ expiryDate: 1 });
};

export const TrainingRegister =
  mongoose.models.TrainingRegister ||
  mongoose.model('TrainingRegister', TrainingRegisterSchema);

