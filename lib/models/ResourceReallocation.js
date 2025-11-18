import mongoose, { Schema } from 'mongoose';

/**
 * Resource Re-Allocation Model
 * 
 * Purpose: Track resource reallocation requests (crew/plant) between sites
 * Used in CM-02 (Resource Re-Allocation Request)
 * 
 * Business Rules:
 * - Contracts Managers can create reallocation requests
 * - Status: pending -> approved/rejected -> completed
 * - When approved, employees are moved to new site
 * - Site Managers are notified of reallocations
 */
const ResourceReallocationSchema = new Schema(
  {
    // Source site (where resources are coming from)
    fromSiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },

    // Destination site (where resources are going to)
    toSiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },

    // Resource type
    resourceType: {
      type: String,
      enum: ['crew', 'plant', 'equipment'],
      required: true,
      index: true,
    },

    // Employee IDs (for crew reallocation)
    employeeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],

    // Plant/Equipment details (for plant/equipment reallocation)
    plantDetails: {
      name: String,
      type: String,
      registrationNumber: String,
      description: String,
    },

    // Effective date (when reallocation should take effect)
    effectiveDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Reason for reallocation
    reason: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      required: true,
      index: true,
    },

    // Contracts Manager who requested this
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Who approved/rejected this
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },

    // Approval/rejection timestamp
    approvedAt: {
      type: Date,
    },

    // Approval/rejection notes
    approvalNotes: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Rejection reason
    rejectionReason: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Completion timestamp (when resources were actually moved)
    completedAt: {
      type: Date,
    },

    // Notes from Site Managers
    siteManagerNotes: {
      fromSite: String,
      toSite: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ResourceReallocationSchema.index({ fromSiteId: 1, status: 1 });
ResourceReallocationSchema.index({ toSiteId: 1, status: 1 });
ResourceReallocationSchema.index({ requestedBy: 1, status: 1 });
ResourceReallocationSchema.index({ effectiveDate: 1, status: 1 });

// Instance method to check if reallocation can be approved
ResourceReallocationSchema.methods.canApprove = function() {
  return this.status === 'pending';
};

// Instance method to check if reallocation can be completed
ResourceReallocationSchema.methods.canComplete = function() {
  return this.status === 'approved' && new Date() >= this.effectiveDate;
};

// Static method to get pending reallocations for a site
ResourceReallocationSchema.statics.getPendingForSite = function(siteId) {
  return this.find({
    $or: [{ fromSiteId: siteId }, { toSiteId: siteId }],
    status: 'pending',
  })
    .populate('fromSiteId', 'name siteCode')
    .populate('toSiteId', 'name siteCode')
    .populate('employeeIds', 'firstName lastName employeeId')
    .populate('requestedBy', 'firstName lastName')
    .sort({ effectiveDate: 1 });
};

export const ResourceReallocation =
  mongoose.models.ResourceReallocation ||
  mongoose.model('ResourceReallocation', ResourceReallocationSchema);

