import mongoose, { Schema } from 'mongoose';

/**
 * PensionConfig Model
 * 
 * Purpose: Store pension scheme configuration
 * Used for payroll pension contribution calculations
 * 
 * Business Rules:
 * - Multiple pension schemes can exist
 * - Auto-enrollment minimums apply
 * - Employee and employer contribution rates
 */
const PensionConfigSchema = new Schema(
  {
    // Pension scheme name
    schemeName: {
      type: String,
      required: true,
      maxlength: 100,
      trim: true,
    },
    
    // Scheme code/identifier
    schemeCode: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
      trim: true,
      uppercase: true,
    },
    
    // Description
    description: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    
    // Auto-enrollment settings
    autoEnrollment: {
      enabled: {
        type: Boolean,
        default: true,
      },
      // Qualifying earnings threshold (e.g., 6240 for 2024-2025)
      qualifyingEarningsThreshold: {
        type: Number,
        min: 0,
        default: 6240, // 2024-2025 UK threshold
      },
      // Minimum employee contribution (%)
      minimumEmployeeContribution: {
        type: Number,
        min: 0,
        max: 100,
        default: 5, // 5% for 2024-2025
      },
      // Minimum employer contribution (%)
      minimumEmployerContribution: {
        type: Number,
        min: 0,
        max: 100,
        default: 3, // 3% for 2024-2025
      },
    },
    
    // Default contribution rates (can be overridden per employee)
    defaultEmployeeRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 5, // Percentage
    },
    
    defaultEmployerRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 3, // Percentage
    },
    
    // Whether this scheme is active
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Whether this is the default scheme
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Effective dates
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    
    effectiveTo: {
      type: Date,
      // null means ongoing
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PensionConfigSchema.index({ isActive: 1, isDefault: 1 });
PensionConfigSchema.index({ schemeCode: 1 });

/**
 * Static method: Get default pension scheme
 */
PensionConfigSchema.statics.getDefaultScheme = async function() {
  return this.findOne({
    isDefault: true,
    isActive: true,
  }).lean();
};

/**
 * Static method: Get all active schemes
 */
PensionConfigSchema.statics.getActiveSchemes = async function() {
  return this.find({
    isActive: true,
  })
    .sort({ schemeName: 1 })
    .lean();
};

/**
 * Static method: Get scheme by code
 */
PensionConfigSchema.statics.getSchemeByCode = async function(schemeCode) {
  return this.findOne({
    schemeCode: schemeCode.toUpperCase(),
    isActive: true,
  }).lean();
};

export const PensionConfig =
  mongoose.models.PensionConfig || mongoose.model('PensionConfig', PensionConfigSchema);

