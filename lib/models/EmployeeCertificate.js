import mongoose, { Schema } from 'mongoose';

/**
 * EmployeeCertificate Model
 * 
 * Purpose: Track employee certificates and tickets (SafePass, CSCS, First Aid, etc.)
 * Integrated with Employee profiles for HR management
 * 
 * Features:
 * - Camera upload + file upload support
 * - Certificate expiry tracking
 * - Status management (valid, expired, expiring soon)
 * - Validation workflow (HR/EHS approval)
 */
const EmployeeCertificateSchema = new Schema(
  {
    // Employee who owns this certificate
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },

    // Certificate type
    type: {
      type: String,
      enum: ['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'CPCS', 'IPAF', 'PASMA', 'Other'],
      required: true,
      index: true,
    },

    // Certificate number/reference
    certificateNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    // Document storage URL (from file upload)
    documentUrl: {
      type: String,
      required: true,
    },

    // File type
    documentType: {
      type: String,
      enum: ['pdf', 'jpg', 'jpeg', 'png'],
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
      enum: ['pending_validation', 'valid', 'expired', 'expiring_soon', 'rejected'],
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

    // Upload method (camera or file)
    uploadMethod: {
      type: String,
      enum: ['camera', 'file'],
      default: 'file',
    },

    // Uploaded by (employee or HR)
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
EmployeeCertificateSchema.index({ expiryDate: 1, status: 1 });
EmployeeCertificateSchema.index({ employeeId: 1, status: 1 });
EmployeeCertificateSchema.index({ employeeId: 1, type: 1 });
EmployeeCertificateSchema.index({ status: 1, expiryDate: 1 });

// Middleware to auto-update status
EmployeeCertificateSchema.pre('save', function(next) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(this.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  
  // Check if expired
  if (expiryDate < today && this.status !== 'expired' && this.status !== 'rejected') {
    this.status = 'expired';
  }
  // Check if expiring soon (30 days)
  else if (this.status === 'valid' || this.status === 'pending_validation') {
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      this.status = 'expiring_soon';
    } else if (daysUntilExpiry > 30 && this.status === 'expiring_soon') {
      this.status = 'valid';
    }
  }
  
  next();
});

// Static method to find certificates expiring soon (for reminders)
EmployeeCertificateSchema.statics.findExpiringSoon = function(days = 30) {
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
    status: { $in: ['valid', 'pending_validation', 'expiring_soon'] },
  }).populate('employeeId', 'firstName lastName email');
};

// Static method to find expired certificates
EmployeeCertificateSchema.statics.findExpired = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return this.find({
    expiryDate: { $lt: today },
    status: { $ne: 'rejected' },
  }).populate('employeeId', 'firstName lastName email');
};

// Static method to check if employee has valid certificate of a type
EmployeeCertificateSchema.statics.hasValidCertificate = async function(employeeId, type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cert = await this.findOne({
    employeeId,
    type,
    status: { $in: ['valid', 'expiring_soon'] },
    expiryDate: { $gte: today },
  });

  return !!cert;
};

// Instance method to check if certificate is expired
EmployeeCertificateSchema.methods.isExpired = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(this.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  return expiryDate < today;
};

// Instance method to check if certificate is expiring soon
EmployeeCertificateSchema.methods.isExpiringSoon = function(days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryThreshold = new Date();
  expiryThreshold.setDate(today.getDate() + days);
  expiryThreshold.setHours(23, 59, 59, 999);
  
  const expiryDate = new Date(this.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);

  return expiryDate >= today && expiryDate <= expiryThreshold;
};

// Instance method to get days until expiry
EmployeeCertificateSchema.methods.getDaysUntilExpiry = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(this.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const EmployeeCertificate =
  mongoose.models.EmployeeCertificate || mongoose.model('EmployeeCertificate', EmployeeCertificateSchema);

