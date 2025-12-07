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
  console.warn('⚠️  No .env.local or .env file found.');
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables!');
  process.exit(1);
}

console.log('🔗 MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

// Dynamic imports to ensure env vars are loaded first
async function checkModules() {
  const { connectDB } = await import('../lib/db/mongodb.js');
  const { Module } = await import('../lib/models/Module.js');
  const mongoose = await import('mongoose');

  try {
    await connectDB();
    console.log('✅ Connected to database');
    
    // Check database name
    const dbName = mongoose.default.connection.db.databaseName;
    console.log('📊 Database name:', dbName);
    
    // List all collections
    const collections = await mongoose.default.connection.db.listCollections().toArray();
    console.log('\n📦 Collections in database:');
    collections.forEach(col => console.log('  -', col.name));
    
    // Check modules collection
    const moduleCount = await Module.countDocuments({});
    console.log(`\n📊 Total modules in 'modules' collection: ${moduleCount}`);
    
    if (moduleCount === 0) {
      console.log('\n⚠️  No modules found!');
      console.log('   Run: node scripts/init-modules.js');
    } else {
      console.log('\n✅ Modules found:');
      const modules = await Module.find({}).sort({ name: 1 });
      modules.forEach(m => {
        console.log(`  - ${m.code}: ${m.name} ($${m.price}) - Active: ${m.isActive}`);
      });
      
      // Check active modules
      const activeCount = await Module.countDocuments({ isActive: true });
      console.log(`\n✅ Active modules: ${activeCount}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkModules().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

