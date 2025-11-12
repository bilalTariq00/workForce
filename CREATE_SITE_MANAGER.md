# How to Create and Login as Site Manager

## Overview

There are **no default Site Manager credentials**. Site Managers must be created by HR first, then they can login with the credentials HR sets.

## Step-by-Step Guide

### Step 1: Login as HR Admin

1. Go to `/login`
2. Use HR credentials:
   - **Email:** `hr@workforce.com`
   - **Password:** `Admin@123`

   *(If HR admin doesn't exist, initialize it first: visit `/api/v1/init`)*

### Step 2: Create a Site Manager Employee

1. Once logged in as HR, go to **"Create Employee"** (or `/hr/create-employee`)
2. Fill in the form:
   - **First Name:** e.g., "John"
   - **Last Name:** e.g., "Smith"
   - **Email:** e.g., `site.manager@workforce.com` (must be unique)
   - **Phone:** e.g., `+441234567890`
   - **Role:** Select **"Site Manager"**
   - **Password:** Set a password (e.g., `SiteManager123`)
   - **Pay Rate:** (optional)
3. Click **"Create Employee"**

### Step 3: Assign Site Manager to a Site

1. Go to **"Sites"** (or `/hr/sites`)
2. If no site exists, create one first:
   - Click **"Create Site"**
   - Fill in site details (name, address, GPS coordinates, etc.)
   - Assign a Contracts Manager
   - Save
3. Go to **"Employees"** (or `/hr/employees`)
4. Find the Site Manager you just created
5. Click **Edit** (pencil icon)
6. In the edit form, assign a **Site** (select from dropdown)
7. Save

### Step 4: Login as Site Manager

1. Go to `/login`
2. Use the credentials HR set:
   - **Email:** The email you used when creating the employee (e.g., `site.manager@workforce.com`)
   - **Password:** The password HR set (e.g., `SiteManager123`)
3. You'll be automatically redirected to `/site-manager/dashboard`

## Quick Test Credentials

If you want to quickly test, create a Site Manager with these credentials:

**Email:** `sitemanager@workforce.com`  
**Password:** `SiteManager123`

Then assign them to a site.

## Common Issues

### "You are not assigned to any site"
**Solution:** HR needs to assign you to a site
1. HR goes to `/hr/employees`
2. Finds your employee record
3. Edits and assigns a `siteId`

### "CredentialsSignin" Error
**Possible causes:**
1. Employee doesn't exist - HR needs to create it first
2. Wrong email/password - Use the exact credentials HR set
3. Email case sensitivity - Try lowercase email

### Can't see Site Manager Dashboard
**Check:**
1. Your role is `site_manager` in the database
2. You have a `siteId` assigned
3. The site exists and is active

## Example: Complete Setup

```bash
# 1. Login as HR
Email: hr@workforce.com
Password: Admin@123

# 2. Create Site Manager
- First Name: John
- Last Name: Smith
- Email: john.smith@workforce.com
- Role: Site Manager
- Password: Test123!

# 3. Create Site (if needed)
- Name: Construction Site A
- Address: 123 Main St, London, SW1A 1AA
- Latitude: 51.5074
- Longitude: -0.1278
- Contracts Manager: (select one)

# 4. Assign Site Manager to Site
- Go to Employees
- Edit John Smith
- Assign to "Construction Site A"

# 5. Login as Site Manager
Email: john.smith@workforce.com
Password: Test123!
```

## Database Check (Optional)

If you want to verify in MongoDB:

```javascript
// Check if Site Manager exists
db.employees.find({ role: "site_manager" })

// Check if Site Manager has siteId
db.employees.find({ 
  role: "site_manager",
  siteId: { $exists: true, $ne: null }
})
```

## Summary

1. ✅ Login as HR (`hr@workforce.com` / `Admin@123`)
2. ✅ Create Site Manager employee
3. ✅ Create Site (if needed)
4. ✅ Assign Site Manager to Site
5. ✅ Login as Site Manager with HR-set credentials
6. ✅ Access `/site-manager/dashboard`

---

**Note:** Site Managers don't need to mark attendance (unlike labour workers). They go directly to their dashboard.


