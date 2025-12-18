import mongoose, { Schema } from 'mongoose';

/**
 * AuditLog Model
 * 
 * Purpose: Global audit log for all system actions
 * Used for compliance, security, and tracking
 * 
 * Business Rules:
 * - All API actions are logged
 * - Includes user, action, resource, and outcome
 * - Immutable (cannot be modified after creation)
 */
const AuditLogSchema = new Schema(
  {
    // User who performed the action
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    
    // Action performed
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'create_employee', 'update_timesheet', 'approve_payroll', 'denied_scan', etc.
    },
    
    // Resource type (e.g., 'employee', 'timesheet', 'payroll_run', 'attendance')
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    
    // Resource ID
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    
    // Action outcome
    outcome: {
      type: String,
      enum: ['success', 'failure', 'denied'],
      required: true,
      index: true,
    },
    
    // Additional details
    details: {
      type: Schema.Types.Mixed,
      // Can store any additional information
    },
    
    // IP address
    ipAddress: {
      type: String,
    },
    
    // User agent
    userAgent: {
      type: String,
    },
    
    // Request method (GET, POST, PATCH, DELETE)
    method: {
      type: String,
    },
    
    // Request path
    path: {
      type: String,
    },
    
    // Error message (if outcome is failure)
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ outcome: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

/**
 * Static method: Log an action
 */
AuditLogSchema.statics.log = async function(data) {
  return this.create({
    userId: data.userId,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId,
    outcome: data.outcome || 'success',
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    method: data.method,
    path: data.path,
    errorMessage: data.errorMessage,
  });
};

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);





