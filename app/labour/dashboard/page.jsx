import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { LeaveRequest } from '@/lib/models/LeaveRequest';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import LabourLayout from '@/components/layouts/LabourLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, CheckCircle2, FileText, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose } from '@/lib/utils/serialize';
import { canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';

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

  // Get user with role template for permission checks
  let user = null;
  if (dbConnected) {
    try {
      const employee = await Employee.findById(session.user.id)
        .populate('roleTemplateId', 'name permissions')
        .lean();
      
      user = {
        role: session.user.role,
        roleTemplateId: employee?.roleTemplateId || null,
        purchasedModules: session.user.purchasedModules || [],
      };
    } catch (error) {
      console.error('[LABOUR DASHBOARD] Error fetching user permissions:', error);
    }
  }

  // Get employee details
  let employee;
  if (dbConnected) {
    try {
      const sessionUserId = session.user.id;
      const sessionEmail = session.user?.email;
      
      console.log('[LABOUR DASHBOARD] Fetching employee with ID:', sessionUserId);
      console.log('[LABOUR DASHBOARD] Session email:', sessionEmail);
      
      // Use the same approach as the debug endpoint (which works)
      // Try findById first (Mongoose handles string to ObjectId conversion automatically)
      employee = await Employee.findById(sessionUserId)
        .populate('siteId', 'name siteCode address')
        .lean();
      
      // If not found by ID, try by email (fallback - same as debug endpoint)
      if (!employee && sessionEmail) {
        console.log('[LABOUR DASHBOARD] Employee not found by ID, trying email:', sessionEmail);
        employee = await Employee.findOne({ email: sessionEmail.toLowerCase() })
          .populate('siteId', 'name siteCode address')
          .lean();
      }
      
      if (employee) {
        console.log('[LABOUR DASHBOARD] Employee found:', employee.email, employee.role, 'Status:', employee.status);
        
        // Check if employee is active
        if (employee.status !== 'active') {
          console.warn('[LABOUR DASHBOARD] Employee found but status is:', employee.status);
          return (
            <LabourLayout>
              <div className="space-y-6">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                    Account Inactive
                  </h2>
                  <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                    Your account status is: <strong>{employee.status}</strong>
                  </p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Please contact HR to activate your account.
                  </p>
                </div>
              </div>
            </LabourLayout>
          );
        }
      } else {
        console.error('[LABOUR DASHBOARD] Employee not found for ID:', sessionUserId, 'or email:', sessionEmail);
      }
    } catch (error) {
      console.error('[LABOUR DASHBOARD] Error fetching employee:', error);
      console.error('[LABOUR DASHBOARD] Error stack:', error.stack);
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
            <div className="mt-4 space-y-2">
              <p className="text-xs text-red-500 dark:text-red-500">
                <strong>Session User ID:</strong> {session.user.id || 'N/A'}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500">
                <strong>Session Email:</strong> {session.user?.email || 'N/A'}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500">
                <strong>Session Role:</strong> {session.user?.role || 'N/A'}
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
                💡 <strong>Debug Tip:</strong> Visit <code className="bg-red-100 dark:bg-red-900 px-1 rounded">/api/v1/debug/employee</code> to check if your employee record exists in the database.
              </p>
            </div>
          </div>
        </div>
      </LabourLayout>
    );
  }

  // Get today's attendance (if user has attendance:view permission)
  let attendance = null;
  let recentAttendance = [];
  let leaveStats = null;
  let certificationStats = null;
  
  if (user && canViewSection(user, 'attendance', 'view')) {
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
  }

  // Get leave stats (if user has leave_requests:view permission)
  if (user && canViewSection(user, 'leave_requests', 'view')) {
    try {
      const pendingLeaves = await LeaveRequest.countDocuments({
        employeeId: session.user.id,
        status: 'pending',
      });
      const approvedLeaves = await LeaveRequest.countDocuments({
        employeeId: session.user.id,
        status: 'approved',
      });
      leaveStats = {
        pending: pendingLeaves,
        approved: approvedLeaves,
      };
    } catch (error) {
      console.error('Error fetching leave stats:', error);
    }
  }

  // Get certification stats (if user has certifications:view permission)
  if (user && canViewSection(user, 'certifications', 'view')) {
    try {
      const totalCertifications = await EmployeeCertificate.countDocuments({
        employeeId: session.user.id,
      });
      const expiringSoon = await EmployeeCertificate.countDocuments({
        employeeId: session.user.id,
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        status: 'approved',
      });
      certificationStats = {
        total: totalCertifications,
        expiringSoon: expiringSoon,
      };
    } catch (error) {
      console.error('Error fetching certification stats:', error);
    }
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
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Welcome, {serializedEmployee?.firstName || serializedEmployee?.name || 'User'}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">
            Employee ID: {String(serializedEmployee?.employeeId || 'N/A')} {siteName && <span className="hidden sm:inline">| Site: {siteName}</span>}
            {siteName && <span className="sm:hidden block mt-1">Site: {siteName}</span>}
            {!siteName && <span className="block sm:inline sm:ml-1 mt-1 sm:mt-0">| No site assigned</span>}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Leave Requests Widget */}
          {user && canViewSection(user, 'leave_requests', 'view') && leaveStats && (
            <StatsCard
              title="Leave Requests"
              description="Your leave requests"
              icon="Calendar"
              iconColor="text-blue-500"
              requiredPermission="leave_requests:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-lg font-semibold text-orange-600">{leaveStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-lg font-semibold text-green-600">{leaveStats.approved}</span>
                </div>
                <Link href="/attendance/leave-request" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    Request Leave
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}

          {/* Certifications Widget */}
          {user && canViewSection(user, 'certifications', 'view') && certificationStats && (
            <StatsCard
              title="Certifications"
              description="Your certifications"
              icon="Award"
              iconColor="text-amber-500"
              requiredPermission="certifications:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">{certificationStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expiring Soon</span>
                  <span className="text-lg font-semibold text-red-600">{certificationStats.expiringSoon}</span>
                </div>
                <Link href="/attendance/certifications" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    Manage Certifications
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}
        </div>

        {/* Today's Attendance Card - Only show if user has attendance:view permission */}
        {user && canViewSection(user, 'attendance', 'view') && (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your attendance status for today</CardDescription>
            </CardHeader>
            <CardContent>
            {serializedAttendance ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base">Attendance Marked</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Site</p>
                    <p className="font-medium text-sm sm:text-base break-words">
                      {(serializedAttendance.siteId && typeof serializedAttendance.siteId === 'object' ? serializedAttendance.siteId.name : null) || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Sign In Time</p>
                    <p className="font-medium text-sm sm:text-base">
                      {serializedAttendance.signInTime ? new Date(serializedAttendance.signInTime).toLocaleTimeString() : 'N/A'}
                    </p>
                  </div>
                  {serializedAttendance.signOutTime && (
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Sign Out Time</p>
                      <p className="font-medium text-sm sm:text-base">
                        {new Date(serializedAttendance.signOutTime).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize text-sm sm:text-base">{serializedAttendance.status}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 sm:py-6">
                <p className="text-sm sm:text-base text-muted-foreground mb-4">No attendance marked for today</p>
                <Link href="/attendance/scan">
                  <Button className="w-full sm:w-auto px-6 py-2.5 sm:py-2 text-sm sm:text-base">Mark Attendance</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {user && canViewSection(user, 'leave_requests', 'view') && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                  Leave Request
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Request time off or leave</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Annual Leave Balance: <span className="font-semibold">{Number(serializedEmployee?.annualLeaveBalance) || 0} days</span>
                  </p>
                  <Link href="/attendance/leave-request">
                    <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation">Request Leave</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {user && canViewSection(user, 'certifications', 'view') && (
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                  Certifications
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Upload and manage your certifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    SafePass, CSCS, First Aid, etc.
                  </p>
                  <Link href="/attendance/certifications">
                    <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">Manage Certifications</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                Site Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your assigned site details</CardDescription>
            </CardHeader>
            <CardContent>
              {siteName ? (
                <div className="space-y-2">
                  <p className="font-medium text-sm sm:text-base break-words">{siteName}</p>
                  {(addressStreet || addressCity) && (
                    <p className="text-xs sm:text-sm text-muted-foreground break-words">
                      {[addressStreet, addressCity].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {siteCode && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Code: {siteCode}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-muted-foreground">No site assigned</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance - Only show if user has attendance:view permission */}
        {user && canViewSection(user, 'attendance', 'view') && serializedRecentAttendance.length > 0 && (
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Recent Attendance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your attendance for the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {serializedRecentAttendance.map((att) => (
                  <div
                    key={att._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted rounded-lg gap-2 sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base">
                        {att.date ? new Date(att.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }) : 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        <span className="hidden sm:inline">{(att.siteId && typeof att.siteId === 'object' ? att.siteId.name : null) || 'N/A'} • </span>
                        {att.signInTime ? new Date(att.signInTime).toLocaleTimeString() : 'N/A'}
                        <span className="sm:hidden block">{(att.siteId && typeof att.siteId === 'object' ? att.siteId.name : null) || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded text-xs font-medium ${
                          att.status === 'present'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
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

