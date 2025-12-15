/**
 * Seed Role Templates
 * 
 * Purpose: Seed default permission templates for each role
 * Run with: node scripts/seed-role-templates.js
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

// Default permission templates for each role
const defaultTemplates = [
  {
    name: 'Labour - Default',
    description: 'Default permissions for labour/tradesperson role',
    baseRole: 'labour',
    isDefault: true,
    permissions: [
      { module: 'attendance', actions: ['view', 'create'] },
      { module: 'leave_requests', actions: ['view', 'create'] },
      { module: 'certifications', actions: ['view', 'create'] },
    ],
  },
  {
    name: 'Site Manager - Default',
    description: 'Default permissions for site manager role',
    baseRole: 'site_manager',
    isDefault: true,
    permissions: [
      { module: 'process_management', actions: ['view', 'create', 'edit'] },
      { module: 'attendance', actions: ['view', 'approve'] },
      { module: 'timesheets', actions: ['view', 'approve'] },
      { module: 'sites', actions: ['view'] },
    ],
  },
  {
    name: 'Contracts Manager - Default',
    description: 'Default permissions for contracts manager role',
    baseRole: 'contracts_manager',
    isDefault: true,
    permissions: [
      { module: 'sites', actions: ['view', 'manage'] },
      { module: 'process_management', actions: ['view', 'approve'] },
      { module: 'attendance', actions: ['view', 'export'] },
      { module: 'reports', actions: ['view', 'export'] },
    ],
  },
  {
    name: 'HR Officer - Default',
    description: 'Default permissions for HR officer role',
    baseRole: 'hr_officer',
    isDefault: true,
    permissions: [
      { module: 'hrm', actions: ['view', 'create', 'edit', 'manage'] },
      { module: 'attendance', actions: ['view', 'export'] },
      { module: 'certifications', actions: ['view', 'create', 'edit', 'approve'] },
      { module: 'timesheets', actions: ['view', 'approve', 'export'] },
      { module: 'finance_payroll', actions: ['view', 'create', 'edit', 'export'] },
      { module: 'leave_requests', actions: ['view', 'approve'] },
      { module: 'sites', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'reports', actions: ['view', 'export'] },
    ],
  },
  {
    name: 'EHS Officer - Default',
    description: 'Default permissions for EHS officer role',
    baseRole: 'ehs_officer',
    isDefault: true,
    permissions: [
      { module: 'certifications', actions: ['view', 'approve'] },
      { module: 'reports', actions: ['view', 'export'] },
    ],
  },
  {
    name: 'Admin - Default',
    description: 'Default permissions for admin role (full access)',
    baseRole: 'admin',
    isDefault: true,
    permissions: [
      { module: 'hrm', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'registers', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'process_management', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'finance_payroll', actions: ['view', 'create', 'edit', 'delete', 'export', 'manage'] },
      { module: 'equipment', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'procurement', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'attendance', actions: ['view', 'create', 'edit', 'approve', 'export', 'manage'] },
      { module: 'certifications', actions: ['view', 'create', 'edit', 'delete', 'approve', 'manage'] },
      { module: 'timesheets', actions: ['view', 'create', 'edit', 'approve', 'export', 'manage'] },
      { module: 'leave_requests', actions: ['view', 'create', 'edit', 'approve', 'manage'] },
      { module: 'sites', actions: ['view', 'create', 'edit', 'delete', 'manage'] },
      { module: 'reports', actions: ['view', 'create', 'edit', 'export', 'manage'] },
    ],
  },
];

async function seedRoleTemplates() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing default templates (optional - comment out if you want to keep existing)
    // await RoleTemplate.deleteMany({ isDefault: true });
    // console.log('✅ Cleared existing default templates');

    // Insert default templates
    let created = 0;
    let skipped = 0;

    for (const template of defaultTemplates) {
      const existing = await RoleTemplate.findOne({
        name: template.name,
        isDefault: true,
      });

      if (existing) {
        console.log(`⏭️  Skipping ${template.name} (already exists)`);
        skipped++;
      } else {
        await RoleTemplate.create(template);
        console.log(`✅ Created ${template.name}`);
        created++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${defaultTemplates.length}`);

    console.log('\n✅ Role templates seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding role templates:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seed function
seedRoleTemplates();

