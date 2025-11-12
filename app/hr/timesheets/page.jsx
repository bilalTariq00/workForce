import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import TimesheetListClient from '@/components/hr/TimesheetListClient';

/**
 * HR Timesheet Approval Page
 * 
 * Purpose: HR can view, approve, and lock timesheets for payroll
 * 
 * Access: HR, Admin only
 */
export default async function TimesheetsPage() {
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
      <TimesheetListClient />
    </DashboardLayout>
  );
}

