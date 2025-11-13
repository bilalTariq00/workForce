import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PayrollRunList from '@/components/hr/PayrollRunList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Payroll Page
 * 
 * Purpose: HR can create, view, calculate, and export payroll runs
 * 
 * Access: HR Officers, Admin
 */
export default async function PayrollPage() {
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
          <h1 className="text-3xl font-bold text-foreground">Payroll Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, calculate, and export payroll runs
          </p>
        </div>

        <PayrollRunList />
      </div>
    </DashboardLayout>
  );
}

