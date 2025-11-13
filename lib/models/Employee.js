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
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
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

