import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CreateEmployeeForm from '@/components/hr/CreateEmployeeForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function CreateEmployeePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Create New Employee</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add a new employee to the workforce management system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Fill in the details below to create a new employee account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateEmployeeForm />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

