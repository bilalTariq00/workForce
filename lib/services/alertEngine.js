import { Alert } from '@/lib/models/Alert';
import { DailyLog } from '@/lib/models/DailyLog';
import { Attendance } from '@/lib/models/Attendance';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { Timesheet } from '@/lib/models/Timesheet';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';

/**
 * Alert Engine Service
 * 
 * Purpose: Generate alerts based on business rules
 * Used in CM-03 (Exception Alert Review)
 * 
 * Alert Rules:
 * 1. Cost Variance: Budget vs actual spend exceeds threshold
 * 2. Missed Daily Log: No daily log for a site after 5 PM
 * 3. High Incident Rate: Incident count exceeds threshold (when EHS-01 is implemented)
 * 4. Low Attendance: Attendance < 80% of planned
 * 5. Missing Timesheet: No timesheet generated for employee for current week
 */

/**
 * Generate cost variance alert
 * 
 * @param {Object} site - Site object
 * @param {number} budget - Budget amount (if available)
 * @param {number} actualSpend - Actual spend amount
 * @returns {Object|null} - Alert object or null
 */
async function generateCostVarianceAlert(site, budget, actualSpend) {
  if (!budget || budget === 0) {
    return null; // No budget set, skip
  }

  const variance = ((actualSpend - budget) / budget) * 100;
  const threshold = 10; // 10% variance threshold
  const criticalThreshold = 20; // 20% for critical

  if (variance > criticalThreshold) {
    // Check if alert already exists
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'cost_variance',
      status: 'active',
    });

    if (existingAlert) {
      // Update existing alert
      existingAlert.description = `Budget variance: ${variance.toFixed(2)}% (Actual: £${actualSpend.toLocaleString('en-GB', { minimumFractionDigits: 2 })} vs Budget: £${budget.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`;
      existingAlert.metadata = {
        budget,
        actualSpend,
        variance: variance.toFixed(2),
      };
      await existingAlert.save();
      return existingAlert;
    }

    // Create new critical alert
    return await Alert.create({
      type: 'cost_variance',
      severity: 'critical',
      siteId: site._id,
      title: `Critical Budget Variance: ${variance.toFixed(2)}%`,
      description: `Budget variance: ${variance.toFixed(2)}% (Actual: £${actualSpend.toLocaleString('en-GB', { minimumFractionDigits: 2 })} vs Budget: £${budget.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`,
      metadata: {
        budget,
        actualSpend,
        variance: variance.toFixed(2),
      },
      status: 'active',
    });
  } else if (variance > threshold) {
    // Check if alert already exists
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'cost_variance',
      status: 'active',
    });

    if (existingAlert) {
      // Update existing alert
      existingAlert.description = `Budget variance: ${variance.toFixed(2)}% (Actual: £${actualSpend.toLocaleString('en-GB', { minimumFractionDigits: 2 })} vs Budget: £${budget.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`;
      existingAlert.metadata = {
        budget,
        actualSpend,
        variance: variance.toFixed(2),
      };
      await existingAlert.save();
      return existingAlert;
    }

    // Create new warning alert
    return await Alert.create({
      type: 'cost_variance',
      severity: 'warning',
      siteId: site._id,
      title: `Budget Variance: ${variance.toFixed(2)}%`,
      description: `Budget variance: ${variance.toFixed(2)}% (Actual: £${actualSpend.toLocaleString('en-GB', { minimumFractionDigits: 2 })} vs Budget: £${budget.toLocaleString('en-GB', { minimumFractionDigits: 2 })})`,
      metadata: {
        budget,
        actualSpend,
        variance: variance.toFixed(2),
      },
      status: 'active',
    });
  }

  return null;
}

/**
 * Generate missed daily log alert
 * 
 * @param {Object} site - Site object
 * @returns {Object|null} - Alert object or null
 */
async function generateMissedDailyLogAlert(site) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  // Only generate alert after 5 PM
  if (now.getHours() < 17) {
    return null;
  }

  // Check if daily log exists for today
  const dailyLog = await DailyLog.findOne({
    siteId: site._id,
    date: today,
  });

  if (dailyLog) {
    // Log exists, check if there's an active alert and resolve it
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'missed_daily_log',
      status: 'active',
    });

    if (existingAlert) {
      // Auto-resolve if log was created
      await existingAlert.resolve(null, 'Daily log was created');
    }

    return null;
  }

  // Check if alert already exists
  const existingAlert = await Alert.findOne({
    siteId: site._id,
    type: 'missed_daily_log',
    status: 'active',
    generatedAt: {
      $gte: new Date(today),
    },
  });

  if (existingAlert) {
    return existingAlert; // Alert already exists for today
  }

  // Create new alert
  return await Alert.create({
    type: 'missed_daily_log',
    severity: 'warning',
    siteId: site._id,
    title: 'Daily Log Missing',
    description: `No daily log has been submitted for ${site.name} today. Expected by 5 PM.`,
    metadata: {
      expectedDate: today,
      siteName: site.name,
    },
    status: 'active',
  });
}

/**
 * Generate low attendance alert
 * 
 * @param {Object} site - Site object
 * @param {number} plannedHeadcount - Planned headcount
 * @param {number} actualHeadcount - Actual headcount
 * @returns {Object|null} - Alert object or null
 */
async function generateLowAttendanceAlert(site, plannedHeadcount, actualHeadcount) {
  if (plannedHeadcount === 0) {
    return null; // No planned headcount
  }

  const attendancePercentage = (actualHeadcount / plannedHeadcount) * 100;
  const warningThreshold = 80; // 80% for warning
  const criticalThreshold = 70; // 70% for critical

  if (attendancePercentage < criticalThreshold) {
    // Check if alert already exists
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'low_attendance',
      status: 'active',
    });

    if (existingAlert) {
      // Update existing alert
      existingAlert.description = `Low attendance: ${attendancePercentage.toFixed(1)}% (${actualHeadcount}/${plannedHeadcount} workers present)`;
      existingAlert.metadata = {
        plannedHeadcount,
        actualHeadcount,
        attendancePercentage: attendancePercentage.toFixed(1),
      };
      existingAlert.severity = 'critical';
      await existingAlert.save();
      return existingAlert;
    }

    // Create new critical alert
    return await Alert.create({
      type: 'low_attendance',
      severity: 'critical',
      siteId: site._id,
      title: `Critical Low Attendance: ${attendancePercentage.toFixed(1)}%`,
      description: `Low attendance: ${attendancePercentage.toFixed(1)}% (${actualHeadcount}/${plannedHeadcount} workers present)`,
      metadata: {
        plannedHeadcount,
        actualHeadcount,
        attendancePercentage: attendancePercentage.toFixed(1),
      },
      status: 'active',
    });
  } else if (attendancePercentage < warningThreshold) {
    // Check if alert already exists
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'low_attendance',
      status: 'active',
    });

    if (existingAlert) {
      // Update existing alert
      existingAlert.description = `Low attendance: ${attendancePercentage.toFixed(1)}% (${actualHeadcount}/${plannedHeadcount} workers present)`;
      existingAlert.metadata = {
        plannedHeadcount,
        actualHeadcount,
        attendancePercentage: attendancePercentage.toFixed(1),
      };
      existingAlert.severity = 'warning';
      await existingAlert.save();
      return existingAlert;
    }

    // Create new warning alert
    return await Alert.create({
      type: 'low_attendance',
      severity: 'warning',
      siteId: site._id,
      title: `Low Attendance: ${attendancePercentage.toFixed(1)}%`,
      description: `Low attendance: ${attendancePercentage.toFixed(1)}% (${actualHeadcount}/${plannedHeadcount} workers present)`,
      metadata: {
        plannedHeadcount,
        actualHeadcount,
        attendancePercentage: attendancePercentage.toFixed(1),
      },
      status: 'active',
    });
  } else {
    // Attendance is good, resolve any existing alerts
    const existingAlert = await Alert.findOne({
      siteId: site._id,
      type: 'low_attendance',
      status: 'active',
    });

    if (existingAlert) {
      await existingAlert.resolve(null, 'Attendance has improved');
    }
  }

  return null;
}

/**
 * Generate missing timesheet alert
 * 
 * @param {Object} site - Site object
 * @returns {Array} - Array of alert objects
 */
async function generateMissingTimesheetAlerts(site) {
  const alerts = [];
  const today = new Date();
  const weekStart = Timesheet.getWeekStart(today);
  weekStart.setHours(0, 0, 0, 0);

  // Get all active employees assigned to this site
  const employees = await Employee.find({
    siteId: site._id,
    role: 'labour',
    status: 'active',
  }).lean();

  for (const employee of employees) {
    // Check if timesheet exists for current week
    const timesheet = await Timesheet.findOne({
      employeeId: employee._id,
      weekStartDate: weekStart,
    });

    if (!timesheet) {
      // Check if alert already exists
      const existingAlert = await Alert.findOne({
        siteId: site._id,
        type: 'missing_timesheet',
        status: 'active',
        'metadata.employeeId': employee._id.toString(),
        'metadata.weekStartDate': weekStart,
      });

      if (existingAlert) {
        continue; // Alert already exists
      }

      // Create new alert
      const alert = await Alert.create({
        type: 'missing_timesheet',
        severity: 'warning',
        siteId: site._id,
        title: `Missing Timesheet: ${employee.firstName} ${employee.lastName}`,
        description: `No timesheet generated for ${employee.firstName} ${employee.lastName} (${employee.employeeId}) for week starting ${weekStart.toLocaleDateString()}`,
        metadata: {
          employeeId: employee._id.toString(),
          employeeName: `${employee.firstName} ${employee.lastName}`,
          employeeIdCode: employee.employeeId,
          weekStartDate: weekStart,
        },
        status: 'active',
      });

      alerts.push(alert);
    }
  }

  return alerts;
}

/**
 * Generate all alerts for a site
 * 
 * @param {Object} site - Site object
 * @returns {Array} - Array of generated alerts
 */
export async function generateAlertsForSite(site) {
  const alerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // 1. Missed Daily Log Alert
    const missedLogAlert = await generateMissedDailyLogAlert(site);
    if (missedLogAlert) {
      alerts.push(missedLogAlert);
    }

    // 2. Low Attendance Alert
    const dailyLog = await DailyLog.findOne({
      siteId: site._id,
      date: today,
    }).lean();

    if (dailyLog && dailyLog.plannedHeadcount) {
      // Get actual headcount from attendance
      const actualHeadcount = await Attendance.countDocuments({
        siteId: site._id,
        date: today,
        signInTime: { $exists: true },
      });

      const lowAttendanceAlert = await generateLowAttendanceAlert(
        site,
        dailyLog.plannedHeadcount,
        actualHeadcount
      );
      if (lowAttendanceAlert) {
        alerts.push(lowAttendanceAlert);
      }
    }

    // 3. Missing Timesheet Alerts
    const missingTimesheetAlerts = await generateMissingTimesheetAlerts(site);
    alerts.push(...missingTimesheetAlerts);

    // 4. Cost Variance Alert (if budget tracking is implemented)
    // For now, we'll skip this as budget tracking isn't fully implemented
    // This can be added when budget management is available

    // 5. High Incident Rate Alert (when EHS-01 is implemented)
    // This will be added when incident tracking is available

    return alerts;
  } catch (error) {
    console.error(`Error generating alerts for site ${site._id}:`, error);
    return alerts;
  }
}

/**
 * Generate alerts for all sites
 * 
 * @returns {Array} - Array of all generated alerts
 */
export async function generateAlertsForAllSites() {
  const sites = await Site.find({ status: 'active' }).lean();
  const allAlerts = [];

  for (const site of sites) {
    const alerts = await generateAlertsForSite(site);
    allAlerts.push(...alerts);
  }

  return allAlerts;
}

/**
 * Auto-resolve alerts that are no longer valid
 * 
 * @param {Object} site - Site object
 */
export async function autoResolveAlerts(site) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto-resolve missed daily log alerts if log was created
  const dailyLog = await DailyLog.findOne({
    siteId: site._id,
    date: today,
  });

  if (dailyLog) {
    const missedLogAlerts = await Alert.find({
      siteId: site._id,
      type: 'missed_daily_log',
      status: 'active',
      generatedAt: {
        $gte: new Date(today),
      },
    });

    for (const alert of missedLogAlerts) {
      await alert.resolve(null, 'Daily log was created');
    }
  }

  // Auto-resolve low attendance alerts if attendance improved
  const dailyLogForAttendance = await DailyLog.findOne({
    siteId: site._id,
    date: today,
  }).lean();

  if (dailyLogForAttendance && dailyLogForAttendance.plannedHeadcount) {
    const actualHeadcount = await Attendance.countDocuments({
      siteId: site._id,
      date: today,
      signInTime: { $exists: true },
    });

    const attendancePercentage =
      (actualHeadcount / dailyLogForAttendance.plannedHeadcount) * 100;

    if (attendancePercentage >= 80) {
      const lowAttendanceAlerts = await Alert.find({
        siteId: site._id,
        type: 'low_attendance',
        status: 'active',
      });

      for (const alert of lowAttendanceAlerts) {
        await alert.resolve(null, 'Attendance has improved above 80%');
      }
    }
  }
}

