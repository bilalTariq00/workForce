import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { Attendance } from '@/lib/models/Attendance';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { Variation } from '@/lib/models/Variation';
import { DailyLog } from '@/lib/models/DailyLog';
import { Alert } from '@/lib/models/Alert';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, DollarSign, TrendingUp, AlertTriangle, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

/**
 * Contracts Manager Reports Page
 * 
 * Purpose: View reports and summaries for all sites
 * 
 * Access: Contracts Manager, Admin only
 */
export default async function ContractsManagerReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Contracts Managers and Admin can access
  if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get date ranges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  // Get statistics
  const totalSites = await Site.countDocuments({ status: 'active' });
  
  // Attendance statistics
  const todayAttendance = await Attendance.countDocuments({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const thisWeekAttendance = await Attendance.countDocuments({
    date: { $gte: thisWeekStart },
  });

  // Payroll statistics
  const thisMonthPayroll = await PayrollRun.aggregate([
    {
      $match: {
        periodStart: { $gte: thisMonthStart },
      },
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$totalGross' },
        totalNet: { $sum: '$totalNet' },
        count: { $sum: 1 },
      },
    },
  ]);

  const lastMonthPayroll = await PayrollRun.aggregate([
    {
      $match: {
        periodStart: { $gte: lastMonthStart, $lt: lastMonthStart },
      },
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$totalGross' },
        totalNet: { $sum: '$totalNet' },
        count: { $sum: 1 },
      },
    },
  ]);

  const thisMonthPayrollData = thisMonthPayroll[0] || { totalGross: 0, totalNet: 0, count: 0 };
  const lastMonthPayrollData = lastMonthPayroll[0] || { totalGross: 0, totalNet: 0, count: 0 };

  // Variation statistics
  const pendingVariations = await Variation.countDocuments({ status: 'pending' });
  const approvedVariations = await Variation.countDocuments({ status: 'approved' });
  const totalVariationCost = await Variation.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$cost' } } },
  ]);
  const totalVariationCostValue = totalVariationCost[0]?.total || 0;

  // Alert statistics
  const activeAlerts = await Alert.countDocuments({ status: 'active' });
  const criticalAlerts = await Alert.countDocuments({ status: 'active', severity: 'critical' });

  // Daily log statistics
  const todayLogs = await DailyLog.countDocuments({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const missingLogs = totalSites - todayLogs;

  return (
    <ContractsManagerLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Overview of key metrics and statistics across all sites
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Sites Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Active Sites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{totalSites}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Total active sites</p>
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{todayAttendance}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Today</p>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm sm:text-base font-semibold">{thisWeekAttendance}</div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                Payroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl sm:text-2xl font-bold">
                    £{thisMonthPayrollData.totalGross?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Month (Gross)</p>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm sm:text-base font-semibold">
                    {thisMonthPayrollData.count || 0} runs
                  </div>
                  <p className="text-xs text-muted-foreground">Payroll runs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variations Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                Variations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Pending</span>
                  <Badge variant="outline" className="text-orange-600">
                    {pendingVariations}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Approved</span>
                  <Badge variant="outline" className="text-green-600">
                    {approvedVariations}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="text-sm sm:text-base font-semibold">
                    £{totalVariationCostValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total approved cost</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Active</span>
                  <Badge variant="outline" className="text-orange-600">
                    {activeAlerts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Critical</span>
                  <Badge variant="destructive">
                    {criticalAlerts}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Logs Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Daily Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <div className="text-xl sm:text-2xl font-bold">{todayLogs}</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Submitted today</p>
                </div>
                {missingLogs > 0 && (
                  <div className="pt-2 border-t">
                    <div className="text-sm sm:text-base font-semibold text-orange-600">
                      {missingLogs} missing
                    </div>
                    <p className="text-xs text-muted-foreground">Sites without logs</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/contracts-manager/dashboard">
                <Button variant="outline" className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Dashboard
                </Button>
              </Link>
              <Link href="/contracts-manager/alerts">
                <Button variant="outline" className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Alerts
                </Button>
              </Link>
              <Link href="/contracts-manager/variations">
                <Button variant="outline" className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation">
                  <FileText className="h-4 w-4 mr-2" />
                  View Variations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </ContractsManagerLayout>
  );
}

