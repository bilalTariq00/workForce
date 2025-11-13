import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import PayrollRunDetail from '@/components/hr/PayrollRunDetail';

/**
 * Payroll Run Detail Page
 * 
 * Purpose: View detailed payroll run information and calculations
 * 
 * Access: HR Officers, Admin
 */
export default async function PayrollRunDetailPage({ params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only HR and Admin can access
  if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  await connectDB();

  return (
    <DashboardLayout>
      <PayrollRunDetail payrollRunId={params.id} />
    </DashboardLayout>
  );
}

