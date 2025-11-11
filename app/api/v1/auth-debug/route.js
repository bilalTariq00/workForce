import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Debug authentication setup
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      nextAuthSecretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      hasMongoUri: !!process.env.MONGODB_URI,
      mongoUriPreview: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 20) + '...' : 'NOT SET',
      defaultHREmail: process.env.DEFAULT_HR_EMAIL || 'hr@workforce.com',
      defaultHRPassword: process.env.DEFAULT_HR_PASSWORD || 'Admin@123',
    },
    database: {
      connected: false,
      error: null,
    },
    hrAdmin: {
      exists: false,
      email: null,
      role: null,
      status: null,
      hasPassword: false,
      passwordMatches: false,
    },
    issues: [],
    recommendations: [],
  };

  // Check environment variables
  if (!process.env.NEXTAUTH_URL) {
    diagnostics.issues.push('NEXTAUTH_URL is not set');
    diagnostics.recommendations.push('Set NEXTAUTH_URL to https://work-force-qtya.vercel.app (no trailing slash)');
  } else if (process.env.NEXTAUTH_URL.endsWith('/')) {
    diagnostics.issues.push('NEXTAUTH_URL has trailing slash (should not have one)');
    diagnostics.recommendations.push('Remove trailing slash from NEXTAUTH_URL');
  }

  if (!process.env.NEXTAUTH_SECRET) {
    diagnostics.issues.push('NEXTAUTH_SECRET is not set');
    diagnostics.recommendations.push('Generate and set NEXTAUTH_SECRET: openssl rand -base64 32');
  } else if (process.env.NEXTAUTH_SECRET.length < 32) {
    diagnostics.issues.push('NEXTAUTH_SECRET seems too short');
    diagnostics.recommendations.push('Generate a new NEXTAUTH_SECRET: openssl rand -base64 32');
  }

  if (!process.env.MONGODB_URI) {
    diagnostics.issues.push('MONGODB_URI is not set');
    diagnostics.recommendations.push('Set MONGODB_URI to your MongoDB connection string');
  }

  // Try to connect to database
  try {
    await connectDB();
    diagnostics.database.connected = true;
  } catch (error) {
    diagnostics.database.connected = false;
    diagnostics.database.error = error.message;
    diagnostics.issues.push(`Database connection failed: ${error.message}`);
    diagnostics.recommendations.push('Check MONGODB_URI and MongoDB Atlas network access settings');
    
    return NextResponse.json(diagnostics, { status: 200 });
  }

  // Check for HR admin
  try {
    const defaultEmail = process.env.DEFAULT_HR_EMAIL || 'hr@workforce.com';
    const defaultPassword = process.env.DEFAULT_HR_PASSWORD || 'Admin@123';
    
    const hrAdmin = await Employee.findOne({ 
      email: defaultEmail.toLowerCase(),
      role: 'hr_officer'
    });

    if (hrAdmin) {
      diagnostics.hrAdmin.exists = true;
      diagnostics.hrAdmin.email = hrAdmin.email;
      diagnostics.hrAdmin.role = hrAdmin.role;
      diagnostics.hrAdmin.status = hrAdmin.status;
      diagnostics.hrAdmin.hasPassword = !!hrAdmin.password;

      // Test password
      if (hrAdmin.password) {
        try {
          const passwordMatches = await bcrypt.compare(defaultPassword, hrAdmin.password);
          diagnostics.hrAdmin.passwordMatches = passwordMatches;
          
          if (!passwordMatches) {
            diagnostics.issues.push('HR admin password does not match DEFAULT_HR_PASSWORD');
            diagnostics.recommendations.push('Reinitialize HR admin at /api/v1/init or update password');
          }
        } catch (bcryptError) {
          diagnostics.issues.push('Error comparing password');
        }
      } else {
        diagnostics.issues.push('HR admin has no password set');
        diagnostics.recommendations.push('Reinitialize HR admin at /api/v1/init');
      }

      if (hrAdmin.status !== 'active') {
        diagnostics.issues.push(`HR admin status is '${hrAdmin.status}' (should be 'active')`);
        diagnostics.recommendations.push('Update HR admin status to active');
      }
    } else {
      diagnostics.issues.push('HR admin user does not exist');
      diagnostics.recommendations.push('Initialize HR admin by visiting /api/v1/init');
    }
  } catch (error) {
    diagnostics.issues.push(`Error checking HR admin: ${error.message}`);
  }

  // Overall status
  const isHealthy = diagnostics.issues.length === 0;
  diagnostics.status = isHealthy ? 'healthy' : 'issues_found';
  diagnostics.summary = isHealthy 
    ? 'All checks passed! Authentication should work.'
    : `Found ${diagnostics.issues.length} issue(s) that need to be fixed.`;

  return NextResponse.json(diagnostics, { status: 200 });
}

