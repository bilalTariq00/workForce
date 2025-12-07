import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Module } from '@/lib/models/Module';
import { Employee } from '@/lib/models/Employee';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const modules = await Module.find({ isActive: true }).sort({ name: 1 });
    const employee = await Employee.findById(session.user.id);
    
    const purchasedModuleCodes = employee?.purchasedModules?.map(m => m.moduleCode) || [];

    const modulesWithStatus = modules.map(module => ({
      ...module.toObject(),
      isPurchased: purchasedModuleCodes.includes(module.code),
      isAdmin: employee?.purchasedModules?.find(m => m.moduleCode === module.code)?.isAdmin || false,
    }));

    return Response.json({ success: true, modules: modulesWithStatus });
  } catch (error) {
    console.error('Get modules error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


