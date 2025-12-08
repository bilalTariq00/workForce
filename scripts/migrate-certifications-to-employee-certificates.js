/**
 * Migration Script: Certification → EmployeeCertificate
 * 
 * Purpose: Migrate existing Certification documents to EmployeeCertificate model
 * 
 * Usage:
 *   node scripts/migrate-certifications-to-employee-certificates.js
 * 
 * ⚠️  IMPORTANT: 
 * - This script MUST be run BEFORE deleting lib/models/Certification.js
 * - If you've already deleted the model, restore it temporarily to run this migration
 * - After successful migration, you can safely delete the Certification model
 * - The script will skip duplicates if run multiple times
 */

import dotenv from 'dotenv';
import { connectDB } from '../lib/db/mongodb.js';
import { Certification } from '../lib/models/Certification.js';
import { EmployeeCertificate } from '../lib/models/EmployeeCertificate.js';

dotenv.config({ path: '.env.local' });

async function migrateCertifications() {
  try {
    await connectDB();
    console.log('Connected to database\n');

    const certifications = await Certification.find().lean();
    console.log(`Found ${certifications.length} certifications to migrate\n`);

    if (certifications.length === 0) {
      console.log('No certifications to migrate. Exiting.');
      process.exit(0);
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const cert of certifications) {
      try {
        // Check if already migrated (by matching key fields)
        const exists = await EmployeeCertificate.findOne({
          employeeId: cert.employeeId,
          type: cert.type,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
        });

        if (exists) {
          console.log(`⏭️  Skipping duplicate: ${cert.type} for employee ${cert.employeeId}`);
          skipped++;
          continue;
        }

        // Determine status - map old status to new status
        let status = cert.status;
        if (status === 'expiring_soon') {
          status = 'expiring_soon';
        } else if (status === 'expired') {
          status = 'expired';
        } else if (status === 'rejected') {
          status = 'rejected';
        } else if (status === 'valid') {
          // Check if actually expired
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiryDate = new Date(cert.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          
          if (expiryDate < today) {
            status = 'expired';
          } else {
            // Check if expiring soon (30 days)
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              status = 'expiring_soon';
            } else {
              status = 'valid';
            }
          }
        } else {
          status = 'pending_validation';
        }

        // Migrate to EmployeeCertificate
        await EmployeeCertificate.create({
          employeeId: cert.employeeId,
          type: cert.type,
          certificateNumber: null, // Old model didn't have this
          documentUrl: cert.documentUrl,
          documentType: cert.documentType,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          status: status,
          validatedBy: cert.validatedBy || null,
          validatedAt: cert.validatedAt || null,
          rejectionReason: cert.rejectionReason || null,
          notes: cert.notes || null,
          uploadMethod: 'file', // Default since old model didn't track this
          uploadedBy: cert.employeeId, // Default to employee since we don't know who uploaded
        });

        migrated++;
        console.log(`✅ Migrated: ${cert.type} (${cert._id}) → EmployeeCertificate`);
      } catch (error) {
        errors++;
        console.error(`❌ Error migrating ${cert._id}:`, error.message);
      }
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped (duplicates): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n⚠️  Next Steps:`);
    console.log(`1. Test the application to ensure everything works`);
    console.log(`2. Verify migrated data in the database`);
    console.log(`3. Once confirmed, you can delete the Certification collection manually:`);
    console.log(`   db.certifications.drop()`);
    console.log(`4. Delete lib/models/Certification.js file`);

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateCertifications();

