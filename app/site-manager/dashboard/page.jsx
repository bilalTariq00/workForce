import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { Attendance } from '@/lib/models/Attendance';
import DailyLogForm from '@/components/site-manager/DailyLogForm';
import DailyLogView from '@/components/site-manager/DailyLogView';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FileText, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose } from '@/lib/utils/serialize';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';
import { canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';

export const dynamic = 'force-dynamic';

/**
 * Site Manager Dashboard Page
 * 
 * Purpose: Site Managers use this page to create and manage daily site logs
 * 
 * Flow:
 * 1. Check if daily log exists for today
 * 2. If draft: Show edit form
 * 3. If locked/sent: Show read-only view
 * 4. If none: Show create form
 * 
 * Access: Only Site Managers with Process Management module
 */
export default async function SiteManagerDashboard() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Check module access (Process Management module required)
  const { hasAccess } = await checkModuleAccessServer('process_management');
  if (!hasAccess) {
    redirect('/modules?required=process_management');
  }

  // Only Site Managers can access this page
  if (session.user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  await connectDB();

  // Get user with role template for permission checks
  const employee = await Employee.findById(session.user.id)
    .populate('roleTemplateId', 'name permissions')
    .lean();
  
  const user = {
    role: session.user.role,
    roleTemplateId: employee?.roleTemplateId || null,
    purchasedModules: session.user.purchasedModules || [],
  };

  // Get the Site Manager's assigned site
  // Site Managers have a siteId field in their employee record
  const siteManager = await Employee.findById(session.user.id).lean();
  
  if (!siteManager || !siteManager.siteId) {
    return (
      <SiteManagerLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                You are not assigned to any site. Please contact HR to assign you to a site.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SiteManagerLayout>
    );
  }

  // Get site details
  const site = await Site.findById(siteManager.siteId).lean();

  if (!site) {
    return (
      <SiteManagerLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Your assigned site was not found. Please contact HR.
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SiteManagerLayout>
    );
  }

  // Check if daily log exists for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLog = await DailyLog.findOne({
    siteId: siteManager.siteId,
    siteManagerId: session.user.id,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate('siteId', 'name siteCode address')
    .lean();

  // Determine what to show based on log status
  const hasLog = !!todayLog;
  const isDraft = todayLog?.status === 'draft';
  const isLocked = todayLog?.status === 'locked';
  const isSent = todayLog?.status === 'sent';

  // Fetch additional stats based on permissions
  let dailyLogStats = null;
  let attendanceStats = null;

  // Daily Log stats (if user has process_management permission)
  if (canViewSection(user, 'process_management', ['view', 'create'])) {
    const totalLogs = await DailyLog.countDocuments({
      siteId: siteManager.siteId,
      siteManagerId: session.user.id,
    });
    const draftLogs = await DailyLog.countDocuments({
      siteId: siteManager.siteId,
      siteManagerId: session.user.id,
      status: 'draft',
    });
    const sentLogs = await DailyLog.countDocuments({
      siteId: siteManager.siteId,
      siteManagerId: session.user.id,
      status: 'sent',
    });
    dailyLogStats = {
      total: totalLogs,
      draft: draftLogs,
      sent: sentLogs,
    };
  }

  // Attendance stats (if user has attendance:view permission)
  if (canViewSection(user, 'attendance', 'view')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.countDocuments({
      siteId: siteManager.siteId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });
    attendanceStats = {
      today: todayAttendance,
    };
  }

  return (
    <SiteManagerLayout siteName={site.name}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {session.user.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Daily Logs Widget */}
          {canViewSection(user, 'process_management', ['view', 'create']) && dailyLogStats && (
            <StatsCard
              title="Daily Logs"
              description="Site daily logs"
              icon="FileText"
              iconColor="text-blue-500"
              requiredPermission="process_management:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-lg font-semibold">{dailyLogStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Draft</span>
                  <span className="text-lg font-semibold text-orange-600">{dailyLogStats.draft}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sent</span>
                  <span className="text-lg font-semibold text-green-600">{dailyLogStats.sent}</span>
                </div>
              </div>
            </StatsCard>
          )}

          {/* Attendance Widget */}
          {canViewSection(user, 'attendance', 'view') && attendanceStats && (
            <StatsCard
              title="Attendance"
              description="Today's attendance"
              icon="Users"
              iconColor="text-green-500"
              requiredPermission="attendance:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Today</span>
                  <span className="text-lg font-semibold">{attendanceStats.today}</span>
                </div>
                <Link href="/site-manager/attendance-verification" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    Verify Attendance
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}
        </div>

        {/* Daily Log Section */}
        {canViewSection(user, 'process_management', ['view', 'create']) && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Daily Site Log</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasLog
                ? isDraft
                  ? 'Complete your daily log for today'
                  : isLocked
                  ? 'Your log is locked and ready to send'
                  : 'Your log has been sent to Contracts Manager'
                : 'Create your daily log for today'}
            </p>

            {/* Site Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Site Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Site Name</p>
                    <p className="text-sm font-semibold">{site.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Site Code</p>
                    <p className="text-sm font-semibold">{site.siteCode}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">
                      {site.address.street}, {site.address.city}, {site.address.postcode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="text-sm font-semibold">{today.toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Log Form or View */}
            {hasLog ? (
              // Show form if draft, view if locked/sent
              isDraft ? (
                <DailyLogForm
                  initialData={todayLog ? serializeMongoose(todayLog) : null}
                  siteId={siteManager.siteId?.toString()}
                  siteName={site.name}
                />
              ) : (
                <DailyLogView dailyLog={todayLog ? serializeMongoose(todayLog) : null} />
              )
            ) : (
              // Show create form if no log exists
              <DailyLogForm siteId={siteManager.siteId?.toString()} siteName={site.name} />
            )}
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {canViewSection(user, 'process_management', ['view', 'create']) && (
                <Link href="/site-manager/daily-logs">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Logs
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'attendance', 'view') && (
                <Link href="/site-manager/attendance-verification">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <Users className="h-4 w-4 mr-2" />
                    Verify Attendance
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'process_management', 'create') && (
                <Link href="/site-manager/variations">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    Variations
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteManagerLayout>
  );
}

