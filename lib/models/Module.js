import mongoose, { Schema } from 'mongoose';

const ModuleSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['hrm', 'registers', 'process_management', 'finance_payroll', 'equipment', 'procurement'],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    icon: {
      type: String, // Icon name from lucide-react
      default: 'Package',
    },
    route: {
      type: String, // Base route for this module
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [{
      type: String, // List of features in this module
    }],
  },
  {
    timestamps: true,
  }
);

ModuleSchema.index({ code: 1, isActive: 1 });

export const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);


