import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';

/**
 * GET /api/v1/sites/[id]/attendance-verification
 * 
 * Compare planned vs actual headcount for a site
 * 
 * Query parameters:
 * - date: Optional date (defaults to today)
 * 
 * Access: Site Managers (their assigned site), Contracts Managers, HR, Admin
 */
export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const siteId = params.id;
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');

    // Parse date (default to today)
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam);
    }
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get site
    const site = await Site.findById(siteId).lean();
    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } },
        { status: 404 }
      );
    }

    // Check access: Site Managers can only access their assigned site
    if (session.user.role === 'site_manager') {
      const siteManager = await Employee.findById(session.user.id).lean();
      if (!siteManager || siteManager.siteId?.toString() !== siteId) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
          { status: 403 }
        );
      }
    }

    // Get daily log for the date (contains planned headcount)
    const dailyLog = await DailyLog.findOne({
      siteId,
      date: {
        $gte: targetDate,
        $lt: nextDay,
      },
    }).lean();

    // Get all employees assigned to this site
    const assignedEmployees = await Employee.find({
      siteId,
      role: 'labour', // Only count labour workers
      status: 'active',
    })
      .select('_id firstName lastName employeeId email')
      .lean();

    // Get actual attendance records for today
    const attendanceRecords = await Attendance.find({
      siteId,
      date: {
        $gte: targetDate,
        $lt: nextDay,
      },
    })
      .populate('employeeId', 'firstName lastName employeeId email')
      .lean();

    // Build comparison data
    const plannedHeadcount = dailyLog?.plannedHeadcount || assignedEmployees.length;
    const actualHeadcount = attendanceRecords.length;

    // Create sets for quick lookup
    const presentEmployeeIds = new Set(
      attendanceRecords.map((att) => att.employeeId._id.toString())
    );
    const assignedEmployeeIds = new Set(
      assignedEmployees.map((emp) => emp._id.toString())
    );

    // Identify present employees
    const presentEmployees = attendanceRecords.map((att) => ({
      _id: att.employeeId._id,
      firstName: att.employeeId.firstName,
      lastName: att.employeeId.lastName,
      employeeId: att.employeeId.employeeId,
      email: att.employeeId.email,
      signInTime: att.signInTime,
      signOutTime: att.signOutTime,
      hoursWorked: att.hoursWorked,
      status: att.status,
    }));

    // Identify missing employees (assigned but not present)
    const missingEmployees = assignedEmployees
      .filter((emp) => !presentEmployeeIds.has(emp._id.toString()))
      .map((emp) => ({
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeId: emp.employeeId,
        email: emp.email,
      }));

    // Identify unexpected employees (present but not assigned to site)
    const unexpectedEmployees = attendanceRecords
      .filter((att) => !assignedEmployeeIds.has(att.employeeId._id.toString()))
      .map((att) => ({
        _id: att.employeeId._id,
        firstName: att.employeeId.firstName,
        lastName: att.employeeId.lastName,
        employeeId: att.employeeId.employeeId,
        email: att.employeeId.email,
        signInTime: att.signInTime,
      }));

    // Calculate attendance percentage
    const attendancePercentage =
      plannedHeadcount > 0 ? Math.round((actualHeadcount / plannedHeadcount) * 100) : 0;

    // Determine status
    let status = 'good';
    if (attendancePercentage < 80) {
      status = 'critical';
    } else if (attendancePercentage < 95) {
      status = 'warning';
    }

    // Calculate difference
    const difference = actualHeadcount - plannedHeadcount;

    return NextResponse.json({
      success: true,
      data: {
        site: {
          _id: site._id,
          name: site.name,
          siteCode: site.siteCode,
        },
        date: targetDate,
        plannedHeadcount,
        actualHeadcount,
        difference,
        attendancePercentage,
        status,
        presentEmployees,
        missingEmployees,
        unexpectedEmployees,
        hasDailyLog: !!dailyLog,
        dailyLogId: dailyLog?._id,
      },
    });
  } catch (error) {
    console.error('Error in attendance verification:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while verifying attendance',
        },
      },
      { status: 500 }
    );
  }
}

