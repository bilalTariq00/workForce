import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { DailyLog } from '@/lib/models/DailyLog';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import SiteManagerLayout from '@/components/layouts/SiteManagerLayout';
import DailyLogView from '@/components/site-manager/DailyLogView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, CheckCircle, Lock, Send } from 'lucide-react';
import Link from 'next/link';

/**
 * Site Manager Daily Logs List Page
 * 
 * Purpose: Site Managers can view all their daily logs (past and present)
 * 
 * Access: Only Site Managers
 */
export default async function DailyLogsPage() {
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

  // Fetch all daily logs for this site manager, sorted by date (most recent first)
  const logs = await DailyLog.find({
    siteId: siteManager.siteId,
    siteManagerId: session.user.id,
  })
    .populate('siteId', 'name siteCode address')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  // Get today's log status
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayLog = logs.find(log => {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    return logDate.getTime() === today.getTime();
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-yellow-600" />;
      case 'locked':
        return <Lock className="h-4 w-4 text-orange-600" />;
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FileText className="h-3 w-3" />
            Draft
          </span>
        );
      case 'locked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Lock className="h-3 w-3" />
            Locked
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="h-3 w-3" />
            Sent
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <SiteManagerLayout siteName={site.name}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Daily Logs</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all your daily site logs
            </p>
          </div>
          <Link href="/site-manager/dashboard">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              Today's Log
            </Button>
          </Link>
        </div>

        {/* Today's Log Quick Access */}
        {todayLog && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Today's Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(todayLog.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="mt-2">{getStatusBadge(todayLog.status)}</div>
                </div>
                <Link href="/site-manager/dashboard">
                  <Button variant="outline">
                    {todayLog.status === 'draft' ? 'Continue Editing' : 'View Log'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Logs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Daily Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No daily logs found</p>
                <Link href="/site-manager/dashboard">
                  <Button>Create Your First Log</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const logDate = new Date(log.date);
                  const isToday = logDate.toDateString() === today.toDateString();
                  
                  return (
                    <div
                      key={log._id.toString()}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        isToday
                          ? 'border-primary/20 bg-primary/5'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              {logDate.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(log.status)}
                            {log.headcount !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                Headcount: {log.headcount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isToday ? (
                        <Link href="/site-manager/dashboard">
                          <Button variant="outline" size="sm">
                            {log.status === 'draft' ? 'Edit' : 'View'}
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/site-manager/daily-logs/${log._id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteManagerLayout>
  );
}

