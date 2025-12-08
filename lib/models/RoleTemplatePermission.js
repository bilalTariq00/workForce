import mongoose, { Schema } from 'mongoose';

/**
 * RoleTemplatePermission Model
 * 
 * Purpose: Store individual permission records (alternative to embedded permissions)
 * This model is optional - permissions can be embedded in RoleTemplate
 * Use this if you need to track permission changes over time or have complex permission logic
 * 
 * Note: Currently using embedded permissions in RoleTemplate, but keeping this model
 * for future extensibility if needed
 */
const RoleTemplatePermissionSchema = new Schema(
  {
    // Role template reference
    roleTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'RoleTemplate',
      required: true,
      index: true,
    },
    
    // Module name
    module: {
      type: String,
      required: true,
      enum: [
        'hrm',
        'registers',
        'process_management',
        'finance_payroll',
        'equipment',
        'procurement',
        'attendance',
        'certifications',
        'timesheets',
        'leave_requests',
        'sites',
        'reports',
      ],
      index: true,
    },
    
    // Actions allowed
    actions: [{
      type: String,
      enum: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'],
    }],
    
    // Whether this permission is active
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index
RoleTemplatePermissionSchema.index({ roleTemplateId: 1, module: 1 }, { unique: true });

export const RoleTemplatePermission =
  mongoose.models.RoleTemplatePermission || mongoose.model('RoleTemplatePermission', RoleTemplatePermissionSchema);

