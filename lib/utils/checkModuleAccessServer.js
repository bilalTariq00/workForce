import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { hasModuleAccess } from '@/lib/config/modules';

/**
 * Server-side function to check module access
 * Use this in server components and API routes
 * 
 * @param {string} moduleCode - Module code to check
 * @returns {Promise<{hasAccess: boolean, user: Object|null}>}
 */
export async function checkModuleAccessServer(moduleCode) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { hasAccess: false, user: null };
    }

    await connectDB();
    
    // Get fresh user data from database to ensure we have latest modules
    const employee = await Employee.findById(session.user.id);
    
    if (!employee) {
      return { hasAccess: false, user: null };
    }

    const hasAccess = hasModuleAccess(employee, moduleCode);

    return { 
      hasAccess, 
      user: {
        id: employee._id.toString(),
        email: employee.email,
        role: employee.role,
        purchasedModules: employee.purchasedModules || [],
      }
    };
  } catch (error) {
    console.error('Error checking module access:', error);
    return { hasAccess: false, user: null };
  }
}


