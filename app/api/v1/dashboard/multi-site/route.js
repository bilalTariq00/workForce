import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { Attendance } from '@/lib/models/Attendance';
import { DailyLog } from '@/lib/models/DailyLog';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { Employee } from '@/lib/models/Employee';
import { Alert } from '@/lib/models/Alert';
import { Variation } from '@/lib/models/Variation';

/**
 * GET /api/v1/dashboard/multi-site
 * 
 * Get aggregated dashboard data for all sites
 * 
 * Returns:
 * - List of sites with widgets:
 *   - Headcount (current vs planned)
 *   - Progress % (from daily logs - placeholder for now)
 *   - Incidents count (placeholder - 0 for now)
 *   - Spend (from payroll runs)
 * 
 * Access: Contracts Manager, Admin only
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Contracts Managers and Admin can access
    if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all active sites
    const sites = await Site.find({ status: 'active' })
      .populate('contractsManagerId', 'firstName lastName email')
      .lean();

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current date/time for headcount
    const now = new Date();

    // Aggregate data for each site
    const siteData = await Promise.all(
      sites.map(async (site) => {
        // Get current headcount (attendance today)
        const currentHeadcount = await Attendance.countDocuments({
          siteId: site._id,
          date: today,
          signInTime: { $exists: true },
        });

        // Get planned headcount from today's daily log
        const todayLog = await DailyLog.findOne({
          siteId: site._id,
          date: today,
        }).lean();

        const plannedHeadcount = todayLog?.plannedHeadcount || 0;

        // Get latest daily log for progress calculation
        // For now, we'll use a placeholder - progress % will be implemented later
        // Could be based on WBS progress from daily logs or a separate progress tracking system
        const latestLog = await DailyLog.findOne({
          siteId: site._id,
          status: { $in: ['locked', 'sent'] },
        })
          .sort({ date: -1 })
          .lean();

        // Progress % - placeholder (0% for now, will be implemented in SM-04)
        const progressPercentage = 0; // TODO: Implement when SM-04 is done

        // Incidents count - placeholder (0 for now, will be implemented in EHS-01)
        const incidentsCount = 0; // TODO: Implement when EHS-01 is done

        // Calculate spend from payroll runs
        // Get all payroll runs for employees assigned to this site
        const siteEmployees = await Employee.find({
          siteId: site._id,
          status: 'active',
        }).select('_id').lean();

        const employeeIds = siteEmployees.map(emp => emp._id);

        // Get payroll runs that include these employees
        // Note: This is a simplified calculation - in reality, we'd need to check which timesheets
        // belong to employees on this site
        const payrollRuns = await PayrollRun.find({
          status: { $in: ['calculated', 'exported', 'paid'] },
        }).lean();

        // Calculate total spend from payroll
        // This is a simplified version - ideally we'd track spend per site more accurately
        let totalSpend = 0;
        for (const run of payrollRuns) {
          // For now, we'll use a simple calculation
          // In the future, we'd need to check which employees in the payroll run belong to this site
          if (run.totalGross) {
            // Approximate: divide by number of sites if employee is on this site
            // This is a placeholder - proper implementation would require site tracking in payroll
            totalSpend += run.totalGross / sites.length; // Simplified distribution
          }
        }

        // Get attendance percentage
        const attendancePercentage =
          plannedHeadcount > 0
            ? Math.round((currentHeadcount / plannedHeadcount) * 100)
            : 0;

        // Determine status based on attendance
        let status = 'good';
        if (attendancePercentage < 80) {
          status = 'critical';
        } else if (attendancePercentage < 95) {
          status = 'warning';
        }

        // Check if daily log is missing for today
        const hasDailyLog = !!todayLog;
        const missingDailyLog = !hasDailyLog && new Date().getHours() >= 17; // After 5 PM

        // Get alert counts for this site
        const activeAlertsCount = await Alert.getActiveCount(site._id);
        const criticalAlertsCount = await Alert.getCriticalCount(site._id);

        // Get variation data for this site
        const pendingVariations = await Variation.find({
          siteId: site._id,
          status: 'pending',
        }).lean();

        const approvedVariations = await Variation.find({
          siteId: site._id,
          status: 'approved',
        }).lean();

        const totalVariationCost = approvedVariations.reduce(
          (sum, v) => sum + (v.cost || 0),
          0
        );

        const totalVariationDelay = approvedVariations.reduce(
          (sum, v) => sum + (v.delayDays || 0),
          0
        );

        return {
          _id: site._id.toString(),
          name: site.name,
          siteCode: site.siteCode,
          address: site.address,
          status: site.status,
          contractsManager: site.contractsManagerId
            ? {
                _id: site.contractsManagerId._id.toString(),
                name: `${site.contractsManagerId.firstName} ${site.contractsManagerId.lastName}`,
                email: site.contractsManagerId.email,
              }
            : null,
          widgets: {
            headcount: {
              current: currentHeadcount,
              planned: plannedHeadcount,
              difference: currentHeadcount - plannedHeadcount,
              attendancePercentage,
              status, // 'good', 'warning', 'critical'
            },
            progress: {
              percentage: progressPercentage,
              lastUpdated: latestLog?.date || null,
            },
            incidents: {
              count: incidentsCount,
              // TODO: Add severity breakdown when EHS-01 is implemented
            },
            spend: {
              total: Math.round(totalSpend * 100) / 100,
              currency: 'GBP',
            },
            variations: {
              pending: pendingVariations.length,
              approved: approvedVariations.length,
              totalCost: Math.round(totalVariationCost * 100) / 100,
              totalDelay: totalVariationDelay,
            },
          },
          alerts: {
            missingDailyLog,
            lowAttendance: attendancePercentage < 80,
            activeCount: activeAlertsCount,
            criticalCount: criticalAlertsCount,
          },
        };
      })
    );

    // Get total alert counts
    const totalActiveAlerts = await Alert.countDocuments({ status: 'active' });
    const totalCriticalAlerts = await Alert.getCriticalCount();

    // Calculate totals across all sites
    const totals = {
      headcount: {
        current: siteData.reduce((sum, site) => sum + site.widgets.headcount.current, 0),
        planned: siteData.reduce((sum, site) => sum + site.widgets.headcount.planned, 0),
      },
      progress: {
        average: siteData.length > 0
          ? Math.round(siteData.reduce((sum, site) => sum + site.widgets.progress.percentage, 0) / siteData.length)
          : 0,
      },
      incidents: {
        total: siteData.reduce((sum, site) => sum + site.widgets.incidents.count, 0),
      },
      spend: {
        total: Math.round(siteData.reduce((sum, site) => sum + site.widgets.spend.total, 0) * 100) / 100,
      },
      alerts: {
        active: totalActiveAlerts,
        critical: totalCriticalAlerts,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        sites: siteData,
        totals,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching multi-site dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching dashboard data',
        },
      },
      { status: 500 }
    );
  }
}

