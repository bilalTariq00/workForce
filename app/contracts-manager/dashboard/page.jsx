import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { Site } from '@/lib/models/Site';
import { Alert } from '@/lib/models/Alert';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import MultiSiteDashboardClient from '@/components/contracts-manager/MultiSiteDashboardClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, AlertTriangle, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';
import { canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';

export const dynamic = 'force-dynamic';

/**
 * Contracts Manager Multi-Site Dashboard
 * 
 * Purpose: View aggregated data for all sites
 * 
 * Access: Contracts Manager, Admin only
 */
export default async function ContractsManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Contracts Managers and Admin can access
  if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
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

  // Fetch stats based on permissions
  let siteStats = null;
  let alertStats = null;

  // Site stats (if user has sites:view permission)
  if (canViewSection(user, 'sites', 'view')) {
    const totalSites = await Site.countDocuments({ status: 'active' });
    siteStats = {
      total: totalSites,
    };
  }

  // Alert stats (if user has process_management:view permission)
  if (canViewSection(user, 'process_management', 'view')) {
    const activeAlerts = await Alert.countDocuments({ status: 'active' });
    const criticalAlerts = await Alert.countDocuments({ 
      status: 'active',
      severity: 'critical',
    });
    alertStats = {
      active: activeAlerts,
      critical: criticalAlerts,
    };
  }

  return (
    <ContractsManagerLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Multi-Site Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {session.user.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sites Widget */}
          {canViewSection(user, 'sites', 'view') && siteStats && (
            <StatsCard
              title="Sites"
              description="Active construction sites"
              icon="Building2"
              iconColor="text-blue-500"
              requiredPermission="sites:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Sites</span>
                  <span className="text-lg font-semibold">{siteStats.total}</span>
                </div>
              </div>
            </StatsCard>
          )}

          {/* Alerts Widget */}
          {canViewSection(user, 'process_management', 'view') && alertStats && (
            <StatsCard
              title="Alerts"
              description="Exception alerts"
              icon="AlertTriangle"
              iconColor="text-red-500"
              requiredPermission="process_management:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-lg font-semibold text-orange-600">{alertStats.active}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Critical</span>
                  <span className="text-lg font-semibold text-red-600">{alertStats.critical}</span>
                </div>
                <Link href="/contracts-manager/alerts" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    View Alerts
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}
        </div>

        {/* Multi-Site Dashboard Client */}
        {canViewSection(user, 'sites', 'view') && (
          <MultiSiteDashboardClient />
        )}

        {/* Quick Actions */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {canViewSection(user, 'sites', 'view') && (
                <Link href="/contracts-manager/sites">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <Building2 className="h-4 w-4 mr-2" />
                    View All Sites
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'process_management', 'view') && (
                <Link href="/contracts-manager/alerts">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    View Alerts
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'process_management', 'approve') && (
                <Link href="/contracts-manager/variations">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <FileText className="h-4 w-4 mr-2" />
                    Approve Variations
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'process_management', 'manage') && (
                <Link href="/contracts-manager/resource-reallocation">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <Users className="h-4 w-4 mr-2" />
                    Resource Reallocation
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ContractsManagerLayout>
  );
}

