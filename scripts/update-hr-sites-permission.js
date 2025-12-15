/**
 * Update HR Officer Role Template to Add Sites Permissions
 * 
 * Purpose: Add sites module permissions to existing HR Officer role templates
 * Run with: node scripts/update-hr-sites-permission.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Import models
const { RoleTemplate } = await import('../lib/models/RoleTemplate.js');

async function updateHRTemplates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all HR Officer role templates
    const hrTemplates = await RoleTemplate.find({
      baseRole: 'hr_officer',
    });

    if (hrTemplates.length === 0) {
      console.log('⚠️  No HR Officer templates found. Run seed-role-templates.js first.');
      return;
    }

    console.log(`\n📋 Found ${hrTemplates.length} HR Officer template(s):`);

    let updated = 0;

    for (const template of hrTemplates) {
      console.log(`\n   Processing: ${template.name}`);

      // Check if sites permission already exists
      const hasSitesPermission = template.permissions.some(
        (p) => p.module === 'sites'
      );

      if (hasSitesPermission) {
        console.log(`   ⏭️  Already has sites permissions, skipping...`);
        continue;
      }

      // Add sites permission
      template.permissions.push({
        module: 'sites',
        actions: ['view', 'create', 'edit', 'delete', 'manage'],
      });

      await template.save();
      console.log(`   ✅ Added sites permissions`);
      updated++;
    }

    console.log('\n📊 Summary:');
    console.log(`   Templates found: ${hrTemplates.length}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Already had permissions: ${hrTemplates.length - updated}`);

    console.log('\n✅ HR Officer templates updated successfully!');
    console.log('\n💡 Note: Users may need to log out and log back in for changes to take effect.');

  } catch (error) {
    console.error('❌ Error updating HR templates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the update function
updateHRTemplates();

