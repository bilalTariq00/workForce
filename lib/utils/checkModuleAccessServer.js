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
    
    // Get fresh user data from database with role template populated
    const employee = await Employee.findById(session.user.id)
      .populate('roleTemplateId', 'name permissions')
      .lean();
    
    if (!employee) {
      return { hasAccess: false, user: null };
    }

    // Convert to plain object with roleTemplateId populated
    const employeeWithTemplate = {
      ...employee,
      _id: employee._id.toString(),
      roleTemplateId: employee.roleTemplateId || null,
    };

    const hasAccess = hasModuleAccess(employeeWithTemplate, moduleCode);

    return { 
      hasAccess, 
      user: {
        id: employee._id.toString(),
        email: employee.email,
        role: employee.role,
        roleTemplateId: employee.roleTemplateId,
        purchasedModules: employee.purchasedModules || [],
      }
    };
  } catch (error) {
    console.error('Error checking module access:', error);
    return { hasAccess: false, user: null };
  }
}


