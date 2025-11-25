import mongoose, { Schema } from 'mongoose';

const ToolAssignmentSchema = new Schema(
  {
    toolId: {
      type: Schema.Types.ObjectId,
      ref: 'Tool',
      required: true,
      index: true,
    },
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['assigned', 'returned', 'overdue', 'lost', 'damaged'],
      default: 'assigned',
      index: true,
    },
    // Fine calculation
    fineAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    finePaidDate: {
      type: Date,
    },
    // Assignment details
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    returnedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    notes: {
      type: String,
      trim: true,
    },
    // Condition when returned
    returnCondition: {
      type: String,
      enum: ['good', 'fair', 'poor', 'damaged', 'lost'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ToolAssignmentSchema.index({ toolId: 1, status: 1 });
ToolAssignmentSchema.index({ employeeId: 1, status: 1 });
ToolAssignmentSchema.index({ expectedReturnDate: 1, status: 1 });
ToolAssignmentSchema.index({ status: 1, expectedReturnDate: 1 });

// Calculate fine before saving
ToolAssignmentSchema.pre('save', function (next) {
  if (this.status === 'returned' && this.actualReturnDate && this.expectedReturnDate) {
    const daysLate = Math.ceil(
      (this.actualReturnDate - this.expectedReturnDate) / (1000 * 60 * 60 * 24)
    );
    
    if (daysLate > 1) {
      // Get tool's fine per day rate (will need to populate toolId)
      // For now, calculate based on days late
      // Fine will be calculated in the API route when returning
    } else {
      this.fineAmount = 0;
    }
  }
  
  // Auto-update status to overdue if past expected return date
  if (this.status === 'assigned' && this.expectedReturnDate < new Date()) {
    this.status = 'overdue';
  }
  
  next();
});

export const ToolAssignment =
  mongoose.models.ToolAssignment ||
  mongoose.model('ToolAssignment', ToolAssignmentSchema);

