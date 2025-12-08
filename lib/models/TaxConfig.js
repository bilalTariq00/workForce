import mongoose, { Schema } from 'mongoose';

/**
 * TaxConfig Model
 * 
 * Purpose: Store UK tax band configuration
 * Used for payroll tax calculations
 * 
 * Business Rules:
 * - Tax bands are updated annually (tax year)
 * - Personal allowance is set per tax year
 * - Tax rates are percentage-based
 */
const TaxConfigSchema = new Schema(
  {
    // Tax year (e.g., "2024-2025")
    taxYear: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Personal allowance (e.g., 12570 for 2024-2025)
    personalAllowance: {
      type: Number,
      required: true,
      min: 0,
      default: 12570, // 2024-2025 UK personal allowance
    },
    
    // Tax bands
    taxBands: [{
      name: {
        type: String,
        required: true,
        enum: ['basic', 'higher', 'additional'],
      },
      minIncome: {
        type: Number,
        required: true,
        min: 0,
      },
      maxIncome: {
        type: Number,
        // null means no upper limit
      },
      rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        // Percentage (e.g., 20 for 20%)
      },
    }],
    
    // Whether this is the current active configuration
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Effective dates
    effectiveFrom: {
      type: Date,
      required: true,
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

// Index for finding active config
TaxConfigSchema.index({ isActive: 1, taxYear: 1 });

/**
 * Static method: Get active tax configuration
 */
TaxConfigSchema.statics.getActiveConfig = async function() {
  return this.findOne({
    isActive: true,
  }).lean();
};

/**
 * Static method: Get config for a specific tax year
 */
TaxConfigSchema.statics.getConfigForYear = async function(taxYear) {
  return this.findOne({
    taxYear,
  }).lean();
};

/**
 * Static method: Get config for a specific date
 */
TaxConfigSchema.statics.getConfigForDate = async function(date) {
  const targetDate = date || new Date();
  return this.findOne({
    effectiveFrom: { $lte: targetDate },
    $or: [
      { effectiveTo: null },
      { effectiveTo: { $gte: targetDate } },
    ],
    isActive: true,
  }).lean();
};

export const TaxConfig =
  mongoose.models.TaxConfig || mongoose.model('TaxConfig', TaxConfigSchema);

