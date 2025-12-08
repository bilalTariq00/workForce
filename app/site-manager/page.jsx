import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';

export const dynamic = 'force-dynamic';

/**
 * Process Management Module Root Page
 * 
 * Purpose: Redirects to Site Manager dashboard after checking module access
 * 
 * Access: Requires 'process_management' module
 */
export default async function SiteManagerModulePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Check module access (Process Management module required)
  const { hasAccess } = await checkModuleAccessServer('process_management');
  if (!hasAccess) {
    redirect('/modules?required=process_management');
  }

  // Redirect to Site Manager dashboard
  redirect('/site-manager/dashboard');
}


