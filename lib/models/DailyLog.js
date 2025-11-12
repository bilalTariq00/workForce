import mongoose, { Schema } from 'mongoose';

/**
 * Daily Site Log Model
 * 
 * Purpose: Site Managers fill this daily log with weather, headcount, deliveries, and issues.
 * Once locked, it's sent to the Contracts Manager and cannot be edited.
 * 
 * Business Rules:
 * - Only one log per site per day (enforced by unique index)
 * - Cannot edit after status is "locked"
 * - Auto-sent to Contracts Manager when locked
 * - Planned headcount is used for attendance verification (SM-02)
 */
const DailyLogSchema = new Schema(
  {
    // Site reference - which construction site this log is for
    siteId: {
      type: Schema.Types.ObjectId,
      ref: 'Site',
      required: true,
    },

    // Site Manager who created this log
    siteManagerId: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Date of the log - only one log per site per day
    date: {
      type: Date,
      required: true,
      // Set to start of day (00:00:00) for consistent comparison
      set: (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      },
    },

    // Weather conditions on site (e.g., "Sunny", "Rainy", "Windy")
    weather: {
      type: String,
      maxlength: 200,
      trim: true,
    },

    // Actual headcount - number of workers actually present today
    // This is compared against planned headcount for attendance verification
    headcount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Planned headcount - number of workers expected today
    // Used in SM-02 (Attendance Verification) to compare with actual attendance
    plannedHeadcount: {
      type: Number,
      min: 0,
    },

    // Material deliveries received today
    // Each delivery includes material description, docket number, photo, and PO match status
    deliveries: [
      {
        // Description of material delivered (e.g., "Concrete", "Steel beams")
        material: {
          type: String,
          required: true,
          trim: true,
        },
        // Delivery docket/receipt number
        docketNumber: {
          type: String,
          required: true,
          trim: true,
        },
        // URL to photo of the delivery docket (stored in cloud storage)
        // Used for verification and PO matching
        docketPhoto: {
          type: String,
          required: true,
        },
        // Status of PO (Purchase Order) matching
        // "matched" = docket matched to a PO
        // "pending" = matching in progress
        // "unmatched" = no matching PO found
        poMatchStatus: {
          type: String,
          enum: ['matched', 'pending', 'unmatched'],
          default: 'pending',
          required: true,
        },
        // Reference to matched Purchase Order (if matched)
        poId: {
          type: Schema.Types.ObjectId,
          ref: 'PurchaseOrder', // Future model
        },
      },
    ],

    // General issues, notes, or problems encountered on site
    issues: {
      type: String,
      maxlength: 1000,
      trim: true,
    },

    // Status of the log
    // "draft" = can be edited
    // "locked" = cannot be edited, ready to send
    // "sent" = sent to Contracts Manager
    status: {
      type: String,
      enum: ['draft', 'locked', 'sent'],
      default: 'draft',
      required: true,
    },

    // Timestamp when log was locked (cannot edit after this)
    lockedAt: {
      type: Date,
    },

    // Timestamp when log was sent to Contracts Manager
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Indexes for performance optimization
 */
// Unique index: Only one log per site per day
DailyLogSchema.index({ siteId: 1, date: 1 }, { unique: true });

// Index for querying logs by site manager and status
DailyLogSchema.index({ siteManagerId: 1, status: 1 });

// Index for querying logs by site and date range
DailyLogSchema.index({ siteId: 1, date: -1 });

/**
 * Pre-save middleware: Validation and business rules
 */
DailyLogSchema.pre('save', function (next) {
  // If status is locked or sent, prevent updates (except status changes)
  if (this.isModified() && !this.isNew) {
    // Allow status changes (draft -> locked -> sent)
    if (this.isModified('status') || this.isModified('lockedAt') || this.isModified('sentAt')) {
      return next();
    }
    
    // If already locked or sent, prevent other modifications
    if (this.status === 'locked' || this.status === 'sent') {
      return next(new Error('Cannot modify locked or sent daily log'));
    }
  }
  
  next();
});

/**
 * Instance method: Lock the log
 * Sets status to "locked" and prevents further edits
 */
DailyLogSchema.methods.lock = function () {
  if (this.status !== 'draft') {
    throw new Error('Can only lock draft logs');
  }
  
  // Validate required fields before locking
  if (!this.headcount && this.headcount !== 0) {
    throw new Error('Headcount is required before locking');
  }
  
  this.status = 'locked';
  this.lockedAt = new Date();
  return this.save();
};

/**
 * Instance method: Send to Contracts Manager
 * Sets status to "sent" and triggers notification
 */
DailyLogSchema.methods.send = function () {
  if (this.status !== 'locked') {
    throw new Error('Can only send locked logs');
  }
  
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Export the model (use existing model if already compiled)
export const DailyLog =
  mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);


