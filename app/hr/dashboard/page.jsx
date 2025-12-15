import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { EmployeeSite } from '@/lib/models/EmployeeSite';
import { Site } from '@/lib/models/Site';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DashboardStats from '@/components/hr/DashboardStats';
import EmployeeList from '@/components/hr/EmployeeList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { serializeMongooseArray } from '@/lib/utils/serialize';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';

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
  const employees = await Employee.find({ status: { $ne: 'terminated' } })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  // Get assigned sites for each employee
  // Note: Site model is already imported above to ensure it's registered
  const employeesWithSites = await Promise.all(
    employees.map(async (employee) => {
      const assignedSites = await EmployeeSite.getEmployeeSites(employee._id);
      return {
        ...employee,
        assignedSites: assignedSites || [],
      };
    })
  );

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
              <Link href="/hr/create-employee">
                <Button variant="outline" className="w-full h-auto py-3">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Employee
                </Button>
              </Link>
              <Link href="/admin/role-templates">
                <Button variant="outline" className="w-full h-auto py-3 border-primary/30 hover:bg-primary/5">
                  <Shield className="h-4 w-4 mr-2 text-primary" />
                  Manage Role Templates
                </Button>
              </Link>
              <Link href="/hr/settings">
                <Button variant="outline" className="w-full h-auto py-3">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeList initialEmployees={serializeMongooseArray(employeesWithSites)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

