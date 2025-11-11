# Quick Setup Guide

## Your MongoDB Connection is Ready! 🎉

Your MongoDB Atlas connection string has been configured.

## Quick Start (3 Steps)

### Step 1: Create Environment File

Run this command to create your `.env.local` file:

```bash
bash setup-env.sh
```

Or manually create `.env.local` with this content:

```env
# MongoDB Connection (MongoDB Atlas)
MONGODB_URI=mongodb+srv://bilal002ta_db_user:1n9GS5zvaDWAgKBy@cluster0.eaatg0a.mongodb.net/workforce?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3NRkg2RkIrgTjQ9SuIUP6j0cI2LkCckjAg/HQx/xbrQ=

# Default HR Admin Credentials
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

### Step 2: Install Dependencies & Start

```bash
npm install
npm run dev
```

### Step 3: Initialize HR Admin

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/v1/init
```

Or visit: `http://localhost:3000/api/v1/init` in your browser.

## Login

1. Go to: `http://localhost:3000/login`
2. Use credentials:
   - **Email:** `hr@workforce.com`
   - **Password:** `Admin@123`

## That's It! 🚀

You're ready to:
- ✅ Create employees
- ✅ Manage your workforce
- ✅ Start building the QR attendance system

---

**Note:** Make sure your MongoDB Atlas cluster allows connections from your IP address. If you get connection errors, check your Atlas Network Access settings.

