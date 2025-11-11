import mongoose, { Schema } from 'mongoose';

const SiteSchema = new Schema(
  {
    siteCode: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      postcode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'UK',
      },
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    attendanceRadius: {
      type: Number,
      required: true,
      default: 100, // meters
      min: 10,
      max: 1000,
    },
    contractsManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on_hold'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SiteSchema.index({ siteCode: 1 }, { unique: true });
SiteSchema.index({ contractsManagerId: 1, status: 1 });
SiteSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Site =
  mongoose.models.Site || mongoose.model('Site', SiteSchema);

