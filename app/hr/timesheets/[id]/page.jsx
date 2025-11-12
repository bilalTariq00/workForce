import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TimesheetDetailClient from '@/components/hr/TimesheetDetailClient';

/**
 * HR Timesheet Detail Page
 * 
 * Purpose: View and approve a specific timesheet
 * 
 * Access: HR, Admin only
 */
export default async function TimesheetDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access this page
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <TimesheetDetailClient timesheetId={params.id} />
    </DashboardLayout>
  );
}

