import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { Attendance } from '@/lib/models/Attendance';
import { Site } from '@/lib/models/Site';
import { LogOut, Users, FileText, DollarSign, MapPin, Award, Clock, Calendar, Building2, AlertTriangle } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getUserAccessibleModules, canViewSection } from '@/lib/utils/dashboardPermissions';
import StatsCard from '@/components/dashboard/StatsCard';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
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

  // Import role dashboard utility
  const { getRoleDashboard } = await import('@/lib/utils/roleDashboard');

  // Always redirect based on role - clean and simple
  // This ensures users always go to their role-specific dashboard
  if (session.user.role) {
    const standardRoles = ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'];
    
    // Determine which role to use for routing
    let roleForRouting = session.user.role;
    
    // If user has a custom role template with baseRole, use that for routing
    if (employee?.roleTemplateId?.baseRole && standardRoles.includes(employee.roleTemplateId.baseRole)) {
      roleForRouting = employee.roleTemplateId.baseRole;
    }
    
    // Redirect to the appropriate dashboard
    if (standardRoles.includes(roleForRouting)) {
      const dashboardRoute = getRoleDashboard(roleForRouting, employee?.roleTemplateId || null);
      redirect(dashboardRoute);
    }
    // For unknown roles, stay on generic dashboard (will show permission-based widgets)
  }

  // Get accessible modules for this user
  const accessibleModules = getUserAccessibleModules(user);

  // Get today's attendance (if user has attendance:view permission)
  let attendance = null;
  if (canViewSection(user, 'attendance', 'view')) {
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
  }

  // Module widgets configuration
  const moduleWidgets = [
    {
      module: 'hrm',
      title: 'HR Management',
      description: 'Employee management',
      icon: Users,
      route: '/hr',
      requiredPermission: 'hrm:view',
    },
    {
      module: 'timesheets',
      title: 'Timesheets',
      description: 'Timesheet management',
      icon: Clock,
      route: '/hr/timesheets',
      requiredPermission: 'timesheets:view',
    },
    {
      module: 'finance_payroll',
      title: 'Payroll',
      description: 'Payroll processing',
      icon: DollarSign,
      route: '/hr/payroll',
      requiredPermission: 'finance_payroll:view',
    },
    {
      module: 'sites',
      title: 'Sites',
      description: 'Construction sites',
      icon: MapPin,
      route: '/hr/sites',
      requiredPermission: 'sites:view',
    },
    {
      module: 'certifications',
      title: 'Certifications',
      description: 'Employee certifications',
      icon: Award,
      route: '/hr/certifications',
      requiredPermission: 'certifications:view',
    },
    {
      module: 'process_management',
      title: 'Process Management',
      description: 'Daily logs and processes',
      icon: FileText,
      route: '/site-manager',
      requiredPermission: 'process_management:view',
    },
    {
      module: 'attendance',
      title: 'Attendance',
      description: 'Attendance tracking',
      icon: Calendar,
      route: '/attendance/scan',
      requiredPermission: 'attendance:view',
    },
    {
      module: 'leave_requests',
      title: 'Leave Requests',
      description: 'Leave management',
      icon: Calendar,
      route: '/attendance/leave-request',
      requiredPermission: 'leave_requests:view',
    },
  ];

  // Filter widgets based on permissions
  const availableWidgets = moduleWidgets.filter(widget => 
    canViewSection(user, widget.module, 'view')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container-mobile py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Welcome, {session.user.name}
              </p>
              {employee?.roleTemplateId && (
                <p className="text-xs text-gray-500 mt-1">
                  Role Template: {employee.roleTemplateId.name}
                </p>
              )}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container-mobile py-6 space-y-6">
        {/* Accessible Modules */}
        {availableWidgets.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Modules</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableWidgets.map((widget) => {
                const Icon = widget.icon;
                return (
                  <Card key={widget.module}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {widget.title}
                      </CardTitle>
                      <CardDescription>{widget.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={widget.route}>
                        <Button variant="outline" className="w-full">
                          Access {widget.title}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Attendance */}
        {attendance && canViewSection(user, 'attendance', 'view') && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Site:</span> {attendance.siteId?.name || 'N/A'}
                </p>
                <p className="text-sm text-green-800">
                  <span className="font-medium">Signed in:</span>{' '}
                  {new Date(attendance.signInTime).toLocaleTimeString()}
                </p>
                {attendance.signOutTime && (
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Signed out:</span>{' '}
                    {new Date(attendance.signOutTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No modules message */}
        {availableWidgets.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Modules Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                You don't have access to any modules yet. Please contact your administrator to assign permissions.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

