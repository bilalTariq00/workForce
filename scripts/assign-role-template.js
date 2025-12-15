/**
 * Assign Role Template to User
 * 
 * Purpose: Assign a role template to a user
 * Run with: node scripts/assign-role-template.js <email> [templateId]
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

async function assignRoleTemplate(email, templateId = null) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find user by email
    const user = await Employee.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    console.log('👤 User Information:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Current Role Template: ${user.roleTemplateId || 'NOT ASSIGNED'}\n`);

    let template;

    if (templateId) {
      // Use provided template ID
      template = await RoleTemplate.findById(templateId);
      if (!template) {
        console.log(`❌ Template not found: ${templateId}`);
        return;
      }
    } else {
      // Find default template for user's role
      template = await RoleTemplate.findOne({
        baseRole: user.role,
        isDefault: true,
      });

      if (!template) {
        console.log(`❌ No default template found for role: ${user.role}`);
        return;
      }
    }

    console.log(`📋 Assigning Template: ${template.name}`);
    console.log(`   Template ID: ${template._id}`);
    console.log(`   Base Role: ${template.baseRole || 'N/A'}`);
    console.log(`   Permissions: ${template.permissions.length} modules\n`);

    // Assign template
    user.roleTemplateId = template._id;
    await user.save();

    console.log('✅ Role template assigned successfully!');
    console.log('\n💡 Note: User may need to log out and log back in for changes to take effect.');

  } catch (error) {
    console.error('❌ Error assigning role template:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Get email from command line argument
const email = process.argv[2];
const templateId = process.argv[3];

if (!email) {
  console.log('Usage: node scripts/assign-role-template.js <email> [templateId]');
  console.log('Example: node scripts/assign-role-template.js hr@workforce.com');
  console.log('Example: node scripts/assign-role-template.js hr@workforce.com 6936e799e4ae5715a49ee6d1');
  process.exit(1);
}

assignRoleTemplate(email, templateId);

