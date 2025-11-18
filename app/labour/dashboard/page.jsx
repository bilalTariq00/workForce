import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';
import LabourLayout from '@/components/layouts/LabourLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, FileText, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose } from '@/lib/utils/serialize';

export const dynamic = 'force-dynamic';

export default async function LabourDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.error('[LABOUR DASHBOARD] No session found');
    redirect('/login');
  }

  // Only labour workers can access
  if (session.user.role !== 'labour') {
    console.log('[LABOUR DASHBOARD] Wrong role:', session.user.role, 'redirecting to /dashboard');
    redirect('/dashboard');
  }

  console.log('[LABOUR DASHBOARD] Session found, user ID:', session.user?.id, 'Role:', session.user?.role, 'Email:', session.user?.email);

  let dbConnected = false;
  try {
    await connectDB();
    dbConnected = true;
    console.log('[LABOUR DASHBOARD] Database connected');
  } catch (error) {
    console.error('[LABOUR DASHBOARD] Database connection error:', error);
    // Don't redirect on DB error, show error message instead
  }

  // Get employee details
  let employee;
  if (dbConnected) {
    try {
      console.log('[LABOUR DASHBOARD] Fetching employee with ID:', session.user.id);
      employee = await Employee.findById(session.user.id)
        .populate('siteId', 'name siteCode address')
        .lean();
      
      if (employee) {
        console.log('[LABOUR DASHBOARD] Employee found:', employee.email, employee.role);
      } else {
        console.error('[LABOUR DASHBOARD] Employee not found for ID:', session.user.id);
      }
    } catch (error) {
      console.error('[LABOUR DASHBOARD] Error fetching employee:', error);
      // Don't redirect on error, show error message instead
    }
  }

  // If employee not found, show error instead of redirecting
  if (!employee) {
    return (
      <LabourLayout>
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">
              Employee Record Not Found
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Your account was not found in the system. This may happen if:
            </p>
            <ul className="list-disc list-inside text-red-700 dark:text-red-300 space-y-1 mb-4">
              <li>Your account was recently created and needs to be activated</li>
              <li>Your account was deactivated</li>
              <li>There was an issue with the database connection</li>
            </ul>
            <p className="text-sm text-red-600 dark:text-red-400">
              Please contact HR or try logging out and logging back in.
            </p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-2">
              Session User ID: {session.user.id || 'N/A'}
            </p>
          </div>
        </div>
      </LabourLayout>
    );
  }

  // Get today's attendance
  let attendance = null;
  let recentAttendance = [];
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    attendance = await Attendance.findOne({
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

    recentAttendance = await Attendance.find({
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
  } catch (error) {
    console.error('Error fetching attendance:', error);
    // Continue with null/empty arrays
  }

  // Serialize all Mongoose objects using JSON.parse/stringify (safer for Next.js)
  // .lean() already returns plain objects, but we need to ensure they're fully serializable
  let serializedEmployee, serializedAttendance, serializedRecentAttendance;
  try {
    // Use JSON serialization which is safer and handles all edge cases
    serializedEmployee = employee ? JSON.parse(JSON.stringify(employee)) : null;
    serializedAttendance = attendance ? JSON.parse(JSON.stringify(attendance)) : null;
    serializedRecentAttendance = recentAttendance ? JSON.parse(JSON.stringify(recentAttendance)) : [];
  } catch (error) {
    console.error('Error serializing data:', error);
    // Fallback: use serializeMongoose or plain objects
    try {
      serializedEmployee = employee ? serializeMongoose(employee) : null;
      serializedAttendance = attendance ? serializeMongoose(attendance) : null;
      serializedRecentAttendance = recentAttendance ? recentAttendance.map(a => serializeMongoose(a)) : [];
    } catch (err) {
      console.error('Fallback serialization also failed:', err);
      // Last resort: use as-is (should work with .lean())
      serializedEmployee = employee || null;
      serializedAttendance = attendance || null;
      serializedRecentAttendance = recentAttendance || [];
    }
  }

  // Extract site info for easier access (handle both populated and non-populated cases)
  const siteIdData = serializedEmployee?.siteId || null;
  const siteName = (siteIdData && typeof siteIdData === 'object' && siteIdData !== null && siteIdData.name) ? String(siteIdData.name) : null;
  const siteCode = (siteIdData && typeof siteIdData === 'object' && siteIdData !== null && siteIdData.siteCode) ? String(siteIdData.siteCode) : null;
  const siteAddress = (siteIdData && typeof siteIdData === 'object' && siteIdData !== null && siteIdData.address) ? siteIdData.address : null;
  
  // Safely extract address fields
  const addressStreet = (siteAddress && typeof siteAddress === 'object' && siteAddress !== null && siteAddress.street) ? String(siteAddress.street) : null;
  const addressCity = (siteAddress && typeof siteAddress === 'object' && siteAddress !== null && siteAddress.city) ? String(siteAddress.city) : null;

  return (
    <LabourLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Welcome, {serializedEmployee?.firstName || serializedEmployee?.name || 'User'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Employee ID: {String(serializedEmployee?.employeeId || 'N/A')} | {siteName ? `Site: ${siteName}` : 'No site assigned'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  Annual Leave Balance: <span className="font-semibold">{Number(serializedEmployee?.annualLeaveBalance) || 0} days</span>
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
                <Award className="h-5 w-5" />
                Certifications
              </CardTitle>
              <CardDescription>Upload and manage your certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  SafePass, CSCS, First Aid, etc.
                </p>
                <Link href="/attendance/certifications">
                  <Button className="w-full" variant="outline">Manage Certifications</Button>
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
                  {(addressStreet || addressCity) && (
                    <p className="text-sm text-muted-foreground">
                      {[addressStreet, addressCity].filter(Boolean).join(', ')}
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

