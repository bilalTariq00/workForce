import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from .env.local or .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Try .env.local first, then .env
const envLocalPath = resolve(rootDir, '.env.local');
const envPath = resolve(rootDir, '.env');

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
  console.log('📄 Loaded .env.local');
} else if (existsSync(envPath)) {
  config({ path: envPath });
  console.log('📄 Loaded .env');
} else {
  console.warn('⚠️  No .env.local or .env file found. Make sure MONGODB_URI is set in environment variables.');
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables!');
  console.error('   Please check your .env.local file has MONGODB_URI set.');
  process.exit(1);
}

// Dynamic imports to ensure env vars are loaded first
async function giveRandomModules() {
  const { connectDB } = await import('../lib/db/mongodb.js');
  const { Employee } = await import('../lib/models/Employee.js');
  const { UserSubscription } = await import('../lib/models/UserSubscription.js');
  const { getAllModuleCodes } = await import('../lib/config/modules.js');
  try {
    await connectDB();
    console.log('✅ Connected to database');

    const employees = await Employee.find({ status: 'active' });
    const moduleCodes = getAllModuleCodes();
    
    console.log(`\n📊 Found ${employees.length} active employees`);
    console.log(`📦 Available modules: ${moduleCodes.join(', ')}\n`);

    let totalModulesGiven = 0;

    for (const employee of employees) {
      // Give each user 2-4 random modules
      const numModules = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4 modules
      const shuffled = [...moduleCodes].sort(() => 0.5 - Math.random());
      const selectedModules = shuffled.slice(0, numModules);

      console.log(`👤 ${employee.email}:`);
      console.log(`   Giving ${numModules} modules: ${selectedModules.join(', ')}`);

      // Update Employee model
      employee.purchasedModules = selectedModules.map(code => ({
        moduleCode: code,
        purchasedAt: new Date(),
        isAdmin: true,
      }));
      await employee.save();

      // Create UserSubscription records
      for (const moduleCode of selectedModules) {
        await UserSubscription.findOneAndUpdate(
          { userId: employee._id, moduleCode },
          {
            userId: employee._id,
            moduleCode,
            isAdmin: true,
            purchasedAt: new Date(),
            status: 'active',
          },
          { upsert: true, new: true }
        );
      }

      totalModulesGiven += numModules;
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`📈 Total modules assigned: ${totalModulesGiven}`);
    console.log(`📊 Average modules per user: ${(totalModulesGiven / employees.length).toFixed(2)}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

giveRandomModules().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


