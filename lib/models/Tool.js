import mongoose, { Schema } from 'mongoose';

const ToolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'hand_tools',
        'power_tools',
        'safety_equipment',
        'heavy_machinery',
        'vehicles',
        'measuring_tools',
        'other',
      ],
      default: 'other',
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    serialNumber: {
      type: String,
      trim: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // Track assigned quantity (calculated: totalQuantity - availableQuantity)
    assignedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      default: 'unit',
      enum: ['unit', 'piece', 'set', 'pair'],
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'needs_repair'],
      default: 'good',
    },
    location: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    finePerDay: {
      type: Number,
      min: 0,
      default: 0, // Fine amount per day for late returns
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'disposed'],
      default: 'active',
    },
    notes: {
      type: String,
      trim: true,
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
ToolSchema.index({ name: 1, category: 1 });
ToolSchema.index({ status: 1 });
ToolSchema.index({ serialNumber: 1 }, { sparse: true, unique: true });

// Virtual for missing quantity (if any tools are unaccounted for)
ToolSchema.virtual('missingQuantity').get(function () {
  const calculatedAssigned = this.totalQuantity - this.availableQuantity;
  if (calculatedAssigned !== this.assignedQuantity) {
    return Math.abs(calculatedAssigned - this.assignedQuantity);
  }
  return 0;
});

export const Tool =
  mongoose.models.Tool || mongoose.model('Tool', ToolSchema);

