import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import DailyLogView from '@/components/site-manager/DailyLogView';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Site Manager Daily Log Detail Page
 * 
 * Purpose: View a specific daily log (read-only for past logs)
 * 
 * Access: Only Site Managers (their own logs)
 */
export default async function DailyLogDetailPage({ params }) {
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

  // Get the log
  const log = await DailyLog.findOne({
    _id: params.id,
    siteId: siteManager.siteId,
    siteManagerId: session.user.id,
  })
    .populate('siteId', 'name siteCode address')
    .lean();

  if (!log) {
    return (
      <SiteManagerLayout siteName={site.name}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Daily log not found or you don't have access to it.
              </p>
              <Link href="/site-manager/daily-logs">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Daily Logs
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </SiteManagerLayout>
    );
  }

  // Check if this is today's log
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const logDate = new Date(log.date);
  logDate.setHours(0, 0, 0, 0);
  const isToday = logDate.getTime() === today.getTime();

  return (
    <SiteManagerLayout siteName={site.name}>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/site-manager/daily-logs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Daily Logs
          </Button>
        </Link>

        {/* If it's today's log and it's a draft, suggest going to dashboard to edit */}
        {isToday && log.status === 'draft' && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  This is today's log. You can edit it from the dashboard.
                </p>
                <Link href="/site-manager/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Log View */}
        <DailyLogView dailyLog={log} />
      </div>
    </SiteManagerLayout>
  );
}

