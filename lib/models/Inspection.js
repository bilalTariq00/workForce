import mongoose, { Schema } from 'mongoose';

/**
 * Site Inspection Model
 * 
 * Purpose: Track EHS site inspections and audits
 * Used in EHS-02 (Site Inspection & Checklist)
 * 
 * Business Rules:
 * - EHS officers perform inspections
 * - Issues can be logged and assigned as corrective tasks
 * - Status: draft -> completed
 */
const InspectionSchema = new Schema(
  {
    // Site being inspected
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },

    // EHS officer performing the inspection
    inspectorId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Inspection date
    inspectionDate: {
      type: Date,
      required: true,
      index: true,
    },

    // Inspection type
    type: {
      type: String,
      enum: ['safety', 'environmental', 'compliance', 'general'],
      required: true,
      index: true,
    },

    // Inspection title
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },

    // Inspection notes/observations
    notes: {
      type: String,
      maxlength: 5000,
      trim: true,
    },

    // Checklist items
    checklistItems: [
      {
        category: {
          type: String,
          required: true,
          maxlength: 100,
        },
        item: {
          type: String,
          required: true,
          maxlength: 500,
        },
        status: {
          type: String,
          enum: ['pass', 'fail', 'na'],
          required: true,
        },
        notes: {
          type: String,
          maxlength: 500,
        },
      },
    ],

    // Issues found during inspection
    issues: [
      {
        description: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        severity: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical'],
          required: true,
        },
        location: {
          type: String,
          maxlength: 200,
        },
        photoUrl: {
          type: String,
          maxlength: 500,
        },
        assignedTo: {
          type: Schema.Types.ObjectId,
          ref: 'Employee',
        },
        dueDate: {
          type: Date,
        },
        status: {
          type: String,
          enum: ['open', 'in_progress', 'resolved', 'closed'],
          default: 'open',
          required: true,
        },
        resolvedAt: {
          type: Date,
        },
        resolutionNotes: {
          type: String,
          maxlength: 1000,
        },
      },
    ],

    // Overall inspection status
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
      required: true,
      index: true,
    },

    // Overall rating/score
    overallRating: {
      type: String,
      enum: ['excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'],
    },

    // Follow-up required
    followUpRequired: {
      type: Boolean,
      default: false,
    },

    // Follow-up date
    followUpDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
InspectionSchema.index({ siteId: 1, inspectionDate: -1 });
InspectionSchema.index({ inspectorId: 1, inspectionDate: -1 });
InspectionSchema.index({ status: 1, inspectionDate: -1 });

// Instance method to check if inspection can be edited
InspectionSchema.methods.canEdit = function() {
  return this.status === 'draft';
};

// Static method to get inspections with open issues
InspectionSchema.statics.getWithOpenIssues = function(siteId) {
  return this.find({
    siteId,
    'issues.status': { $in: ['open', 'in_progress'] },
  })
    .populate('inspectorId', 'firstName lastName employeeId')
    .populate('issues.assignedTo', 'firstName lastName employeeId')
    .sort({ inspectionDate: -1 });
};

export const Inspection =
  mongoose.models.Inspection || mongoose.model('Inspection', InspectionSchema);

