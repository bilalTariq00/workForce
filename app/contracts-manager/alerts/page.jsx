import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import AlertListClient from '@/components/contracts-manager/AlertListClient';

/**
 * Contracts Manager Alert Dashboard
 * 
 * Purpose: View and manage exception alerts
 * 
 * Access: Contracts Manager, Admin only
 */
export default async function AlertsPage() {
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
      <AlertListClient />
    </ContractsManagerLayout>
  );
}

