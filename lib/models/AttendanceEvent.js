import mongoose, { Schema } from 'mongoose';

/**
 * AttendanceEvent Model
 * 
 * Purpose: Track individual IN/OUT events from QR scans
 * Used for timesheet generation and attendance tracking
 * 
 * Business Rules:
 * - Each QR scan creates an event (IN or OUT)
 * - Events are paired to generate timesheet entries
 * - Events include location validation
 * - Invalid scans are logged for audit
 */
const AttendanceEventSchema = new Schema(
  {
    // Employee who scanned
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    
    // Site where scan occurred
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
      index: true,
    },
    
    // Event timestamp
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    
    // Event type: IN or OUT
    type: {
      type: String,
      enum: ['IN', 'OUT'],
      required: true,
      index: true,
    },
    
    // Location where scan occurred
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
    
    // Distance from site center (in meters)
    distanceFromSite: {
      type: Number,
    },
    
    // Whether this event is valid (within radius)
    isValid: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    
    // Device information
    deviceInfo: {
      userAgent: String,
      platform: String,
      vendor: String,
    },
    
    // QR token used for this scan
    qrToken: {
      type: String,
      index: true,
    },
    
    // Reference to timesheet entry if generated
    timesheetId: {
      type: Schema.Types.ObjectId,
      ref: 'Timesheet',
      index: true,
    },
    
    // Notes (e.g., reason for invalid scan)
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
AttendanceEventSchema.index({ employeeId: 1, timestamp: -1 });
AttendanceEventSchema.index({ siteId: 1, timestamp: -1 });
AttendanceEventSchema.index({ employeeId: 1, siteId: 1, timestamp: -1 });
AttendanceEventSchema.index({ employeeId: 1, type: 1, timestamp: -1 });
AttendanceEventSchema.index({ isValid: 1, timestamp: -1 });

/**
 * Static method: Get events for an employee on a date
 */
AttendanceEventSchema.statics.getEmployeeEventsForDate = async function(employeeId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    employeeId,
    timestamp: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    isValid: true,
  })
    .populate('siteId', 'name siteCode')
    .sort({ timestamp: 1 })
    .lean();
};

/**
 * Static method: Get unpaired IN events (missing OUT)
 */
AttendanceEventSchema.statics.getUnpairedEvents = async function(employeeId, startDate, endDate) {
  const events = await this.find({
    employeeId,
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
    isValid: true,
    timesheetId: { $exists: false },
  })
    .sort({ timestamp: 1 })
    .lean();
  
  // Find IN events without matching OUT
  const unpaired = [];
  let lastInEvent = null;
  
  for (const event of events) {
    if (event.type === 'IN') {
      lastInEvent = event;
    } else if (event.type === 'OUT' && lastInEvent) {
      lastInEvent = null; // Paired
    }
  }
  
  if (lastInEvent) {
    unpaired.push(lastInEvent);
  }
  
  return unpaired;
};

export const AttendanceEvent =
  mongoose.models.AttendanceEvent || mongoose.model('AttendanceEvent', AttendanceEventSchema);





