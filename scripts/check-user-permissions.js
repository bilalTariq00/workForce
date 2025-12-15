/**
 * Check User Permissions Script
 * 
 * Purpose: Check a specific user's permissions and role template
 * Run with: node scripts/check-user-permissions.js <email>
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
const { Employee } = await import('../lib/models/Employee.js');
const { RoleTemplate } = await import('../lib/models/RoleTemplate.js');

async function checkUserPermissions(email) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find user by email
    const user = await Employee.findOne({ email: email.toLowerCase() })
      .populate('roleTemplateId')
      .lean();

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log('👤 User Information:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Role Template ID: ${user.roleTemplateId?._id || 'NOT ASSIGNED'}`);
    console.log(`   Role Template Name: ${user.roleTemplateId?.name || 'N/A'}\n`);

    if (!user.roleTemplateId) {
      console.log('⚠️  WARNING: User does not have a role template assigned!');
      console.log('   This means they will not have any permissions.\n');
      
      // Try to find default template for their role
      const defaultTemplate = await RoleTemplate.findOne({
        baseRole: user.role,
        isDefault: true,
      });

      if (defaultTemplate) {
        console.log(`💡 Found default template for ${user.role}: ${defaultTemplate.name}`);
        console.log('   You can assign it with:');
        console.log(`   await Employee.updateOne({ email: "${email}" }, { roleTemplateId: "${defaultTemplate._id}" });\n`);
      } else {
        console.log(`❌ No default template found for role: ${user.role}\n`);
      }
      return;
    }

    console.log('📋 Role Template Permissions:');
    if (user.roleTemplateId.permissions && user.roleTemplateId.permissions.length > 0) {
      user.roleTemplateId.permissions.forEach((perm) => {
        console.log(`   ${perm.module}: [${perm.actions.join(', ')}]`);
      });
    } else {
      console.log('   No permissions defined');
    }

    // Check specific permission
    console.log('\n🔍 Checking sites:create permission:');
    const sitesPermission = user.roleTemplateId.permissions?.find(
      (p) => p.module === 'sites'
    );

    if (sitesPermission) {
      const hasCreate = sitesPermission.actions.includes('create');
      if (hasCreate) {
        console.log('   ✅ User HAS sites:create permission');
      } else {
        console.log('   ❌ User does NOT have sites:create permission');
        console.log(`   Available actions: [${sitesPermission.actions.join(', ')}]`);
      }
    } else {
      console.log('   ❌ User does NOT have sites module permission at all');
    }

    // Admin check
    if (user.role === 'admin') {
      console.log('\n👑 User is admin - has all permissions');
    }

  } catch (error) {
    console.error('❌ Error checking user permissions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/check-user-permissions.js <email>');
  console.log('Example: node scripts/check-user-permissions.js hr@workforce.com');
  process.exit(1);
}

checkUserPermissions(email);

