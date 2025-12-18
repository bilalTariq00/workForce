import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { EmployeeSite } from '@/lib/models/EmployeeSite';
import { Site } from '@/lib/models/Site';
import { Timesheet } from '@/lib/models/Timesheet';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardStats from '@/components/hr/DashboardStats';
import EmployeeList from '@/components/hr/EmployeeList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserPlus, Shield, Settings, FileText, DollarSign, MapPin, Award, Clock } from 'lucide-react';
import Link from 'next/link';
import { serializeMongooseArray } from '@/lib/utils/serialize';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';
import { canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';
import QuickActionCard from '@/components/dashboard/QuickActionCard';

export const dynamic = 'force-dynamic';

export default async function HRDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check module access (HRM module required)
  const { hasAccess } = await checkModuleAccessServer('hrm');
  if (!hasAccess) {
    redirect('/modules?required=hrm');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
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

  const employees = await Employee.find({ status: { $ne: 'terminated' } })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  // Get assigned sites for each employee
  const employeesWithSites = await Promise.all(
    employees.map(async (employee) => {
      const assignedSites = await EmployeeSite.getEmployeeSites(employee._id);
      return {
        ...employee,
        assignedSites: assignedSites || [],
      };
    })
  );

  // Fetch additional data based on permissions
  let timesheetStats = null;
  let payrollStats = null;
  let siteStats = null;
  let certificationStats = null;

  // Timesheet stats (if user has timesheets:view permission)
  if (canViewSection(user, 'timesheets', 'view')) {
    const pendingTimesheets = await Timesheet.countDocuments({ status: 'pending' });
    const approvedTimesheets = await Timesheet.countDocuments({ status: 'approved' });
    const thisWeekTimesheets = await Timesheet.countDocuments({
      weekStartDate: { $lte: new Date() },
      weekEndDate: { $gte: new Date() },
    });
    timesheetStats = {
      pending: pendingTimesheets,
      approved: approvedTimesheets,
      thisWeek: thisWeekTimesheets,
    };
  }

  // Payroll stats (if user has finance_payroll:view permission)
  if (canViewSection(user, 'finance_payroll', 'view')) {
    const recentPayrollRuns = await PayrollRun.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const totalPayrollRuns = await PayrollRun.countDocuments();
    payrollStats = {
      total: totalPayrollRuns,
      recent: recentPayrollRuns.length,
    };
  }

  // Site stats (if user has sites:view permission)
  if (canViewSection(user, 'sites', 'view')) {
    const totalSites = await Site.countDocuments({ status: 'active' });
    siteStats = {
      total: totalSites,
    };
  }

  // Certification stats (if user has certifications:view permission)
  if (canViewSection(user, 'certifications', 'view')) {
    const pendingCertifications = await EmployeeCertificate.countDocuments({ 
      status: 'pending' 
    });
    const expiringSoon = await EmployeeCertificate.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      status: 'approved',
    });
    certificationStats = {
      pending: pendingCertifications,
      expiringSoon: expiringSoon,
    };
  }

  const stats = {
    total: employees.length,
    labour: employees.filter((e) => e.role === 'labour').length,
    siteManagers: employees.filter((e) => e.role === 'site_manager').length,
    active: employees.filter((e) => e.status === 'active').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          <Link href="/hr/create-employee">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Create Employee</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} />

        {/* Module-Specific Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Timesheets Widget */}
          {canViewSection(user, 'timesheets', 'view') && timesheetStats && (
            <StatsCard
              title="Timesheets"
              description="Timesheet management"
              icon="Clock"
              iconColor="text-blue-500"
              requiredPermission="timesheets:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-lg font-semibold text-orange-600">{timesheetStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Approved</span>
                  <span className="text-lg font-semibold text-green-600">{timesheetStats.approved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">This Week</span>
                  <span className="text-lg font-semibold">{timesheetStats.thisWeek}</span>
                </div>
                <Link href="/hr/timesheets" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    View Timesheets
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}

          {/* Payroll Widget */}
          {canViewSection(user, 'finance_payroll', 'view') && payrollStats && (
            <StatsCard
              title="Payroll"
              description="Payroll runs and processing"
              icon="DollarSign"
              iconColor="text-green-500"
              requiredPermission="finance_payroll:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Runs</span>
                  <span className="text-lg font-semibold">{payrollStats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recent</span>
                  <span className="text-lg font-semibold">{payrollStats.recent}</span>
                </div>
                <Link href="/hr/payroll" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    View Payroll
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}

          {/* Sites Widget */}
          {canViewSection(user, 'sites', 'view') && siteStats && (
            <StatsCard
              title="Sites"
              description="Construction sites"
              icon="MapPin"
              iconColor="text-purple-500"
              requiredPermission="sites:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Sites</span>
                  <span className="text-lg font-semibold">{siteStats.total}</span>
                </div>
                <Link href="/hr/sites" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    Manage Sites
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}

          {/* Certifications Widget */}
          {canViewSection(user, 'certifications', 'view') && certificationStats && (
            <StatsCard
              title="Certifications"
              description="Employee certifications"
              icon="Award"
              iconColor="text-amber-500"
              requiredPermission="certifications:view"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="text-lg font-semibold text-orange-600">{certificationStats.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Expiring Soon</span>
                  <span className="text-lg font-semibold text-red-600">{certificationStats.expiringSoon}</span>
                </div>
                <Link href="/hr/certifications" className="block mt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    View Certifications
                  </Button>
                </Link>
              </div>
            </StatsCard>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {canViewSection(user, 'hrm', 'create') && (
                <Link href="/hr/create-employee">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Employee
                  </Button>
                </Link>
              )}
              {(user.role === 'admin' || user.role === 'hr_officer') && (
                <Link href="/admin/role-templates">
                  <Button variant="outline" className="w-full h-auto py-3 border-primary/30 hover:bg-primary/5">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Manage Role Templates
                  </Button>
                </Link>
              )}
              <Link href="/hr/settings">
                <Button variant="outline" className="w-full h-auto py-3">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              {canViewSection(user, 'timesheets', 'view') && (
                <Link href="/hr/timesheets">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <Clock className="h-4 w-4 mr-2" />
                    Timesheets
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'finance_payroll', 'view') && (
                <Link href="/hr/payroll">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Payroll
                  </Button>
                </Link>
              )}
              {canViewSection(user, 'sites', 'view') && (
                <Link href="/hr/sites">
                  <Button variant="outline" className="w-full h-auto py-3">
                    <MapPin className="h-4 w-4 mr-2" />
                    Sites
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee List - Only show if user has hrm:view permission */}
        {canViewSection(user, 'hrm', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle>All Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeList initialEmployees={serializeMongooseArray(employeesWithSites)} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

