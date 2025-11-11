# Setup Instructions - HR Management System

## Prerequisites

- Node.js 18+ installed
- MongoDB running (local or Atlas)
- npm or yarn package manager

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Setup

Create a `.env.local` file in the root directory:

```env
# MongoDB Connection
# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce?retryWrites=true&w=majority
# For local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/workforce

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Default HR Admin Credentials (change after first login)
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

**To generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Step 3: Initialize Default HR Admin

After starting the server, you can initialize the default HR admin by calling:

```bash
curl -X POST http://localhost:3000/api/v1/init
```

Or visit: `http://localhost:3000/api/v1/init` in your browser.

This will create the default HR admin user with:
- Email: `hr@workforce.com` (or from DEFAULT_HR_EMAIL)
- Password: `Admin@123` (or from DEFAULT_HR_PASSWORD)

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 5: Login

1. Go to `http://localhost:3000/login`
2. Use the default HR credentials:
   - Email: `hr@workforce.com`
   - Password: `Admin@123`

## Step 6: Create Employees

Once logged in as HR:
1. Click "Create Employee" button
2. Fill in the form:
   - First Name, Last Name
   - Email (unique)
   - Phone Number
   - Role (Labour, Site Manager, Contracts Manager, etc.)
   - Password (for the employee to login)
   - Pay Rate (optional)
3. Click "Create Employee"

## Step 7: Employee Login

Created employees can now login using:
- Their email address
- The password set by HR

They will be redirected to their respective dashboards based on their role.

## Features Implemented

✅ HR Login System
✅ HR Dashboard with Statistics
✅ Create Employee (with all roles)
✅ Employee List View (Mobile & Desktop responsive)
✅ Employee Login
✅ Role-based Access Control
✅ Mobile-First Responsive Design

## Next Steps

After completing this phase, you can proceed to:
- QR Code Attendance System
- Site Management
- Leave Requests
- And other features from the use case document

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in `.env.local`
- For Atlas, ensure IP is whitelisted

### Authentication Issues
- Check NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### Build Errors
- Delete `.next` folder and `node_modules`
- Run `npm install` again
- Check Node.js version (18+)

