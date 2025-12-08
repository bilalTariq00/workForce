/**
 * Seed UK Tax/NI/Pension Configuration
 * 
 * Purpose: Seed UK tax bands, NI rates, and pension configuration for 2024-2025
 * Run with: node scripts/seed-uk-tax-config.js
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
const { TaxConfig } = await import('../lib/models/TaxConfig.js');
const { NIConfig } = await import('../lib/models/NIConfig.js');
const { PensionConfig } = await import('../lib/models/PensionConfig.js');

async function seedUKTaxConfig() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Seed Tax Configuration (2024-2025 UK)
    const taxYear = '2024-2025';
    const existingTax = await TaxConfig.findOne({ taxYear });
    
    if (existingTax) {
      console.log(`⏭️  Tax config for ${taxYear} already exists`);
    } else {
      await TaxConfig.create({
        taxYear,
        personalAllowance: 12570,
        taxBands: [
          {
            name: 'basic',
            minIncome: 12571,
            maxIncome: 50270,
            rate: 20,
          },
          {
            name: 'higher',
            minIncome: 50271,
            maxIncome: 125140,
            rate: 40,
          },
          {
            name: 'additional',
            minIncome: 125141,
            maxIncome: null,
            rate: 45,
          },
        ],
        isActive: true,
        effectiveFrom: new Date('2024-04-06'),
        effectiveTo: new Date('2025-04-05'),
      });
      console.log(`✅ Created tax config for ${taxYear}`);
    }

    // Seed NI Configuration (2024-2025 UK)
    const existingNI = await NIConfig.findOne({ taxYear });
    
    if (existingNI) {
      console.log(`⏭️  NI config for ${taxYear} already exists`);
    } else {
      await NIConfig.create({
        taxYear,
        employeeNI: {
          primaryThreshold: 12570,
          upperEarningsLimit: 50270,
          standardRate: 12,
          additionalRate: 2,
        },
        employerNI: {
          secondaryThreshold: 9100,
          rate: 13.8,
        },
        isActive: true,
        effectiveFrom: new Date('2024-04-06'),
        effectiveTo: new Date('2025-04-05'),
      });
      console.log(`✅ Created NI config for ${taxYear}`);
    }

    // Seed Pension Configuration (Default Scheme)
    const existingPension = await PensionConfig.findOne({ schemeCode: 'DEFAULT' });
    
    if (existingPension) {
      console.log('⏭️  Default pension scheme already exists');
    } else {
      await PensionConfig.create({
        schemeName: 'Default Auto-Enrollment Scheme',
        schemeCode: 'DEFAULT',
        description: 'Default pension scheme with auto-enrollment',
        autoEnrollment: {
          enabled: true,
          qualifyingEarningsThreshold: 6240,
          minimumEmployeeContribution: 5,
          minimumEmployerContribution: 3,
        },
        defaultEmployeeRate: 5,
        defaultEmployerRate: 3,
        isActive: true,
        isDefault: true,
        effectiveFrom: new Date('2024-04-06'),
      });
      console.log('✅ Created default pension scheme');
    }

    console.log('\n✅ UK tax/NI/pension configuration seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding UK tax config:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the seed function
seedUKTaxConfig();

