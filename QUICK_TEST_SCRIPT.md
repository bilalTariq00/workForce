# Quick Test Script - Step by Step

## 🚀 Fast Testing Guide (30 minutes)

Follow these steps in order to quickly test all features.

---

## Step 1: Setup (5 minutes)

### 1.1 Start Server
```bash
cd /Users/nc/Desktop/workforce
npm run dev
```

### 1.2 Initialize System
1. Open browser: `http://localhost:3000/api/v1/init`
2. Wait for success message
3. Default HR credentials created:
   - Email: `hr@workforce.com`
   - Password: `Admin@123`

### 1.3 Create Test Data
1. Login as HR: `http://localhost:3000/login`
2. Create a Site:
   - Go to `/hr/sites`
   - Click "Create Site"
   - Fill in: Site Code, Name, Address, GPS (51.5074, -0.1278)
   - Save

3. Create Test Users:
   - **Site Manager**: 
     - Email: `sitemanager@workforce.com`
     - Password: `SiteManager123`
     - Role: Site Manager
     - Assign to site
   
   - **Contracts Manager**:
     - Email: `contractsmanager@workforce.com`
     - Password: `ContractsManager123`
     - Role: Contracts Manager
   
   - **Labour Worker**:
     - Email: `labour@workforce.com`
     - Password: `Labour123`
     - Role: Labour
     - Assign to site
     - Set pay rate: 12.00
     - Set annual leave balance: 25

---

## Step 2: Test Labour Features (5 minutes)

### 2.1 Test Sign-In/Sign-Out
1. Logout and login as `labour@workforce.com`
2. Should redirect to `/attendance/scan`
3. **Get QR Code**:
   - Open new tab, login as HR
   - Go to `/hr/qr-display`
   - Copy QR code or scan it
4. **Sign In**:
   - Scan QR code or enter manually
   - Verify success message
5. **Sign Out**:
   - Click "Sign Out" button
   - Verify sign-out recorded

### 2.2 Test Leave Request
1. Still logged in as labour
2. Go to `/attendance/leave-request`
3. Fill in:
   - Type: Annual
   - Start: Next Monday
   - End: Next Friday
   - Reason: "Test leave"
4. Verify days = 5 (excluding weekends)
5. Submit
6. Verify request created

---

## Step 3: Test Site Manager Features (5 minutes)

### 3.1 Test Daily Log
1. Logout and login as `sitemanager@workforce.com`
2. Go to `/site-manager/dashboard`
3. Create daily log:
   - Date: Today
   - Weather: "Sunny"
   - Headcount: 25
   - Planned: 30
   - Add delivery: "Concrete", "DOCK-001"
   - Issues: "None"
4. Save → Lock → Send
5. Verify in `/site-manager/daily-logs`

### 3.2 Test Attendance Verification
1. Go to `/site-manager/attendance-verification`
2. Select site and today's date
3. Click "Verify"
4. Verify shows planned vs actual

---

## Step 4: Test HR Features (10 minutes)

### 4.1 Test Leave Approval
1. Logout and login as HR
2. Go to `/hr/leave-requests`
3. Find pending request from Step 2.2
4. Click "Approve"
5. Verify employee's leave balance decreased

### 4.2 Test Timesheet Approval
1. Go to `/hr/timesheets`
2. Click "Generate All"
3. Wait for timesheets to generate
4. Click "View" on a timesheet
5. Verify shows daily breakdown
6. Click "Approve"
7. Click "Lock for Payroll"
8. Verify status changed

### 4.3 Test Payroll
1. Go to `/hr/payroll`
2. Click "Create Payroll Run"
3. Select period (current month)
4. Select locked timesheet
5. Create
6. Open payroll run
7. Click "Calculate Payroll"
8. Verify calculations
9. Click "Export to Sage"
10. Select CSV format
11. Verify file downloads

---

## Step 5: Test Contracts Manager Features (5 minutes)

### 5.1 Test Dashboard
1. Logout and login as `contractsmanager@workforce.com`
2. Should redirect to `/contracts-manager/dashboard`
3. Verify:
   - Dashboard totals show
   - Site widgets display
   - Alert widget shows (if alerts exist)
4. Click "Refresh"
5. Verify data updates

### 5.2 Test Alerts
1. Go to `/contracts-manager/alerts`
2. Click "Generate Alerts"
3. Verify alerts created:
   - Missed daily log (if after 5 PM and no log)
   - Low attendance (if attendance < 80%)
   - Missing timesheet (if no timesheet)
4. Test filters (status, severity, type)
5. Click "Acknowledge" on an alert
6. Add notes, click "Acknowledge"
7. Verify status changed
8. Click "Resolve" on an alert
9. Add notes, click "Resolve"
10. Verify status changed

---

## Step 6: Test Additional Features (5 minutes)

### 6.1 Test Profile Maintenance
1. Login as HR
2. Go to `/hr/employees`
3. Find an employee
4. Click "Edit"
5. Update phone, pay rate, site
6. Save
7. Verify changes saved

### 6.2 Test PO Auto-Matching
1. Create Purchase Order (if API available)
2. Login as Site Manager
3. Create daily log with delivery matching PO
4. Verify auto-match works

---

## ✅ Quick Verification Checklist

- [ ] All 12 features tested
- [ ] No critical errors
- [ ] All workflows complete end-to-end
- [ ] Data persists correctly
- [ ] Role-based access works
- [ ] UI responsive on mobile
- [ ] API endpoints work

---

## 🐛 If You Find Issues

1. **Note the issue**: What happened vs what should happen
2. **Steps to reproduce**: Exact steps that caused the issue
3. **Screenshot**: If possible
4. **Browser/OS**: Note your environment
5. **Fix or document**: Either fix it or add to bug list

---

## 📊 Test Results

After testing, fill this out:

```
✅ LB-01: Site Sign-In/Sign-Out - [PASS/FAIL]
✅ HR-01: Employee On-boarding - [PASS/FAIL]
✅ SM-01: Daily Site Log - [PASS/FAIL]
✅ SM-02: Workforce Attendance Verification - [PASS/FAIL]
✅ HR-04: Timesheet Approval - [PASS/FAIL]
✅ CM-01: Multi-Site Dashboard - [PASS/FAIL]
✅ LB-03: Leave Request - [PASS/FAIL]
✅ HR-05: Payroll Run & Export - [PASS/FAIL]
✅ CM-03: Exception Alert Review - [PASS/FAIL]
✅ SM-03: Material Receipt & PO Auto-Matching - [PASS/FAIL]
✅ HR-02: Profile Maintenance - [PASS/FAIL]
✅ HR-03: Leave Balance Management - [PASS/FAIL] (auto-tested with LB-03)

Issues Found: ___________
```

---

**Ready to start testing? Follow the steps above! 🚀**

