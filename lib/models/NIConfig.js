import mongoose, { Schema } from 'mongoose';

/**
 * NIConfig Model
 * 
 * Purpose: Store UK National Insurance (NI) rate configuration
 * Used for payroll NI calculations
 * 
 * Business Rules:
 * - NI rates are updated annually
 * - Different rates for employee and employer
 * - Different thresholds apply
 */
const NIConfigSchema = new Schema(
  {
    // Tax year (e.g., "2024-2025")
    taxYear: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Employee NI rates
    employeeNI: {
      // Primary threshold (earnings above this are subject to NI)
      primaryThreshold: {
        type: Number,
        required: true,
        min: 0,
        default: 12570, // 2024-2025 UK primary threshold
      },
      // Upper earnings limit
      upperEarningsLimit: {
        type: Number,
        required: true,
        min: 0,
        default: 50270, // 2024-2025 UK upper earnings limit
      },
      // Rate for earnings between primary threshold and upper limit
      standardRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 12, // 12% for 2024-2025
      },
      // Rate for earnings above upper limit
      additionalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 2, // 2% for 2024-2025
      },
    },
    
    // Employer NI rates
    employerNI: {
      // Secondary threshold (earnings above this are subject to employer NI)
      secondaryThreshold: {
        type: Number,
        required: true,
        min: 0,
        default: 9100, // 2024-2025 UK secondary threshold
      },
      // Rate for earnings above secondary threshold
      rate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 13.8, // 13.8% for 2024-2025
      },
    },
    
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
NIConfigSchema.index({ isActive: 1, taxYear: 1 });

/**
 * Static method: Get active NI configuration
 */
NIConfigSchema.statics.getActiveConfig = async function() {
  return this.findOne({
    isActive: true,
  }).lean();
};

/**
 * Static method: Get config for a specific tax year
 */
NIConfigSchema.statics.getConfigForYear = async function(taxYear) {
  return this.findOne({
    taxYear,
  }).lean();
};

/**
 * Static method: Get config for a specific date
 */
NIConfigSchema.statics.getConfigForDate = async function(date) {
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

export const NIConfig =
  mongoose.models.NIConfig || mongoose.model('NIConfig', NIConfigSchema);

