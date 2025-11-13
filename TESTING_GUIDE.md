# Complete Testing Guide

## 🧪 How to Test All Completed Features

This guide provides step-by-step instructions to test all 11 completed use cases.

---

## 📋 Prerequisites

### 1. Start the Development Server
```bash
cd /Users/nc/Desktop/workforce
npm run dev
```

### 2. Access the Application
- Open browser: `http://localhost:3000`
- You'll be redirected to `/login` if not authenticated

### 3. Initialize Test Data (First Time Only)
Visit: `http://localhost:3000/api/v1/init`
- This creates default HR admin user
- Email: `hr@workforce.com`
- Password: `Admin@123`

---

## 👥 Test User Setup

### Step 1: Login as HR Admin
1. Go to `/login`
2. Email: `hr@workforce.com`
3. Password: `Admin@123`
4. Click "Sign In"
5. You'll be redirected to `/hr/dashboard`

### Step 2: Create Test Users

#### A. Create a Site Manager
1. Navigate to `/hr/create-employee` or click "Create Employee"
2. Fill in:
   - **First Name:** John
   - **Last Name:** Smith
   - **Email:** `sitemanager@workforce.com`
   - **Phone:** `+441234567890`
   - **Role:** Site Manager
   - **Password:** `SiteManager123`
   - **Pay Rate:** `15.00`
3. Click "Create Employee"
4. **Important:** Go to `/hr/employees`, find John Smith, click Edit, and assign a Site

#### B. Create a Contracts Manager
1. Navigate to `/hr/create-employee`
2. Fill in:
   - **First Name:** Sarah
   - **Last Name:** Johnson
   - **Email:** `contractsmanager@workforce.com`
   - **Phone:** `+441234567891`
   - **Role:** Contracts Manager
   - **Password:** `ContractsManager123`
   - **Pay Rate:** `25.00`
3. Click "Create Employee"

#### C. Create a Labour Worker
1. Navigate to `/hr/create-employee`
2. Fill in:
   - **First Name:** Mike
   - **Last Name:** Brown
   - **Email:** `labour@workforce.com`
   - **Phone:** `+441234567892`
   - **Role:** Labour
   - **Password:** `Labour123`
   - **Pay Rate:** `12.00`
3. Click "Create Employee"
4. **Important:** Go to `/hr/employees`, find Mike Brown, click Edit, and assign a Site

#### D. Create a Site (if needed)
1. Navigate to `/hr/sites`
2. Click "Create Site"
3. Fill in:
   - **Site Code:** `SITE-001`
   - **Name:** `Construction Site A`
   - **Street:** `123 Main Street`
   - **City:** `London`
   - **Postcode:** `SW1A 1AA`
   - **Latitude:** `51.5074`
   - **Longitude:** `-0.1278`
   - **Contracts Manager:** Select Sarah Johnson
4. Click "Create Site"
5. **Assign Site Manager:** Go to `/hr/employees`, edit John Smith, assign to "Construction Site A"

---

## ✅ Test Checklist

### 1. LB-01: Site Sign-In/Sign-Out

**Test as:** Labour Worker (Mike Brown)

#### Test Sign-In:
1. Logout (if logged in as HR)
2. Go to `/login`
3. Login as:
   - Email: `labour@workforce.com`
   - Password: `Labour123`
4. You'll be redirected to `/attendance/scan`
5. **Test QR Code Scan:**
   - Click "Scan QR Code" button
   - Allow camera permission
   - Scan the QR code displayed at `/hr/qr-display`
   - Should show "Sign In Successful"
   - Should redirect to `/dashboard`

#### Test Sign-Out:
1. On dashboard, click "Sign Out" button
2. Should mark attendance as signed out
3. Should show sign-out time

**Expected Results:**
- ✅ QR code scan works
- ✅ Geolocation validation works
- ✅ Sign-in time recorded
- ✅ Sign-out time recorded
- ✅ Attendance visible in system

---

### 2. SM-01: Daily Site Log

**Test as:** Site Manager (John Smith)

#### Test Create Daily Log:
1. Logout and login as:
   - Email: `sitemanager@workforce.com`
   - Password: `SiteManager123`
2. Navigate to `/site-manager/dashboard`
3. Click "Create Daily Log" or go to `/site-manager/daily-logs`
4. Fill in:
   - **Date:** Today's date
   - **Weather:** `Sunny`
   - **Headcount:** `25`
   - **Planned Headcount:** `30`
   - **Deliveries:** Click "Add Delivery"
     - Material: `Concrete`
     - Docket Number: `DOCK-001`
     - Docket Photo: `https://example.com/photo.jpg`
   - **Issues:** `No issues today`
5. Click "Save" (saves as draft)

#### Test Edit Daily Log:
1. Find the log you just created
2. Click "Edit"
3. Update headcount to `28`
4. Click "Save"

#### Test Lock Daily Log:
1. Find the log
2. Click "Lock"
3. Should change status to "locked"
4. Should not be editable anymore

#### Test Send to Contracts Manager:
1. Click "Send to CM"
2. Should change status to "sent"
3. Should be visible to Contracts Manager

**Expected Results:**
- ✅ Can create daily log
- ✅ Can edit draft logs
- ✅ Can lock log
- ✅ Can send to Contracts Manager
- ✅ Cannot edit locked/sent logs

---

### 3. SM-02: Workforce Attendance Verification

**Test as:** Site Manager (John Smith)

#### Test Attendance Verification:
1. Login as Site Manager
2. Navigate to `/site-manager/attendance-verification`
3. Select a site (if multiple)
4. Select a date (today)
5. Click "Verify Attendance"

**Expected Results:**
- ✅ Shows planned headcount
- ✅ Shows actual headcount
- ✅ Shows attendance percentage
- ✅ Lists present employees
- ✅ Lists missing employees
- ✅ Shows status (good/warning/critical)

---

### 4. SM-03: Material Receipt & PO Auto-Matching

**Test as:** Site Manager (John Smith)

#### Test PO Auto-Matching:
1. First, create a Purchase Order (via API or database):
   ```javascript
   // In MongoDB or via API
   {
     poNumber: "PO-001",
     material: "Concrete",
     siteId: <site_id>,
     status: "pending"
   }
   ```

2. Create a daily log with delivery:
   - Material: `Concrete`
   - Docket Number: `PO-001-DOCK-123`
   - The system should auto-match to PO-001

**Expected Results:**
- ✅ Delivery auto-matches to PO
- ✅ PO match status shows "matched"
- ✅ PO ID linked to delivery

---

### 5. HR-01: Employee On-boarding

**Test as:** HR Officer

#### Test Create Employee:
1. Login as HR (`hr@workforce.com` / `Admin@123`)
2. Navigate to `/hr/create-employee`
3. Fill in employee details:
   - First Name, Last Name, Email, Phone
   - Role: Select any role
   - Password: Set password
   - Pay Rate: Enter amount
4. Click "Create Employee"

**Expected Results:**
- ✅ Employee created successfully
- ✅ Employee appears in `/hr/employees`
- ✅ Can login with created credentials

---

### 6. HR-02: Profile Maintenance

**Test as:** HR Officer

#### Test Edit Employee:
1. Navigate to `/hr/employees`
2. Find an employee
3. Click "Edit" (pencil icon)
4. Update:
   - Phone number
   - Pay rate
   - Site assignment
   - Bank details
5. Click "Save"

**Expected Results:**
- ✅ Employee details updated
- ✅ Changes reflected immediately
- ✅ Can update all fields

---

### 7. HR-03: Leave Balance Management

**Test as:** HR Officer (automatic on approval)

#### Test Leave Balance:
1. First, create a leave request (see LB-03 test)
2. Approve the leave request
3. Check employee's leave balance:
   - Go to `/hr/employees`
   - Find the employee
   - View their profile
   - Check `annualLeaveBalance` field

**Expected Results:**
- ✅ Leave balance auto-updates on approval
- ✅ Balance decreases by number of days
- ✅ Balance tracked correctly

---

### 8. HR-04: Timesheet Approval

**Test as:** HR Officer

#### Test Generate Timesheets:
1. Login as HR
2. Navigate to `/hr/timesheets`
3. Click "Generate All"
4. Should create timesheets for all employees with attendance

#### Test View Timesheet:
1. Find a timesheet in the list
2. Click "View"
3. Should show:
   - Employee details
   - Daily breakdown (Monday-Sunday)
   - Total hours
   - Status

#### Test Approve Timesheet:
1. Open a timesheet
2. Click "Approve Timesheet"
3. Optionally add approval notes
4. Click "Approve"

#### Test Lock Timesheet:
1. After approval, click "Lock for Payroll"
2. Should change status to "locked"
3. Cannot be edited after locking

**Expected Results:**
- ✅ Can generate timesheets
- ✅ Timesheets show correct hours
- ✅ Can approve timesheets
- ✅ Can lock timesheets
- ✅ Locked timesheets cannot be edited

---

### 9. HR-05: Payroll Run & Export

**Test as:** HR Officer

#### Test Create Payroll Run:
1. Navigate to `/hr/payroll`
2. Click "Create Payroll Run"
3. Fill in:
   - **Period Start:** Start of current month
   - **Period End:** End of current month
4. Select locked timesheets
5. Click "Create"

#### Test Calculate Payroll:
1. Open the payroll run
2. Click "Calculate Payroll"
3. Should calculate:
   - Gross pay
   - Tax
   - Net pay
   - Totals

#### Test Export to Sage:
1. After calculation, click "Export to Sage"
2. Select format (CSV or JSON)
3. Click "Export"
4. Should download file

**Expected Results:**
- ✅ Can create payroll run
- ✅ Can calculate payroll
- ✅ Calculations are correct
- ✅ Can export to Sage
- ✅ Export file is valid

---

### 10. LB-03: Leave Request

**Test as:** Labour Worker (Mike Brown)

#### Test Create Leave Request:
1. Login as labour worker
2. Navigate to `/attendance/leave-request`
3. Fill in:
   - **Leave Type:** Annual
   - **Start Date:** Select future date
   - **End Date:** Select end date
   - **Reason:** `Family vacation`
4. Should auto-calculate days (excluding weekends)
5. Click "Submit Leave Request"

#### Test Approve Leave Request:
1. Logout and login as HR
2. Navigate to `/hr/leave-requests`
3. Find the pending request
4. Click "Approve" or "Reject"
5. If approve, check employee's leave balance

**Expected Results:**
- ✅ Can create leave request
- ✅ Days calculated correctly (excluding weekends)
- ✅ Can approve/reject
- ✅ Leave balance updates on approval

---

### 11. CM-01: Multi-Site Dashboard

**Test as:** Contracts Manager (Sarah Johnson)

#### Test Dashboard:
1. Login as Contracts Manager
2. Should redirect to `/contracts-manager/dashboard`
3. Should see:
   - Dashboard totals (headcount, progress, incidents, spend)
   - Site widgets grid
   - Each site showing:
     - Headcount (current/planned)
     - Progress %
     - Incidents count
     - Spend

#### Test Refresh:
1. Click "Refresh" button
2. Should update data

#### Test Site Widget:
1. Click on a site widget
2. Should show detailed information
3. Check alert indicators (if any)

**Expected Results:**
- ✅ Dashboard loads with all sites
- ✅ Widgets show correct data
- ✅ Totals are accurate
- ✅ Refresh works
- ✅ Alerts display correctly

---

## 🔍 Quick Test Script

### Run All Tests in Sequence:

```bash
# 1. Start server
npm run dev

# 2. Initialize (first time only)
# Visit: http://localhost:3000/api/v1/init

# 3. Test Flow:
# - Login as HR → Create test users → Create site → Assign users
# - Login as Labour → Test sign-in/sign-out → Test leave request
# - Login as Site Manager → Test daily log → Test attendance verification
# - Login as HR → Test timesheet approval → Test payroll
# - Login as Contracts Manager → Test dashboard
```

---

## 🐛 Common Issues & Solutions

### Issue: "Employee not found"
**Solution:** Make sure employee exists and is active

### Issue: "Site not assigned"
**Solution:** HR needs to assign site to employee

### Issue: "Cannot create daily log"
**Solution:** Check if log already exists for that date

### Issue: "Timesheet not generating"
**Solution:** Make sure employee has attendance records

### Issue: "Dashboard shows no data"
**Solution:** Make sure sites exist and are active

---

## 📊 Test Results Template

Use this to track your testing:

```
✅ LB-01: Site Sign-In/Sign-Out - [PASS/FAIL]
✅ SM-01: Daily Site Log - [PASS/FAIL]
✅ SM-02: Workforce Attendance Verification - [PASS/FAIL]
✅ SM-03: Material Receipt & PO Auto-Matching - [PASS/FAIL]
✅ HR-01: Employee On-boarding - [PASS/FAIL]
✅ HR-02: Profile Maintenance - [PASS/FAIL]
✅ HR-03: Leave Balance Management - [PASS/FAIL]
✅ HR-04: Timesheet Approval - [PASS/FAIL]
✅ HR-05: Payroll Run & Export - [PASS/FAIL]
✅ LB-03: Leave Request - [PASS/FAIL]
✅ CM-01: Multi-Site Dashboard - [PASS/FAIL]
```

---

## 🎯 Next Steps After Testing

1. **Fix any bugs found**
2. **Document issues**
3. **Proceed with CM-03: Exception Alert Review**

---

**Happy Testing! 🚀**

