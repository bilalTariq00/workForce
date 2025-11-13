import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import EmployeeList from '@/components/hr/EmployeeList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import Link from 'next/link';
import { serializeMongooseArray } from '@/lib/utils/serialize';

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();
  const employees = await Employee.find({ status: { $ne: 'terminated' } })
    .select('-password')
    .populate('siteId', 'name siteCode')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all employees in the system
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

        {/* Employee List */}
        <Card>
          <CardHeader>
            <CardTitle>All Employees ({employees.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeList initialEmployees={serializeMongooseArray(employees)} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}


