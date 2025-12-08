import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Module } from '@/lib/models/Module';
import { Employee } from '@/lib/models/Employee';
import { getBuyAllPrice, MODULE_PRICES, BUY_ALL_DISCOUNT } from '@/lib/config/modules';
import LandingPageClient from '@/components/modules/LandingPageClient';

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

export default async function ModulesPage() {
  const session = await getServerSession(authOptions);
  
  try {
    await connectDB();
    
    // If user is logged in, check if they have a role
    // ALL employees created by HR have a role and should use role-based access
    // They should NOT browse/purchase modules - access is automatic based on role
    if (session?.user?.id) {
      const employee = await Employee.findById(session.user.id)
        .populate('roleTemplateId', 'name')
        .lean();
      
      // If employee has a role (which all HR-created employees do),
      // redirect to their role-specific dashboard
      // Only admin can browse modules, all other roles go to their dashboards
      if (employee?.role) {
        const { redirect } = await import('next/navigation');
        const { getRoleDashboard } = await import('@/lib/utils/roleDashboard');
        redirect(getRoleDashboard(employee.role));
      }
    }
    
    const modules = await Module.find({ isActive: true }).sort({ name: 1 });
  
  let purchasedModuleCodes = [];
  let allModulesPurchased = false;
  let employee = null;
  
  if (session?.user?.id) {
    employee = await Employee.findById(session.user.id);
    purchasedModuleCodes = employee?.purchasedModules?.map(m => m.moduleCode) || [];
    allModulesPurchased = modules.every(m => purchasedModuleCodes.includes(m.code));
  }

  const modulesWithStatus = modules.map(module => ({
    ...module.toObject(),
    isPurchased: purchasedModuleCodes.includes(module.code),
    isAdmin: employee?.purchasedModules?.find(m => m.moduleCode === module.code)?.isAdmin || false,
  }));

  const buyAllPrice = getBuyAllPrice();
  const individualTotal = Object.values(MODULE_PRICES).reduce((sum, price) => sum + price, 0);

  return (
    <LandingPageClient 
      modules={modulesWithStatus}
      buyAllPrice={buyAllPrice}
      individualTotal={individualTotal}
      discount={BUY_ALL_DISCOUNT}
      allModulesPurchased={allModulesPurchased}
      isAuthenticated={!!session}
      user={session?.user ? {
        name: session.user.name,
        email: session.user.email,
      } : null}
    />
  );
  } catch (error) {
    console.error('[MODULES PAGE] Error:', error);
    // Return empty modules array on error
    return (
      <LandingPageClient 
        modules={[]}
        buyAllPrice={0}
        individualTotal={0}
        discount={BUY_ALL_DISCOUNT}
        allModulesPurchased={false}
        isAuthenticated={!!session}
        user={session?.user ? {
          name: session.user.name,
          email: session.user.email,
        } : null}
      />
    );
  }
}

