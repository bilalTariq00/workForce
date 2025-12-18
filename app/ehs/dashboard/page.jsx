import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Incident } from '@/lib/models/Incident';
import { Inspection } from '@/lib/models/Inspection';
import { TrainingRegister } from '@/lib/models/TrainingRegister';
// Import referenced models to ensure they're registered with Mongoose
import { Site } from '@/lib/models/Site';
import { Employee } from '@/lib/models/Employee';
import EHSLayout from '@/components/layouts/EHSLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, ClipboardCheck, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';

export const dynamic = 'force-dynamic';

/**
 * EHS Dashboard
 * 
 * Purpose: Overview of EHS metrics and quick access to key features
 * 
 * Access: EHS Officers, HR, Admin
 */
export default async function EHSDashboard() {
  try {
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

    // Get user with role template for permission checks
    const employee = await Employee.findById(session.user.id)
      .populate('roleTemplateId', 'name permissions')
      .lean();
    
    const user = {
      role: session.user.role,
      roleTemplateId: employee?.roleTemplateId || null,
      purchasedModules: session.user.purchasedModules || [],
    };

    // Ensure models are registered (imports ensure this, but explicit check helps)
    if (!Site || !Employee || !Incident || !Inspection || !TrainingRegister) {
      console.error('[EHS DASHBOARD] Models not properly imported');
      throw new Error('Database models not available');
    }

  // Get incident statistics with error handling
  let totalIncidents = 0;
  let criticalIncidents = 0;
  let openIncidents = 0;
  let resolvedIncidents = 0;
  
  try {
    totalIncidents = await Incident.countDocuments();
    criticalIncidents = await Incident.countDocuments({ severity: 'critical' });
    openIncidents = await Incident.countDocuments({ status: { $in: ['reported', 'under_investigation'] } });
    resolvedIncidents = await Incident.countDocuments({ status: 'resolved' });
  } catch (error) {
    console.error('[EHS DASHBOARD] Error fetching incident stats:', error);
  }

  // Get inspection statistics with error handling
  let totalInspections = 0;
  let openIssuesCount = 0;
  let completedInspections = 0;
  
  try {
    totalInspections = await Inspection.countDocuments();
    
    // Try to get open issues count - check both checklistItems with 'fail' status and issues array
    try {
      // Count checklist items with 'fail' status
      const failedChecklistItems = await Inspection.aggregate([
        { $unwind: { path: '$checklistItems', preserveNullAndEmptyArrays: true } },
        { $match: { 'checklistItems.status': 'fail' } },
        { $count: 'count' },
      ]);
      
      // Count unresolved issues in issues array
      const unresolvedIssues = await Inspection.aggregate([
        { $unwind: { path: '$issues', preserveNullAndEmptyArrays: true } },
        { $match: { 
          'issues.status': { $nin: ['resolved', 'closed'] },
          'issues.status': { $exists: true },
        } },
        { $count: 'count' },
      ]);
      
      const failedCount = failedChecklistItems[0]?.count || 0;
      const unresolvedCount = unresolvedIssues[0]?.count || 0;
      openIssuesCount = failedCount + unresolvedCount;
    } catch (aggError) {
      console.error('[EHS DASHBOARD] Error aggregating inspection issues:', aggError);
      // Fallback: count inspections with any issues
      try {
        const inspectionsWithIssues = await Inspection.find({
          $or: [
            { 'checklistItems.status': 'fail' },
            { 'issues.status': { $ne: 'resolved' } },
          ],
        }).countDocuments();
        openIssuesCount = inspectionsWithIssues || 0;
      } catch (fallbackError) {
        console.error('[EHS DASHBOARD] Fallback query also failed:', fallbackError);
        openIssuesCount = 0;
      }
    }
    
    completedInspections = await Inspection.countDocuments({ status: 'completed' });
  } catch (error) {
    console.error('[EHS DASHBOARD] Error fetching inspection stats:', error);
  }

  // Get training statistics with error handling
  let totalTraining = 0;
  let overdueTraining = 0;
  let dueSoonTraining = 0;
  
  try {
    totalTraining = await TrainingRegister.countDocuments();
    overdueTraining = await TrainingRegister.countDocuments({
      status: 'overdue',
    });
    
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 30);
    
    dueSoonTraining = await TrainingRegister.countDocuments({
      dueDate: {
        $gte: new Date(),
        $lte: dueSoonDate,
      },
      status: { $in: ['not_started', 'in_progress'] },
    });
  } catch (error) {
    console.error('[EHS DASHBOARD] Error fetching training stats:', error);
  }

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
          {/* Incidents Card - Only show if user has certifications:view (EHS officers have this) */}
          {canViewSection(user, 'certifications', 'view') && (
            <StatsCard
              title="Incidents"
              description="Safety incidents & near-misses"
              icon="AlertTriangle"
              iconColor="text-red-500"
              requiredPermission="certifications:view"
            >
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
            </StatsCard>
          )}

          {/* Inspections Card - Only show if user has certifications:view */}
          {canViewSection(user, 'certifications', 'view') && (
            <StatsCard
              title="Inspections"
              description="Site inspections & issues"
              icon="ClipboardCheck"
              iconColor="text-blue-500"
              requiredPermission="certifications:view"
            >
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
            </StatsCard>
          )}

          {/* Training Card - Only show if user has certifications:view */}
          {canViewSection(user, 'certifications', 'view') && (
            <StatsCard
              title="Training"
              description="Training register & compliance"
              icon="GraduationCap"
              iconColor="text-purple-500"
              requiredPermission="certifications:view"
            >
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
            </StatsCard>
          )}
        </div>

        {/* Quick Actions */}
        {canViewSection(user, 'certifications', 'view') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <QuickActionCard
              title="Review Incidents"
              description="Review and investigate safety incidents"
              href="/ehs/incidents"
              icon="AlertTriangle"
              requiredPermission="certifications:view"
            />
            <QuickActionCard
              title="New Inspection"
              description="Create a new site inspection"
              href="/ehs/inspections"
              icon="ClipboardCheck"
              requiredPermission="certifications:view"
            />
            <QuickActionCard
              title="Assign Training"
              description="Assign training to employees"
              href="/ehs/training"
              icon="GraduationCap"
              requiredPermission="certifications:view"
            />

            {/* Alerts Card */}
            {canViewSection(user, 'certifications', 'view') && (criticalIncidents > 0 || overdueTraining > 0 || openIssuesCount > 0) && (
              <Card className="border-orange-200 dark:border-orange-800 col-span-1 sm:col-span-2 lg:col-span-3">
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
        )}
      </div>
    </EHSLayout>
  );
  } catch (error) {
    console.error('[EHS DASHBOARD] Fatal error:', error);
    // Return error page instead of crashing
    return (
      <EHSLayout>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Error Loading Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              An error occurred while loading the dashboard. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && `\n${error.stack}`}
              </pre>
            )}
          </div>
        </div>
      </EHSLayout>
    );
  }
}

