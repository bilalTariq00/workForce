import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ToolInventoryManager from '@/components/hr/ToolInventoryManager';

/**
 * Tool Inventory Management Page
 * 
 * Purpose: HR can manage tool inventory, assign tools, track assignments, and handle requests
 * 
 * Access: HR Officers, Admin
 */
export default async function ToolsPage() {
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
          <h1 className="text-3xl font-bold text-foreground">Tool Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage tools, track assignments, and handle tool requests
          </p>
        </div>

        <ToolInventoryManager />
      </div>
    </DashboardLayout>
  );
}

