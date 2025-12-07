import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import { UserSubscription } from '@/lib/models/UserSubscription';
import { Module } from '@/lib/models/Module';
import { getAllModuleCodes, getBuyAllPrice, MODULE_PRICES } from '@/lib/config/modules';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { moduleCodes, buyAll } = await req.json();

    if (buyAll) {
      // Purchase all modules
      const allCodes = getAllModuleCodes();
      const employee = await Employee.findById(session.user.id);
      
      if (!employee) {
        return Response.json({ error: 'Employee not found' }, { status: 404 });
      }

      const newModules = [];
      for (const code of allCodes) {
        // Check if already purchased
        const existing = employee.purchasedModules?.find(m => m.moduleCode === code);
        if (!existing) {
          newModules.push({
            moduleCode: code,
            purchasedAt: new Date(),
            isAdmin: true,
          });

          // Create subscription
          await UserSubscription.findOneAndUpdate(
            { userId: employee._id, moduleCode: code },
            {
              userId: employee._id,
              moduleCode: code,
              isAdmin: true,
              purchasedAt: new Date(),
              status: 'active',
            },
            { upsert: true, new: true }
          );
        }
      }

      if (newModules.length > 0) {
        if (!employee.purchasedModules) {
          employee.purchasedModules = [];
        }
        employee.purchasedModules.push(...newModules);
        await employee.save();
      }

      return Response.json({
        success: true,
        message: 'All modules purchased successfully',
        totalPrice: getBuyAllPrice(),
        modulesPurchased: newModules.length,
      });
    } else {
      // Purchase specific modules
      if (!moduleCodes || !Array.isArray(moduleCodes) || moduleCodes.length === 0) {
        return Response.json({ error: 'Invalid module codes' }, { status: 400 });
      }

      const employee = await Employee.findById(session.user.id);
      if (!employee) {
        return Response.json({ error: 'Employee not found' }, { status: 404 });
      }

      // Validate modules exist
      const modules = await Module.find({ code: { $in: moduleCodes }, isActive: true });
      if (modules.length !== moduleCodes.length) {
        return Response.json({ error: 'Some modules not found or inactive' }, { status: 400 });
      }

      const newModules = [];
      let totalPrice = 0;

      for (const code of moduleCodes) {
        // Check if already purchased
        const existing = employee.purchasedModules?.find(m => m.moduleCode === code);
        if (existing) {
          continue; // Skip already purchased
        }

        const module = modules.find(m => m.code === code);
        newModules.push({
          moduleCode: code,
          purchasedAt: new Date(),
          isAdmin: true,
        });

        totalPrice += module.price;

        // Create subscription
        await UserSubscription.findOneAndUpdate(
          { userId: employee._id, moduleCode: code },
          {
            userId: employee._id,
            moduleCode: code,
            isAdmin: true,
            purchasedAt: new Date(),
            status: 'active',
          },
          { upsert: true, new: true }
        );
      }

      if (newModules.length > 0) {
        if (!employee.purchasedModules) {
          employee.purchasedModules = [];
        }
        employee.purchasedModules.push(...newModules);
        await employee.save();
      }

      return Response.json({
        success: true,
        message: 'Modules purchased successfully',
        totalPrice,
        modulesPurchased: newModules.length,
        modules: newModules.map(m => m.moduleCode),
      });
    }
  } catch (error) {
    console.error('Purchase error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}


