import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import DailyLogForm from '@/components/site-manager/DailyLogForm';
import DailyLogView from '@/components/site-manager/DailyLogView';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { serializeMongoose } from '@/lib/utils/serialize';

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
 * Access: Only Site Managers
 */
export default async function SiteManagerDashboard() {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login');
  }

  // Only Site Managers can access this page
  if (session.user.role !== 'site_manager') {
    redirect('/dashboard');
  }

  await connectDB();

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

  return (
    <SiteManagerLayout siteName={site.name}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Daily Site Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasLog
              ? isDraft
                ? 'Complete your daily log for today'
                : isLocked
                ? 'Your log is locked and ready to send'
                : 'Your log has been sent to Contracts Manager'
              : 'Create your daily log for today'}
          </p>
        </div>

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
    </SiteManagerLayout>
  );
}

