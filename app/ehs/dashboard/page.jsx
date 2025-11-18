import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { Inspection } from '@/lib/models/Inspection';
import { TrainingRegister } from '@/lib/models/TrainingRegister';
import EHSLayout from '@/components/layouts/EHSLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

/**
 * EHS Dashboard
 * 
 * Purpose: Overview of EHS metrics and quick access to key features
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function EHSDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only EHS, HR, and Admin can access
  if (
    session.user.role !== 'ehs_officer' &&
    session.user.role !== 'hr_officer' &&
    session.user.role !== 'admin'
  ) {
    redirect('/dashboard');
  }

  await connectDB();

  // Get incident statistics
  const totalIncidents = await Incident.countDocuments();
  const criticalIncidents = await Incident.countDocuments({ severity: 'critical' });
  const openIncidents = await Incident.countDocuments({ status: { $in: ['reported', 'investigating'] } });
  const resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });

  // Get inspection statistics
  const totalInspections = await Inspection.countDocuments();
  const openIssues = await Inspection.aggregate([
    { $unwind: '$checklistItems' },
    { $match: { 'checklistItems.status': 'issue' } },
    { $count: 'count' },
  ]);
  const openIssuesCount = openIssues[0]?.count || 0;
  const completedInspections = await Inspection.countDocuments({ status: 'completed' });

  // Get training statistics
  const totalTraining = await TrainingRegister.countDocuments();
  const overdueTraining = await TrainingRegister.countDocuments({
    status: 'overdue',
  });
  const dueSoonTraining = await TrainingRegister.countDocuments({
    dueDate: {
      $gte: new Date(),
      $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
    },
    status: { $in: ['not_started', 'in_progress'] },
  });

  return (
    <EHSLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            EHS Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Overview of safety incidents, inspections, and training
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Incidents Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                Incidents
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Safety incidents & near-misses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
                  <span className="text-sm sm:text-base font-semibold">{totalIncidents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Critical</span>
                  <span className="text-sm sm:text-base font-semibold text-red-600">{criticalIncidents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Open</span>
                  <span className="text-sm sm:text-base font-semibold text-orange-600">{openIncidents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Resolved</span>
                  <span className="text-sm sm:text-base font-semibold text-green-600">{resolvedIncidents}</span>
                </div>
                <Link href="/ehs/incidents" className="block mt-3 sm:mt-4">
                  <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                    View All Incidents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Inspections Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                Inspections
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Site inspections & issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
                  <span className="text-sm sm:text-base font-semibold">{totalInspections}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Open Issues</span>
                  <span className="text-sm sm:text-base font-semibold text-orange-600">{openIssuesCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm sm:text-base font-semibold text-green-600">{completedInspections}</span>
                </div>
                <Link href="/ehs/inspections" className="block mt-3 sm:mt-4">
                  <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                    View All Inspections
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Training Card */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                Training
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Training register & compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
                  <span className="text-sm sm:text-base font-semibold">{totalTraining}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Overdue</span>
                  <span className="text-sm sm:text-base font-semibold text-red-600">{overdueTraining}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Due Soon</span>
                  <span className="text-sm sm:text-base font-semibold text-orange-600">{dueSoonTraining}</span>
                </div>
                <Link href="/ehs/training" className="block mt-3 sm:mt-4">
                  <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                    View Training Register
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <Link href="/ehs/incidents">
                <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Review Incidents
                </Button>
              </Link>
              <Link href="/ehs/inspections">
                <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  New Inspection
                </Button>
              </Link>
              <Link href="/ehs/training">
                <Button className="w-full py-2.5 sm:py-2 text-sm sm:text-base touch-manipulation" variant="outline">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Assign Training
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Alerts Card */}
          {(criticalIncidents > 0 || overdueTraining > 0 || openIssuesCount > 0) && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-orange-600">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  Requires Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs sm:text-sm">
                  {criticalIncidents > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{criticalIncidents} critical incident(s)</span>
                    </div>
                  )}
                  {overdueTraining > 0 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{overdueTraining} overdue training(s)</span>
                    </div>
                  )}
                  {openIssuesCount > 0 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{openIssuesCount} open inspection issue(s)</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </EHSLayout>
  );
}

