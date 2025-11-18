import mongoose, { Schema } from 'mongoose';

/**
 * Certification Model
 * 
 * Purpose: Track employee certifications (SafePass, CSCS, First Aid, etc.)
 * Used in LB-06 (Certification Upload/Renewal) and HR-06 (Certification Tracking)
 * 
 * Business Rules:
 * - Status auto-updates to "expired" when expiryDate < today
 * - Expired certifications block site access
 * - Reminder sent 30 days before expiry
 * - HR/EHS can validate certifications
 */
const CertificationSchema = new Schema(
  {
    // Employee who owns this certification
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Certification type
    type: {
      type: String,
      enum: ['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'Other'],
      required: true,
      index: true,
    },

    // Document storage URL (from file upload)
    documentUrl: {
      type: String,
      required: true,
    },

    // File type
    documentType: {
      type: String,
      enum: ['pdf', 'jpg', 'png'],
      required: true,
    },

    // Issue date
    issueDate: {
      type: Date,
      required: true,
    },

    // Expiry date
    expiryDate: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: function(value) {
          return value > this.issueDate;
        },
        message: 'Expiry date must be after issue date',
      },
    },

    // Validation status
    status: {
      type: String,
      enum: ['pending_validation', 'valid', 'expired', 'rejected'],
      default: 'pending_validation',
      required: true,
      index: true,
    },

    // Validator (HR or EHS officer)
    validatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      index: true,
    },

    // Validation timestamp
    validatedAt: {
      type: Date,
    },

    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      maxlength: 500,
    },

    // Additional notes
    notes: {
      type: String,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding expired certifications
CertificationSchema.index({ expiryDate: 1, status: 1 });
CertificationSchema.index({ employeeId: 1, status: 1 });
CertificationSchema.index({ employeeId: 1, type: 1 });

// Middleware to auto-update status to expired
CertificationSchema.pre('save', function(next) {
  // If expiry date has passed and status is not already expired or rejected
  if (this.expiryDate < new Date() && this.status !== 'expired' && this.status !== 'rejected') {
    this.status = 'expired';
  }
  next();
});

// Static method to find certifications expiring soon (for reminders)
CertificationSchema.statics.findExpiringSoon = function(days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + days);
  expiryThreshold.setHours(23, 59, 59, 999);

  return this.find({
    expiryDate: {
      $gte: today,
      $lte: expiryThreshold,
    },
    status: { $in: ['valid', 'pending_validation'] },
  }).populate('employeeId', 'firstName lastName email');
};

// Static method to check if employee has valid certification of a type
CertificationSchema.statics.hasValidCertification = async function(employeeId, type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cert = await this.findOne({
    employeeId,
    type,
    status: 'valid',
    expiryDate: { $gte: today },
  });

  return !!cert;
};

// Instance method to check if certification is expired
CertificationSchema.methods.isExpired = function() {
  return this.expiryDate < new Date();
};

// Instance method to check if certification is expiring soon
CertificationSchema.methods.isExpiringSoon = function(days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + days);
  expiryThreshold.setHours(23, 59, 59, 999);

  return this.expiryDate >= today && this.expiryDate <= expiryThreshold;
};

export const Certification =
  mongoose.models.Certification || mongoose.model('Certification', CertificationSchema);

