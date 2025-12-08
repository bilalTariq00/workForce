import mongoose, { Schema } from 'mongoose';

/**
 * EmployeeSite Model
 * 
 * Purpose: Enable employees to be assigned to multiple sites
 * Used for multi-site employee management
 * 
 * Business Rules:
 * - One employee can be assigned to multiple sites
 * - Each assignment can have a different role at that site
 * - One site can be marked as primary
 * - When unassigned, the record is soft-deleted (isActive: false)
 */
const EmployeeSiteSchema = new Schema(
  {
    // Employee reference
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    
    // Site reference
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    
    // Role at this specific site (can differ from employee's main role)
    role: {
      type: String,
      enum: ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'],
      required: true,
    },
    
    // Whether this is the primary site for the employee
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Assignment metadata
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    
    // Who assigned this employee to the site
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    
    // Soft delete flag
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Notes about this assignment
    notes: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one active assignment per employee per site
EmployeeSiteSchema.index({ employeeId: 1, siteId: 1, isActive: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for finding all sites for an employee
EmployeeSiteSchema.index({ employeeId: 1, isActive: 1 });

// Index for finding all employees at a site
EmployeeSiteSchema.index({ siteId: 1, isActive: 1 });

// Index for finding primary site
EmployeeSiteSchema.index({ employeeId: 1, isPrimary: 1, isActive: 1 });

/**
 * Static method: Get all active sites for an employee
 */
EmployeeSiteSchema.statics.getEmployeeSites = async function(employeeId) {
  return this.find({
    employeeId,
    isActive: true,
  })
    .populate('siteId', 'name siteCode address location')
    .populate('assignedBy', 'firstName lastName')
    .sort({ isPrimary: -1, assignedAt: -1 })
    .lean();
};

/**
 * Static method: Get primary site for an employee
 */
EmployeeSiteSchema.statics.getPrimarySite = async function(employeeId) {
  const assignment = await this.findOne({
    employeeId,
    isPrimary: true,
    isActive: true,
  })
    .populate('siteId')
    .lean();
  
  return assignment?.siteId || null;
};

/**
 * Static method: Get all employees at a site
 */
EmployeeSiteSchema.statics.getSiteEmployees = async function(siteId) {
  return this.find({
    siteId,
    isActive: true,
  })
    .populate('employeeId', 'firstName lastName email role employeeId')
    .populate('assignedBy', 'firstName lastName')
    .sort({ assignedAt: -1 })
    .lean();
};

/**
 * Instance method: Set as primary site (unset others)
 */
EmployeeSiteSchema.methods.setAsPrimary = async function() {
  // Unset other primary sites for this employee
  await this.constructor.updateMany(
    {
      employeeId: this.employeeId,
      _id: { $ne: this._id },
      isActive: true,
    },
    {
      $set: { isPrimary: false },
    }
  );
  
  // Set this as primary
  this.isPrimary = true;
  return this.save();
};

/**
 * Instance method: Deactivate assignment (soft delete)
 */
EmployeeSiteSchema.methods.deactivate = async function() {
  this.isActive = false;
  
  // If this was primary, set another site as primary (if any)
  if (this.isPrimary) {
    const otherSite = await this.constructor.findOne({
      employeeId: this.employeeId,
      _id: { $ne: this._id },
      isActive: true,
    });
    
    if (otherSite) {
      await otherSite.setAsPrimary();
    }
  }
  
  return this.save();
};

export const EmployeeSite =
  mongoose.models.EmployeeSite || mongoose.model('EmployeeSite', EmployeeSiteSchema);

