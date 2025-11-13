import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import MultiSiteDashboardClient from '@/components/contracts-manager/MultiSiteDashboardClient';

/**
 * Contracts Manager Multi-Site Dashboard
 * 
 * Purpose: View aggregated data for all sites
 * 
 * Access: Contracts Manager, Admin only
 */
export default async function ContractsManagerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Contracts Managers and Admin can access
  if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <ContractsManagerLayout>
      <MultiSiteDashboardClient />
    </ContractsManagerLayout>
  );
}

