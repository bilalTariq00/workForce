import mongoose, { Schema } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
      index: true,
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
      index: true,
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
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
      index: true,
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
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ employeeId: 1 });
EmployeeSchema.index({ role: 1, status: 1 });

export const Employee =
  mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

