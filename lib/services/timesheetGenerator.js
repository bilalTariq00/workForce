import { Timesheet } from '@/lib/models/Timesheet';
import { AttendanceEvent } from '@/lib/models/AttendanceEvent';
import { Employee } from '@/lib/models/Employee';
import { connectDB } from '@/lib/db/mongodb';

/**
 * Timesheet Generator Service
 * 
 * Purpose: Auto-generate timesheets from attendance events (IN/OUT pairs)
 * Used in HR-04 (Timesheet Approval)
 * 
 * Features:
 * - Pairs IN/OUT events to calculate hours
 * - Handles multiple shifts per day
 * - Flags missing OUT events
 * - Supports both QR-based and manual timesheets
 */

/**
 * Calculate hours worked from IN/OUT event pair
 * 
 * @param {Object} inEvent - IN event
 * @param {Object} outEvent - OUT event (optional)
 * @returns {number} - Hours worked (defaults to 8 if no OUT event)
 */
function calculateHoursFromEvents(inEvent, outEvent) {
  if (outEvent && inEvent) {
    const diff = outEvent.timestamp - inEvent.timestamp;
    const hours = diff / (1000 * 60 * 60); // Convert milliseconds to hours
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  }

  // If no OUT event, default to 8 hours (standard work day)
  // This will be flagged as missing OUT event
  return 8.0;
}

/**
 * Pair IN/OUT events for a day
 * 
 * @param {Array} events - All events for the day (sorted by timestamp)
 * @returns {Object} - { shifts: Array of {in, out, hours, eventIds}, missingOut: Array of unpaired IN events }
 */
function pairEventsForDay(events) {
  const shifts = [];
  const missingOut = [];
  let currentInEvent = null;

  for (const event of events) {
    if (event.type === 'IN') {
      // If there's an unpaired IN event, flag it as missing OUT
      if (currentInEvent) {
        missingOut.push({
          date: new Date(currentInEvent.timestamp),
          lastInEvent: currentInEvent._id,
          notes: 'Missing OUT event - defaulted to 8 hours',
        });
        // Create a shift with default 8 hours
        shifts.push({
          in: currentInEvent,
          out: null,
          hours: 8.0,
          eventIds: [currentInEvent._id],
          siteId: currentInEvent.siteId,
        });
      }
      currentInEvent = event;
    } else if (event.type === 'OUT') {
      if (currentInEvent) {
        // Pair found
        const hours = calculateHoursFromEvents(currentInEvent, event);
        shifts.push({
          in: currentInEvent,
          out: event,
          hours,
          eventIds: [currentInEvent._id, event._id],
          siteId: currentInEvent.siteId, // Use site from IN event
        });
        currentInEvent = null;
      } else {
        // OUT without IN - ignore or log as error
        console.warn('OUT event without matching IN event:', event._id);
      }
    }
  }

  // If there's still an unpaired IN event at the end, flag it
  if (currentInEvent) {
    missingOut.push({
      date: new Date(currentInEvent.timestamp),
      lastInEvent: currentInEvent._id,
      notes: 'Missing OUT event - defaulted to 8 hours',
    });
    // Create a shift with default 8 hours
    shifts.push({
      in: currentInEvent,
      out: null,
      hours: 8.0,
      eventIds: [currentInEvent._id],
      siteId: currentInEvent.siteId,
    });
  }

  return { shifts, missingOut };
}

/**
 * Generate timesheet for an employee for a specific week from attendance events
 * 
 * @param {string} employeeId - Employee ID
 * @param {Date} weekStartDate - Week start date (Monday)
 * @param {string} source - Source of timesheet ('QR' or 'MANUAL')
 * @returns {Object} - Generated timesheet
 */
export async function generateTimesheetForEmployee(employeeId, weekStartDate, source = 'QR') {
  await connectDB();

  // Get week dates
  const weekStart = Timesheet.getWeekStart(weekStartDate);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = Timesheet.getWeekEnd(weekStartDate);
  weekEnd.setHours(23, 59, 59, 999);

  // Check if timesheet already exists
  const existingTimesheet = await Timesheet.findOne({
    employeeId,
    weekStartDate: weekStart,
  });

  if (existingTimesheet) {
    // Check if timesheet is locked or in a payroll run
    if (existingTimesheet.status === 'locked') {
      throw new Error('Cannot regenerate locked timesheet');
    }
    
    // Check if timesheet is included in any payroll run
    const { PayrollRun } = await import('@/lib/models/PayrollRun');
    const payrollRun = await PayrollRun.findOne({
      timesheets: existingTimesheet._id,
      status: { $in: ['calculated', 'exported', 'paid'] },
    });
    
    if (payrollRun) {
      throw new Error('Cannot regenerate timesheet that is included in a payroll run');
    }
  }

  // Get all valid attendance events for this employee in this week
  const events = await AttendanceEvent.find({
    employeeId,
    timestamp: {
      $gte: weekStart,
      $lte: weekEnd,
    },
    isValid: true, // Only use valid events
  })
    .sort({ timestamp: 1 })
    .lean();

  // Group events by date
  const eventsByDate = {};
  for (const event of events) {
    const eventDate = new Date(event.timestamp);
    eventDate.setHours(0, 0, 0, 0);
    const dateKey = eventDate.toISOString();

    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  }

  // Build daily hours array
  const allDays = [];
  const allMissingOut = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);
    const dateKey = currentDate.toISOString();

    const dayEvents = eventsByDate[dateKey] || [];

    if (dayEvents.length > 0) {
      // Pair events for this day
      const { shifts, missingOut } = pairEventsForDay(dayEvents);

      // Calculate total hours for the day (sum of all shifts)
      const totalHours = shifts.reduce((sum, shift) => sum + shift.hours, 0);

      // Collect all event IDs
      const allEventIds = shifts.flatMap(shift => shift.eventIds);

      // Get site ID (use first shift's site, or null if no shifts)
      const siteId = shifts.length > 0 ? shifts[0].siteId : null;

      allDays.push({
        date: currentDate,
        hours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
        eventIds: allEventIds,
        attendanceId: null, // Legacy field, kept for backward compatibility
        siteId,
        shifts: shifts.length,
      });

      // Collect missing OUT events
      if (missingOut.length > 0) {
        allMissingOut.push(...missingOut);
      }
    } else {
      // No events for this day
      allDays.push({
        date: currentDate,
        hours: 0,
        eventIds: [],
        attendanceId: null,
        siteId: null,
        shifts: 0,
      });
    }
  }

  // Create or update timesheet
  if (existingTimesheet) {
    // Only update if status is draft
    if (existingTimesheet.status === 'draft') {
      existingTimesheet.hours = allDays;
      existingTimesheet.weekEndDate = weekEnd;
      existingTimesheet.source = source;
      existingTimesheet.missingOutEvents = allMissingOut;
      await existingTimesheet.save();
      return existingTimesheet;
    } else {
      // Return existing timesheet if not draft
      return existingTimesheet;
    }
  } else {
    // Create new timesheet
    const timesheet = await Timesheet.create({
      employeeId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      hours: allDays,
      status: 'draft',
      source,
      missingOutEvents: allMissingOut,
    });

    return timesheet;
  }
}

/**
 * Generate timesheets for all employees for a specific week
 * 
 * @param {Date} weekStartDate - Week start date (Monday)
 * @param {string} source - Source of timesheet ('QR' or 'MANUAL')
 * @returns {Array} - Array of generated timesheets
 */
export async function generateTimesheetsForWeek(weekStartDate, source = 'QR') {
  await connectDB();

  // Get all active employees with role 'labour'
  const employees = await Employee.find({
    role: 'labour',
    status: 'active',
  }).select('_id');

  const timesheets = [];
  const errors = [];

  for (const employee of employees) {
    try {
      const timesheet = await generateTimesheetForEmployee(employee._id, weekStartDate, source);
      timesheets.push(timesheet);
    } catch (error) {
      console.error(`Error generating timesheet for employee ${employee._id}:`, error);
      errors.push({ employeeId: employee._id, error: error.message });
      // Continue with other employees even if one fails
    }
  }

  return { timesheets, errors };
}

/**
 * Generate timesheet for current week
 * 
 * @param {string} employeeId - Employee ID
 * @param {string} source - Source of timesheet ('QR' or 'MANUAL')
 * @returns {Object} - Generated timesheet
 */
export async function generateCurrentWeekTimesheet(employeeId, source = 'QR') {
  const today = new Date();
  return generateTimesheetForEmployee(employeeId, today, source);
}

/**
 * Generate timesheet for a specific date range (for manual timesheets)
 * 
 * @param {string} employeeId - Employee ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Array} manualHours - Array of {date, hours, siteId} for manual entry
 * @returns {Object} - Generated timesheet
 */
export async function generateManualTimesheet(employeeId, startDate, endDate, manualHours) {
  await connectDB();

  // Get week dates for the start date
  const weekStart = Timesheet.getWeekStart(startDate);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = Timesheet.getWeekEnd(startDate);
  weekEnd.setHours(23, 59, 59, 999);

  // Check if timesheet already exists
  const existingTimesheet = await Timesheet.findOne({
    employeeId,
    weekStartDate: weekStart,
  });

  if (existingTimesheet && existingTimesheet.status === 'locked') {
    throw new Error('Cannot regenerate locked timesheet');
  }

  // Build daily hours array from manual hours
  const allDays = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);

    const manualEntry = manualHours.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === currentDate.getTime();
    });

    if (manualEntry) {
      allDays.push({
        date: currentDate,
        hours: manualEntry.hours || 0,
        eventIds: [],
        attendanceId: null,
        siteId: manualEntry.siteId || null,
        shifts: 1,
      });
    } else {
      allDays.push({
        date: currentDate,
        hours: 0,
        eventIds: [],
        attendanceId: null,
        siteId: null,
        shifts: 0,
      });
    }
  }

  // Create or update timesheet
  if (existingTimesheet) {
    if (existingTimesheet.status === 'draft') {
      existingTimesheet.hours = allDays;
      existingTimesheet.weekEndDate = weekEnd;
      existingTimesheet.source = 'MANUAL';
      await existingTimesheet.save();
      return existingTimesheet;
    } else {
      return existingTimesheet;
    }
  } else {
    const timesheet = await Timesheet.create({
      employeeId,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      hours: allDays,
      status: 'draft',
      source: 'MANUAL',
      missingOutEvents: [],
    });

    return timesheet;
  }
}
