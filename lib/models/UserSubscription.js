import mongoose, { Schema } from 'mongoose';

const UserSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    moduleCode: {
      type: String,
      required: true,
      enum: ['hrm', 'registers', 'process_management', 'finance_payroll', 'equipment', 'procurement'],
      index: true,
    },
    isAdmin: {
      type: Boolean,
      default: true, // Purchaser becomes admin
    },
    purchasedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'expired'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one subscription per user per module
UserSubscriptionSchema.index({ userId: 1, moduleCode: 1 }, { unique: true });
UserSubscriptionSchema.index({ userId: 1, status: 1 });

export const UserSubscription =
  mongoose.models.UserSubscription || mongoose.model('UserSubscription', UserSubscriptionSchema);


