import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Users, Calendar, TrendingUp } from 'lucide-react';

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get this week's date range
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Get this month's date range
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Fetch attendance stats
  const todayAttendance = await Attendance.countDocuments({
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  const weekAttendance = await Attendance.countDocuments({
    date: {
      $gte: weekStart,
      $lt: weekEnd,
    },
  });

  const monthAttendance = await Attendance.countDocuments({
    date: {
      $gte: monthStart,
      $lt: monthEnd,
    },
  });

  const totalEmployees = await Employee.countDocuments({ status: 'active' });
  const presentToday = todayAttendance;
  const absentToday = totalEmployees - presentToday;

  // Get recent attendance records
  const recentAttendance = await Attendance.find()
    .populate('employeeId', 'firstName lastName employeeId')
    .populate('siteId', 'name siteCode')
    .sort({ signInTime: -1 })
    .limit(10)
    .lean();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View attendance reports and analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Present Today
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{presentToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {totalEmployees} employees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Absent Today
              </CardTitle>
              <Calendar className="h-5 w-5 text-amber-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{absentToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalEmployees > 0 ? Math.round((absentToday / totalEmployees) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{weekAttendance}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Attendance records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <FileText className="h-5 w-5 text-blue-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{monthAttendance}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Attendance records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
            <CardDescription>
              Latest attendance records from all employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sign In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAttendance.map((attendance) => (
                      <tr key={attendance._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {attendance.employeeId?.firstName} {attendance.employeeId?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {attendance.employeeId?.employeeId}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {attendance.siteId?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(attendance.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(attendance.signInTime).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {attendance.status || 'present'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}







