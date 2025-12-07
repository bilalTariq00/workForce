// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Try .env.local first, then .env
const envLocalPath = resolve(rootDir, '.env.local');
const envPath = resolve(rootDir, '.env');

if (existsSync(envLocalPath)) {
  const result = config({ path: envLocalPath });
  if (result.error) {
    console.warn('⚠️  Error loading .env.local:', result.error.message);
  } else {
    console.log('📄 Loaded .env.local');
  }
} else if (existsSync(envPath)) {
  const result = config({ path: envPath });
  if (result.error) {
    console.warn('⚠️  Error loading .env:', result.error.message);
  } else {
    console.log('📄 Loaded .env');
  }
} else {
  console.warn('⚠️  No .env.local or .env file found. Make sure MONGODB_URI is set in environment variables.');
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables!');
  console.error('   Please check your .env.local file has MONGODB_URI set.');
  process.exit(1);
}

// Now import modules that use process.env (using dynamic import to ensure env is loaded)
async function initModules() {
  // Dynamic imports to ensure env vars are loaded first
  const { connectDB } = await import('../lib/db/mongodb.js');
  const { Module } = await import('../lib/models/Module.js');
  const { MODULES, MODULE_PRICES } = await import('../lib/config/modules.js');
  try {
    await connectDB();
    console.log('✅ Connected to database');

    for (const module of Object.values(MODULES)) {
      const moduleData = {
        code: module.code,
        name: module.name,
        description: module.description,
        price: MODULE_PRICES[module.code],
        icon: module.icon,
        route: module.route,
        features: module.features,
        isActive: true,
      };

      await Module.findOneAndUpdate(
        { code: module.code },
        moduleData,
        { upsert: true, new: true }
      );

      console.log(`✅ Initialized module: ${module.name} (${module.code}) - $${MODULE_PRICES[module.code]}`);
    }

    console.log('\n✅ All modules initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

initModules().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});


