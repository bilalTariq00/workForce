import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db/mongodb';
import { Module } from '@/lib/models/Module';
import { Employee } from '@/lib/models/Employee';
import ModuleDashboardClient from '@/components/modules/ModuleDashboardClient';
import LogoutButton from '@/components/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ModulesDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Only admin can access modules-dashboard
  // All other roles should be redirected to their role-specific dashboard
  if (session.user.role !== 'admin') {
    const { getRoleDashboard } = await import('@/lib/utils/roleDashboard');
    redirect(getRoleDashboard(session.user.role));
  }

  await connectDB();
  
  const employee = await Employee.findById(session.user.id);
  const purchasedModuleCodes = employee?.purchasedModules?.map(m => m.moduleCode) || [];
  
  // Get all modules to show purchased ones
  const allModules = await Module.find({ isActive: true }).sort({ name: 1 });
  const purchasedModules = allModules.filter(m => purchasedModuleCodes.includes(m.code));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Module Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Welcome, {session.user.name || session.user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/modules" 
                className="text-sm text-primary hover:underline"
              >
                Browse Modules
              </a>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Section */}
        {session.user.role === 'admin' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-primary/20 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Tools</h2>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/admin/role-templates"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Manage Role Templates
                </a>
              </div>
            </div>
          </div>
        )}
        
        <ModuleDashboardClient 
          purchasedModules={purchasedModules.map(m => m.toObject())}
          allModulesCount={allModules.length}
        />
      </div>
    </div>
  );
}


