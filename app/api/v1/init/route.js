import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { Employee } from '@/lib/models/Employee';
import bcrypt from 'bcryptjs';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET - Show initialization page or trigger initialization
export async function GET() {
  try {
    await connectDB();

    const defaultEmail = process.env.DEFAULT_HR_EMAIL || 'hr@workforce.com';
    
    // Check if HR admin already exists
    const existingHR = await Employee.findOne({ 
      email: defaultEmail.toLowerCase(),
      role: 'hr_officer'
    });

    if (existingHR) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <title>HR Admin Already Exists</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .success { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; }
    .info { background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-top: 20px; }
    button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; }
    button:hover { background: #2563eb; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="success">
    <h2>✅ HR Admin Already Exists</h2>
    <p>The HR admin user has already been initialized.</p>
    <p><strong>Email:</strong> <code>${defaultEmail}</code></p>
  </div>
  <div class="info">
    <p>You can now login at: <a href="/login">/login</a></p>
  </div>
</body>
</html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Return HTML page with button to initialize
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Initialize HR Admin</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .container { background: white; border: 1px solid #e5e7eb; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1f2937; margin-top: 0; }
    button { background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px; width: 100%; }
    button:hover { background: #2563eb; }
    button:disabled { background: #9ca3af; cursor: not-allowed; }
    .info { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    #result { margin-top: 20px; padding: 15px; border-radius: 6px; display: none; }
    .success { background: #d1fae5; border: 1px solid #10b981; }
    .error { background: #fee2e2; border: 1px solid #ef4444; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Initialize HR Admin</h1>
    <p>Click the button below to create the default HR admin user.</p>
    <div class="info">
      <p><strong>Default Email:</strong> <code>${defaultEmail}</code></p>
      <p><strong>Default Password:</strong> <code>Admin@123</code></p>
      <p><small>⚠️ Change this password after first login!</small></p>
    </div>
    <button id="initBtn" onclick="initialize()">Initialize HR Admin</button>
    <div id="result"></div>
  </div>
  <script>
    async function initialize() {
      const btn = document.getElementById('initBtn');
      const result = document.getElementById('result');
      btn.disabled = true;
      btn.textContent = 'Initializing...';
      result.style.display = 'none';
      
      try {
        const response = await fetch('/api/v1/init', { method: 'POST' });
        const data = await response.json();
        
        result.style.display = 'block';
        
        if (data.success) {
          result.className = 'success';
          result.innerHTML = \`
            <h3>✅ Success!</h3>
            <p><strong>HR Admin Created Successfully</strong></p>
            <p><strong>Email:</strong> <code>\${data.data.email}</code></p>
            <p><strong>Password:</strong> <code>\${data.data.password}</code></p>
            <p><a href="/login" style="color: #3b82f6;">Go to Login Page →</a></p>
          \`;
        } else {
          result.className = 'error';
          result.innerHTML = \`
            <h3>❌ Error</h3>
            <p>\${data.message || 'Failed to initialize HR admin'}</p>
          \`;
        }
      } catch (error) {
        result.style.display = 'block';
        result.className = 'error';
        result.innerHTML = \`
          <h3>❌ Error</h3>
          <p>Failed to connect to server. Please check your MongoDB connection.</p>
        \`;
      } finally {
        btn.disabled = false;
        btn.textContent = 'Initialize HR Admin';
      }
    }
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/v1/init:', error);
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .error { background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="error">
    <h2>❌ Error</h2>
    <p>Failed to connect to database. Please check your MongoDB connection string.</p>
    <p><small>Error: ${error.message}</small></p>
  </div>
</body>
</html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// POST - Create the default HR admin user
export async function POST() {
  try {
    await connectDB();

    const defaultEmail = process.env.DEFAULT_HR_EMAIL || 'hr@workforce.com';
    const defaultPassword = process.env.DEFAULT_HR_PASSWORD || 'Admin@123';

    // Check if HR admin already exists
    const existingHR = await Employee.findOne({ 
      email: defaultEmail.toLowerCase(),
      role: 'hr_officer'
    });

    if (existingHR) {
      return NextResponse.json({
        success: false,
        message: 'HR admin already exists',
      }, { status: 409 });
    }

    // Create default HR admin
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const hrAdmin = await Employee.create({
      employeeId: 'EMP001',
      firstName: 'HR',
      lastName: 'Admin',
      email: defaultEmail.toLowerCase(),
      phone: '+441234567890',
      password: hashedPassword,
      role: 'hr_officer',
      status: 'active',
    });

    const response = hrAdmin.toObject();
    delete response.password;

    return NextResponse.json({
      success: true,
      message: 'Default HR admin created successfully',
      data: {
        email: defaultEmail,
        password: defaultPassword,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing HR admin:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

