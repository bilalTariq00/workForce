import { Timesheet } from '@/lib/models/Timesheet';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';

/**
 * Timesheet Generator Service
 * 
 * Purpose: Auto-generate timesheets from attendance records
 * Used in HR-04 (Timesheet Approval)
 */

/**
 * Calculate hours worked from attendance record
 * 
 * @param {Object} attendance - Attendance record
 * @returns {number} - Hours worked (defaults to 8 if no sign-out)
 */
function calculateHours(attendance) {
  if (attendance.signOutTime && attendance.signInTime) {
    const diff = attendance.signOutTime - attendance.signInTime;
    const hours = diff / (1000 * 60 * 60); // Convert milliseconds to hours
    return Math.round(hours * 100) / 100; // Round to 2 decimal places
  }

  // If no sign-out, default to 8 hours (standard work day)
  return 8.0;
}

/**
 * Generate timesheet for an employee for a specific week
 * 
 * @param {string} employeeId - Employee ID
 * @param {Date} weekStartDate - Week start date (Monday)
 * @returns {Object} - Generated timesheet
 */
export async function generateTimesheetForEmployee(employeeId, weekStartDate) {
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

  if (existingTimesheet && existingTimesheet.status === 'locked') {
    throw new Error('Cannot regenerate locked timesheet');
  }

  // Get all attendance records for this employee in this week
  const attendanceRecords = await Attendance.find({
    employeeId,
    date: {
      $gte: weekStart,
      $lte: weekEnd,
    },
  })
    .sort({ date: 1 })
    .lean();

  // Build daily hours array
  const hours = attendanceRecords.map((attendance) => ({
    date: attendance.date,
    hours: calculateHours(attendance),
    attendanceId: attendance._id,
    siteId: attendance.siteId,
  }));

  // Fill in missing days with 0 hours (for days with no attendance)
  const allDays = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    currentDate.setHours(0, 0, 0, 0);

    const dayAttendance = attendanceRecords.find((att) => {
      const attDate = new Date(att.date);
      attDate.setHours(0, 0, 0, 0);
      return attDate.getTime() === currentDate.getTime();
    });

    if (dayAttendance) {
      allDays.push({
        date: currentDate,
        hours: calculateHours(dayAttendance),
        attendanceId: dayAttendance._id,
        siteId: dayAttendance.siteId,
      });
    } else {
      // No attendance for this day
      allDays.push({
        date: currentDate,
        hours: 0,
        attendanceId: null,
        siteId: null,
      });
    }
  }

  // Create or update timesheet
  if (existingTimesheet) {
    // Only update if status is draft
    if (existingTimesheet.status === 'draft') {
      existingTimesheet.hours = allDays;
      existingTimesheet.weekEndDate = weekEnd;
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
    });

    return timesheet;
  }
}

/**
 * Generate timesheets for all employees for a specific week
 * 
 * @param {Date} weekStartDate - Week start date (Monday)
 * @returns {Array} - Array of generated timesheets
 */
export async function generateTimesheetsForWeek(weekStartDate) {
  // Get all active employees with role 'labour'
  const employees = await Employee.find({
    role: 'labour',
    status: 'active',
  }).select('_id');

  const timesheets = [];

  for (const employee of employees) {
    try {
      const timesheet = await generateTimesheetForEmployee(employee._id, weekStartDate);
      timesheets.push(timesheet);
    } catch (error) {
      console.error(`Error generating timesheet for employee ${employee._id}:`, error);
      // Continue with other employees even if one fails
    }
  }

  return timesheets;
}

/**
 * Generate timesheet for current week
 * 
 * @param {string} employeeId - Employee ID
 * @returns {Object} - Generated timesheet
 */
export async function generateCurrentWeekTimesheet(employeeId) {
  const today = new Date();
  return generateTimesheetForEmployee(employeeId, today);
}

