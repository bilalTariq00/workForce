import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import ContractsManagerLayout from '@/components/layouts/ContractsManagerLayout';
import ResourceReallocationList from '@/components/contracts-manager/ResourceReallocationList';
import ResourceReallocationForm from '@/components/contracts-manager/ResourceReallocationForm';

/**
 * Contracts Manager Resource Re-Allocation Page
 * 
 * Purpose: Contracts Managers can create and manage resource reallocation requests
 * 
 * Access: Contracts Managers, HR, Admin
 */
export default async function ResourceAllocationPage({ searchParams }) {
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

  const showForm = searchParams?.create === 'true';
  const success = searchParams?.success === 'true';

  return (
    <ContractsManagerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Resource Re-Allocation</h1>
            <p className="text-muted-foreground mt-2">
              Shift crew, plant, or equipment between sites
            </p>
          </div>
          {!showForm && (
            <a href="/contracts-manager/resource-allocation?create=true">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Create Reallocation
              </button>
            </a>
          )}
        </div>

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">
              Resource reallocation request created successfully!
            </p>
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div>
            <div className="mb-4">
              <a href="/contracts-manager/resource-allocation">
                <button className="px-4 py-2 border rounded-lg hover:bg-muted">
                  ← Back to List
                </button>
              </a>
            </div>
            <ResourceReallocationForm
              onSuccess={() => {
                // This will be handled client-side
              }}
            />
          </div>
        )}

        {/* Reallocations List */}
        {!showForm && <ResourceReallocationList />}
      </div>
    </ContractsManagerLayout>
  );
}

