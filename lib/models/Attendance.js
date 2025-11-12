import mongoose, { Schema } from 'mongoose';

const AttendanceSchema = new Schema(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    signInTime: {
      type: Date,
      required: true,
    },
    signOutTime: {
      type: Date,
    },
    signInMethod: {
      type: String,
      enum: ['qr', 'barcode', 'manual'],
      default: 'qr',
    },
    signOutMethod: {
      type: String,
      enum: ['qr', 'barcode', 'manual'],
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
    distanceFromSite: {
      type: Number, // in meters
    },
    hoursWorked: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ siteId: 1, date: 1, signInTime: -1 });
AttendanceSchema.index({ employeeId: 1, date: -1 });

// Calculate hours worked before saving
AttendanceSchema.pre('save', function (next) {
  if (this.signOutTime && this.signInTime) {
    const diff = this.signOutTime - this.signInTime;
    this.hoursWorked = Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
  }
  next();
});

export const Attendance =
  mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);

