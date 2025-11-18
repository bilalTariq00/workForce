import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';
import LabourLayout from '@/components/layouts/LabourLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose } from '@/lib/utils/serialize';

export default async function LabourDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only labour workers can access
  if (session.user.role !== 'labour') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get employee details
  const employee = await Employee.findById(session.user.id)
    .populate('siteId', 'name siteCode address')
    .lean();

  if (!employee) {
    redirect('/login');
  }

  // Get today's attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await Attendance.findOne({
    employeeId: session.user.id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate('siteId', 'name siteCode')
    .lean();

  // Get recent attendance (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentAttendance = await Attendance.find({
    employeeId: session.user.id,
    date: {
      $gte: sevenDaysAgo,
      $lt: tomorrow,
    },
  })
    .populate('siteId', 'name siteCode')
    .sort({ date: -1 })
    .limit(7)
    .lean();

  // Serialize all Mongoose objects
  const serializedEmployee = serializeMongoose(employee);
  const serializedAttendance = attendance ? serializeMongoose(attendance) : null;
  const serializedRecentAttendance = recentAttendance.map(a => serializeMongoose(a));

  // Extract site info for easier access (handle both populated and non-populated cases)
  const siteIdData = serializedEmployee.siteId;
  const siteName = (siteIdData && typeof siteIdData === 'object' && siteIdData.name) ? siteIdData.name : null;
  const siteCode = (siteIdData && typeof siteIdData === 'object' && siteIdData.siteCode) ? siteIdData.siteCode : null;
  const siteAddress = (siteIdData && typeof siteIdData === 'object' && siteIdData.address) ? siteIdData.address : null;

  return (
    <LabourLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome, {serializedEmployee?.firstName || 'User'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Employee ID: {serializedEmployee?.employeeId || 'N/A'} | {siteName ? `Site: ${siteName}` : 'No site assigned'}
          </p>
        </div>

        {/* Today's Attendance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
            <CardDescription>Your attendance status for today</CardDescription>
          </CardHeader>
          <CardContent>
            {serializedAttendance ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Attendance Marked</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Site</p>
                    <p className="font-medium">
                      {(serializedAttendance.siteId && typeof serializedAttendance.siteId === 'object' ? serializedAttendance.siteId.name : null) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sign In Time</p>
                    <p className="font-medium">
                      {serializedAttendance.signInTime ? new Date(serializedAttendance.signInTime).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  {serializedAttendance.signOutTime && (
                    <div>
                      <p className="text-sm text-muted-foreground">Sign Out Time</p>
                      <p className="font-medium">
                        {new Date(serializedAttendance.signOutTime).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{serializedAttendance.status}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">No attendance marked for today</p>
                <Link href="/attendance/scan">
                  <Button>Mark Attendance</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Request
              </CardTitle>
              <CardDescription>Request time off or leave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Annual Leave Balance: <span className="font-semibold">{serializedEmployee?.annualLeaveBalance ?? 0} days</span>
                </p>
                <Link href="/attendance/leave-request">
                  <Button className="w-full">Request Leave</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>Your assigned site details</CardDescription>
            </CardHeader>
            <CardContent>
              {siteName ? (
                <div className="space-y-2">
                  <p className="font-medium">{siteName}</p>
                  {siteAddress && (
                    <p className="text-sm text-muted-foreground">
                      {siteAddress.street}, {siteAddress.city}
                    </p>
                  )}
                  {siteCode && (
                    <p className="text-sm text-muted-foreground">
                      Code: {siteCode}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No site assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance */}
        {serializedRecentAttendance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Attendance
              </CardTitle>
              <CardDescription>Your attendance for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {serializedRecentAttendance.map((att) => (
                  <div
                    key={att._id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {att.date ? new Date(att.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(att.siteId && typeof att.siteId === 'object' ? att.siteId.name : null) || 'N/A'} • {att.signInTime ? new Date(att.signInTime).toLocaleTimeString() : 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          att.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </LabourLayout>
  );
}

