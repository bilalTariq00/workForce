# 🧪 Complete Testing Guide

## 🚀 Quick Start Testing

### Step 1: Check Environment Setup

Make sure you have a `.env.local` file with these variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Default HR Admin
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123

# Cloudinary (for file uploads)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

### Step 2: Start the Server

The dev server should be running at `http://localhost:3000`

If not, run:
```bash
npm run dev
```

### Step 3: Initialize HR Admin

Visit: `http://localhost:3000/api/v1/init`

This creates the default HR admin user.

---

## 📋 Complete Feature Testing Checklist

### 🔐 Authentication & Login

#### Test 1: HR Admin Login
- [ ] Go to `/login`
- [ ] Login with: `hr@workforce.com` / `Admin@123`
- [ ] Should redirect to HR dashboard
- [ ] Check mobile responsiveness (resize browser)

#### Test 2: Employee Login
- [ ] Create an employee first (see HR tests below)
- [ ] Logout
- [ ] Login with employee credentials
- [ ] Should redirect to appropriate dashboard based on role

---

### 👥 HR Module Testing

#### HR-01: Employee Onboarding
- [ ] Go to `/hr/employees`
- [ ] Click "Create Employee"
- [ ] Fill form:
  - First Name: "John"
  - Last Name: "Doe"
  - Email: "john.doe@test.com"
  - Phone: "+1234567890"
  - Role: "labour" (or "site_manager", "contracts_manager")
  - Password: "Test123!"
  - Pay Rate: "25.00"
- [ ] Submit form
- [ ] Verify employee appears in list
- [ ] Test mobile view (resize browser)

#### HR-02: Profile Maintenance
- [ ] Go to `/hr/employees`
- [ ] Click "Edit" on an employee
- [ ] Update phone number or pay rate
- [ ] Save changes
- [ ] Verify changes saved

#### HR-03: Leave Balance Management (Automatic)
- [ ] This is automatic - no manual testing needed
- [ ] System updates balances when leave is approved/rejected

#### HR-04: Timesheet Approval
- [ ] Go to `/hr/timesheets`
- [ ] Click "Generate All" to create timesheets
- [ ] View a timesheet
- [ ] Approve or reject
- [ ] Test mobile card view

#### HR-05: Payroll Run & Export
- [ ] Go to `/hr/payroll`
- [ ] Click "Create Payroll Run"
- [ ] Select period dates
- [ ] Create run
- [ ] Click "Calculate" on draft run
- [ ] Click "Export CSV" on calculated run
- [ ] Verify CSV downloads

#### HR-06: Certification Tracking
- [ ] Go to `/hr/certifications`
- [ ] View all certifications
- [ ] Click "Validate" on pending certification
- [ ] Approve or reject
- [ ] Test mobile view

---

### 👷 Labour/Tradesperson Module Testing

#### LB-01: Site Sign-In/Sign-Out
- [ ] Login as labour employee
- [ ] Go to `/attendance/scan`
- [ ] Test QR code scanner (or manual entry)
- [ ] Sign in to a site
- [ ] Verify attendance recorded
- [ ] Sign out
- [ ] Test mobile view

#### LB-03: Leave Request
- [ ] Go to `/attendance/leave-request`
- [ ] Fill leave request form:
  - Type: "Annual Leave"
  - Start Date: Future date
  - End Date: Future date
  - Reason: "Vacation"
- [ ] Submit
- [ ] Verify request appears in HR dashboard
- [ ] Test mobile view

#### LB-06: Certification Upload
- [ ] Go to `/attendance/certifications`
- [ ] Click "Upload Certification"
- [ ] Fill form:
  - Type: "SafePass" or "CSCS"
  - Issue Date: Past date
  - Expiry Date: Future date
  - Upload document (PDF/JPG/PNG)
- [ ] Submit
- [ ] Verify upload successful
- [ ] Check document URL (should be Cloudinary or local)
- [ ] Test mobile view

---

### 🏗️ Site Manager Module Testing

#### SM-01: Daily Site Log
- [ ] Login as site manager
- [ ] Go to `/site-manager/daily-logs`
- [ ] Click "Create Daily Log"
- [ ] Fill form:
  - Weather: "Sunny"
  - Headcount: "25"
  - Add delivery (material, docket number, photo URL)
  - Issues: "No issues"
- [ ] Submit
- [ ] Verify log appears in list
- [ ] Test mobile view

#### SM-02: Attendance Verification
- [ ] Go to `/site-manager/attendance-verification`
- [ ] View planned vs actual attendance
- [ ] Flag missing workers if needed
- [ ] Test mobile view

#### SM-03: Material Receipt & Docket Match
- [ ] This is part of Daily Log
- [ ] Add delivery in daily log
- [ ] Set PO match status
- [ ] Verify delivery appears

#### SM-06: Variation/Change Order
- [ ] Go to `/site-manager/variations`
- [ ] Click "Create Variation"
- [ ] Fill form:
  - Title: "Additional Foundation Work"
  - Description: "Extra foundation required"
  - Cost: "5000"
  - Delay Days: "3"
- [ ] Save as draft
- [ ] Click "Submit" to send for approval
- [ ] Test mobile view

---

### 📊 Contracts Manager Module Testing

#### CM-01: Multi-Site Dashboard
- [ ] Login as contracts manager
- [ ] Go to `/contracts-manager/dashboard`
- [ ] View all sites
- [ ] Check widgets show:
  - Headcount
  - Progress %
  - Incidents
  - Spend
- [ ] Click on a site to view details
- [ ] Test mobile view

#### CM-02: Resource Re-Allocation
- [ ] Go to `/contracts-manager/resource-allocation`
- [ ] Click "Create Reallocation"
- [ ] Fill form:
  - From Site: Select site
  - To Site: Select another site
  - Resource Type: "crew" or "plant"
  - Select employees or plant
  - Reason: "Resource needed"
- [ ] Submit
- [ ] Approve the request
- [ ] Test mobile view

#### CM-03: Exception Alert Review
- [ ] Go to `/contracts-manager/alerts`
- [ ] View alerts
- [ ] Click "Generate Alerts" to create alerts
- [ ] Acknowledge or resolve alerts
- [ ] Test filters (status, severity, type)
- [ ] Test mobile view

#### CM-04: Variation Approval
- [ ] Go to `/contracts-manager/variations`
- [ ] View pending variations
- [ ] Click "Review" on a pending variation
- [ ] Approve or reject
- [ ] Add commercial notes if approving
- [ ] Test mobile view

---

### 🛡️ EHS Module Testing

#### EHS-01: Incident Triage & Investigation
- [ ] Login as EHS officer (or labour/site manager)
- [ ] Go to `/attendance/incidents` (to report)
- [ ] Click "Report New Incident"
- [ ] Fill form:
  - Type: "Injury" or "Near Miss"
  - Severity: "Minor" or "Major"
  - Description: "Test incident"
  - Location: "Site A"
  - Upload photo (optional)
- [ ] Submit
- [ ] Login as EHS officer
- [ ] Go to `/ehs/incidents`
- [ ] View incident
- [ ] Assign to EHS officer
- [ ] Add corrective actions
- [ ] Change status (investigating → resolved → closed)
- [ ] Test mobile view

#### EHS-02: Site Inspection & Checklist
- [ ] Go to `/ehs/inspections`
- [ ] Click "Create Inspection"
- [ ] Fill form:
  - Site: Select site
  - Inspector: Select EHS officer
  - Date: Today
  - Add checklist items
- [ ] Submit
- [ ] View inspection
- [ ] Add issues
- [ ] Mark issues as resolved
- [ ] Complete inspection
- [ ] Test mobile view

#### EHS-03: Training Register
- [ ] Go to `/ehs/training`
- [ ] Click "Assign Training"
- [ ] Fill form:
  - Employee: Select employee
  - Type: "Safety Training"
  - Due Date: Future date
  - Expiry Date: Future date
- [ ] Submit
- [ ] View training records
- [ ] Filter by status (pending, completed, overdue)
- [ ] Test mobile view

---

## 📱 Mobile Responsiveness Testing

### Test on Different Screen Sizes

1. **Mobile (375px - 640px)**
   - [ ] Sidebar should be hidden (hamburger menu)
   - [ ] Tables should show as cards
   - [ ] Buttons should be touch-friendly (min 44px height)
   - [ ] Forms should stack vertically
   - [ ] Text should be readable (min 14px)

2. **Tablet (641px - 1024px)**
   - [ ] Sidebar can be toggled
   - [ ] Grid layouts should be 2 columns
   - [ ] Forms can be 2 columns where appropriate

3. **Desktop (1025px+)**
   - [ ] Full sidebar visible
   - [ ] Tables visible
   - [ ] Multi-column layouts

### Test These Pages on Mobile:
- [ ] `/login`
- [ ] `/attendance/scan`
- [ ] `/attendance/leave-request`
- [ ] `/attendance/certifications`
- [ ] `/hr/employees`
- [ ] `/hr/timesheets`
- [ ] `/hr/payroll`
- [ ] `/site-manager/daily-logs`
- [ ] `/site-manager/variations`
- [ ] `/contracts-manager/dashboard`
- [ ] `/contracts-manager/variations`
- [ ] `/contracts-manager/alerts`
- [ ] `/ehs/incidents`
- [ ] `/ehs/inspections`
- [ ] `/ehs/training`

---

## 🔍 Common Issues & Fixes

### Issue: "Cannot connect to MongoDB"
**Fix:** Check `MONGODB_URI` in `.env.local`

### Issue: "NextAuth error"
**Fix:** Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in `.env.local`

### Issue: "File upload not working"
**Fix:** Check `CLOUDINARY_URL` in `.env.local` or ensure `public/uploads` directory exists

### Issue: "404 on routes"
**Fix:** Make sure server is running and routes exist

### Issue: "Mobile view not responsive"
**Fix:** Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All HR features work
- [ ] All Labour features work
- [ ] All Site Manager features work
- [ ] All Contracts Manager features work
- [ ] All EHS features work
- [ ] Mobile responsiveness verified on all pages
- [ ] File uploads work (certifications, incident photos)
- [ ] Authentication works for all roles
- [ ] Dashboards load correctly
- [ ] Forms validate correctly
- [ ] Alerts generate correctly
- [ ] No console errors in browser
- [ ] No server errors in terminal

---

## 🐛 Reporting Issues

If you find issues:

1. Check browser console for errors
2. Check server terminal for errors
3. Note the exact steps to reproduce
4. Note your role and the page you're on
5. Check if it's a mobile-specific issue

---

**Happy Testing! 🎉**
