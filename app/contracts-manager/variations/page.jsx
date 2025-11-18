import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Variation } from '@/lib/models/Variation';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import VariationApprovalList from '@/components/contracts-manager/VariationApprovalList';

/**
 * Contracts Manager Variations Approval Page
 * 
 * Purpose: Contracts Managers can review and approve/reject variations
 * 
 * Access: Contracts Managers, HR, Admin
 */
export default async function VariationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only Contracts Managers, HR, and Admin can access
  if (
    session.user.role !== 'contracts_manager' &&
    session.user.role !== 'hr_officer' &&
    session.user.role !== 'admin'
  ) {
    redirect('/dashboard');
  }

  await connectDB();

  return (
    <ContractsManagerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Variations / Change Orders</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve/reject variations submitted by Site Managers
          </p>
        </div>

        <VariationApprovalList />
      </div>
    </ContractsManagerLayout>
  );
}

