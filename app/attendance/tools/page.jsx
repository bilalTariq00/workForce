import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import LabourLayout from '@/components/layouts/LabourLayout';
import UserToolsManager from '@/components/hr/UserToolsManager';

/**
 * User Tools Page
 * 
 * Purpose: Users can view their assigned tools, request tools, and see return dates
 * 
 * Access: All authenticated users
 */
export default async function UserToolsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <LabourLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Tools</h1>
          <p className="text-muted-foreground mt-2">
            View your assigned tools and request new ones
          </p>
        </div>

        <UserToolsManager />
      </div>
    </LabourLayout>
  );
}

