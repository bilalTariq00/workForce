import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';

export const dynamic = 'force-dynamic';

/**
 * HR Module Root Page
 * 
 * Purpose: Redirects to HR dashboard after checking module access
 * 
 * Access: Requires 'hrm' module
 */
export default async function HRModulePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check module access (HRM module required)
  const { hasAccess } = await checkModuleAccessServer('hrm');
  if (!hasAccess) {
    redirect('/modules?required=hrm');
  }

  // Redirect to HR dashboard
  redirect('/hr/dashboard');
}


