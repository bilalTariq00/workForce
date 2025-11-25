import mongoose, { Schema } from 'mongoose';

const ToolRequestSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    toolId: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    requestedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedStartDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'fulfilled'],
      default: 'pending',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    approvedDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    // Link to assignment if approved
    assignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'ToolAssignment',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ToolRequestSchema.index({ employeeId: 1, status: 1 });
ToolRequestSchema.index({ toolId: 1, status: 1 });
ToolRequestSchema.index({ status: 1, requestedDate: -1 });

export const ToolRequest =
  mongoose.models.ToolRequest || mongoose.model('ToolRequest', ToolRequestSchema);

