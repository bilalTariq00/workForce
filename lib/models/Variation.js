import mongoose, { Schema } from 'mongoose';

/**
 * Variation / Change Order Model
 * 
 * Purpose: Track variations/change orders initiated by Site Managers
 * and approved/rejected by Contracts Managers
 * 
 * Used in SM-06 (Variation/Change Order Initiation) and CM-04 (Variation/Change Order Approval)
 * 
 * Business Rules:
 * - Site Managers create draft variations
 * - Status: draft -> pending -> approved/rejected
 * - Cannot edit after status is "pending" or "approved"
 * - Cost and delay tracking for project management
 */
const VariationSchema = new Schema(
  {
    // Site reference - which construction site this variation is for
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },

    // Site Manager who created this variation
    siteManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Variation title (e.g., "Additional Foundation Work")
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },

    // Detailed description of the variation
    description: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    // Additional cost in currency (e.g., 5000.00)
    cost: {
      type: Number,
      required: true,
      min: 0,
      // Round to 2 decimal places
      set: (value) => Math.round(value * 100) / 100,
    },

    // Project delay in days
    delayDays: {
      type: Number,
      required: true,
      min: 0,
    },

    // Variation status
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
      required: true,
      index: true,
    },

    // Contracts Manager who approved/rejected
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },

    // Approval/rejection timestamp
    approvedAt: {
      type: Date,
    },

    // Commercial notes from Contracts Manager
    commercialNotes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
VariationSchema.index({ siteId: 1, status: 1 });
VariationSchema.index({ siteManagerId: 1, status: 1 });
VariationSchema.index({ status: 1, createdAt: -1 });

// Virtual for total cost (if needed for aggregations)
VariationSchema.virtual('formattedCost').get(function() {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(this.cost);
});

// Instance method to check if variation can be edited
VariationSchema.methods.canEdit = function() {
  return this.status === 'draft' || this.status === 'rejected';
};

// Instance method to check if variation can be submitted
VariationSchema.methods.canSubmit = function() {
  return this.status === 'draft' || this.status === 'rejected';
};

// Instance method to check if variation can be approved/rejected
VariationSchema.methods.canApprove = function() {
  return this.status === 'pending';
};

export const Variation =
  mongoose.models.Variation || mongoose.model('Variation', VariationSchema);

