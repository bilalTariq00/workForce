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
        <ModuleDashboardClient 
          purchasedModules={purchasedModules.map(m => m.toObject())}
          allModulesCount={allModules.length}
        />
      </div>
    </div>
  );
}


