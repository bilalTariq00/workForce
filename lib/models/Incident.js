import mongoose, { Schema } from 'mongoose';

/**
 * Incident Model
 * 
 * Purpose: Track safety incidents and near-misses on construction sites
 * Used in EHS-01 (Incident Triage & Investigation)
 * 
 * Business Rules:
 * - Employees and Site Managers can report incidents
 * - EHS officers triage and investigate
 * - Corrective actions can be assigned
 * - Status: reported -> under_investigation -> resolved -> closed
 */
const IncidentSchema = new Schema(
  {
    // Site where incident occurred
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },

    // Employee who reported the incident
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Incident type
    type: {
      type: String,
      enum: ['incident', 'near_miss'],
      required: true,
      index: true,
    },

    // Severity level
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },

    // Incident description
    description: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },

    // Photo URLs (max 10)
    photos: [
      {
        type: String,
        maxlength: 500,
      },
    ],

    // Location on site
    location: {
      type: String,
      maxlength: 200,
      trim: true,
    },

    // Investigation status
    status: {
      type: String,
      enum: ['reported', 'under_investigation', 'resolved', 'closed'],
      default: 'reported',
      required: true,
      index: true,
    },

    // EHS officer assigned to investigate
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },

    // Corrective actions
    actions: [
      {
        description: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        assignedTo: {
          type: Schema.Types.ObjectId,
          ref: 'Employee',
          required: true,
        },
        dueDate: {
          type: Date,
          required: true,
        },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
          required: true,
        },
        completedAt: {
          type: Date,
        },
        notes: {
          type: String,
          maxlength: 500,
        },
      },
    ],

    // Investigation notes
    investigationNotes: {
      type: String,
      maxlength: 5000,
      trim: true,
    },

    // Date/time of incident occurrence
    occurredAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Investigation start date
    investigationStartedAt: {
      type: Date,
    },

    // Resolution date
    resolvedAt: {
      type: Date,
    },

    // Closure date
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
IncidentSchema.index({ siteId: 1, status: 1 });
IncidentSchema.index({ reportedBy: 1, status: 1 });
IncidentSchema.index({ assignedTo: 1, status: 1 });
IncidentSchema.index({ severity: 1, status: 1 });
IncidentSchema.index({ occurredAt: -1 });

// Instance method to check if incident can be assigned
IncidentSchema.methods.canAssign = function() {
  return this.status === 'reported' || this.status === 'under_investigation';
};

// Instance method to check if incident can be resolved
IncidentSchema.methods.canResolve = function() {
  return this.status === 'under_investigation';
};

// Instance method to check if incident can be closed
IncidentSchema.methods.canClose = function() {
  return this.status === 'resolved';
};

// Static method to get incidents by severity
IncidentSchema.statics.getBySeverity = function(severity) {
  return this.find({ severity, status: { $ne: 'closed' } })
    .populate('siteId', 'name siteCode')
    .populate('reportedBy', 'firstName lastName employeeId')
    .populate('assignedTo', 'firstName lastName')
    .sort({ occurredAt: -1 });
};

// Static method to get critical incidents
IncidentSchema.statics.getCritical = function() {
  return this.find({
    severity: 'critical',
    status: { $ne: 'closed' },
  })
    .populate('siteId', 'name siteCode')
    .populate('reportedBy', 'firstName lastName employeeId')
    .sort({ occurredAt: -1 });
};

export const Incident =
  mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);

