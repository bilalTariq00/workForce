import mongoose, { Schema } from 'mongoose';

/**
 * RoleTemplate Model
 * 
 * Purpose: Define permission templates for roles
 * Used for role-based access control with granular permissions
 * 
 * Business Rules:
 * - Each template defines permissions per module/action
 * - Default templates are seeded for each role
 * - Templates can be customized per organization
 * - Employees are linked to a role template
 */
const RoleTemplateSchema = new Schema(
  {
    // Template name (e.g., "Site Manager", "HR Officer")
    name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
      trim: true,
    },
    
    // Description of the template
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    
    // Whether this is a default template (cannot be deleted)
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Base role this template is for (for reference)
    baseRole: {
      type: String,
      enum: ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'],
      index: true,
    },
    
    // Permissions array - each permission defines module + actions
    permissions: [{
      // Module name (e.g., 'hrm', 'payroll', 'attendance', 'certifications')
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
      },
      // Actions allowed for this module (e.g., ['view', 'create', 'edit', 'approve', 'export'])
      actions: [{
        type: String,
        enum: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'],
      }],
    }],
    
    // Whether this template is active
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Created by
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
RoleTemplateSchema.index({ baseRole: 1, isActive: 1 });
RoleTemplateSchema.index({ isDefault: 1, isActive: 1 });

/**
 * Static method: Get default template for a role
 */
RoleTemplateSchema.statics.getDefaultForRole = async function(baseRole) {
  return this.findOne({
    baseRole,
    isDefault: true,
    isActive: true,
  }).lean();
};

/**
 * Static method: Get all active templates
 */
RoleTemplateSchema.statics.getActiveTemplates = async function() {
  return this.find({
    isActive: true,
  })
    .sort({ name: 1 })
    .lean();
};

/**
 * Instance method: Check if user has permission for module/action
 */
RoleTemplateSchema.methods.hasPermission = function(module, action) {
  const permission = this.permissions.find(p => p.module === module);
  if (!permission) return false;
  return permission.actions.includes(action);
};

/**
 * Instance method: Get all permissions for a module
 */
RoleTemplateSchema.methods.getModulePermissions = function(module) {
  const permission = this.permissions.find(p => p.module === module);
  return permission ? permission.actions : [];
};

/**
 * Pre-save hook: Prevent deletion of default templates
 */
RoleTemplateSchema.pre('findOneAndDelete', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.isDefault) {
    throw new Error('Cannot delete default template');
  }
});

RoleTemplateSchema.pre('deleteOne', async function() {
  const doc = await this.model.findOne(this.getQuery());
  if (doc && doc.isDefault) {
    throw new Error('Cannot delete default template');
  }
});

export const RoleTemplate =
  mongoose.models.RoleTemplate || mongoose.model('RoleTemplate', RoleTemplateSchema);

