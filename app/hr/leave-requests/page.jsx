import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import LeaveRequestList from '@/components/hr/LeaveRequestList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Leave Requests Page
 * 
 * Purpose: HR can view and approve/reject leave requests
 * 
 * Access: HR Officers, Admin, Contracts Managers
 */
export default async function LeaveRequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR, Admin, and Contracts Managers can access
  if (
    session.user.role !== 'hr_officer' &&
    session.user.role !== 'admin' &&
    session.user.role !== 'contracts_manager'
  ) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve employee leave requests
          </p>
        </div>

        <LeaveRequestList />
      </div>
    </DashboardLayout>
  );
}

