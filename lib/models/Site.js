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
    // Geofence configuration (optional - if not set, uses attendanceRadius as circle)
    geofence: {
      type: {
        type: String,
        enum: ['circle', 'polygon'],
        default: 'circle',
      },
      // For circle geofence
      center: {
        latitude: Number,
        longitude: Number,
      },
      radius: Number, // in meters
      // For polygon geofence
      polygon: [
        {
          latitude: Number,
          longitude: Number,
        },
      ],
    },
    contractsManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: false, // Made optional - sites can use Site Managers instead
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on_hold'],
      default: 'active',
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
// Note: siteCode already has unique index from schema definition
SiteSchema.index({ contractsManagerId: 1, status: 1 });
SiteSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Site =
  mongoose.models.Site || mongoose.model('Site', SiteSchema);

