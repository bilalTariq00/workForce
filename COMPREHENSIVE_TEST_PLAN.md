# Comprehensive Test Plan - All Completed Features

## 🧪 Testing All 12 Completed Use Cases

This guide provides a systematic approach to test all completed features for quality assurance.

---

## 📋 Prerequisites

### 1. Start Development Server
```bash
cd /Users/nc/Desktop/workforce
npm run dev
```

### 2. Initialize System (First Time Only)
Visit: `http://localhost:3000/api/v1/init`
- Creates default HR admin
- Email: `hr@workforce.com`
- Password: `Admin@123`

### 3. Test Data Setup
You'll need to create test users and sites as you go through the tests.

---

## ✅ Test Checklist

### **Sprint-1 Features**

#### ✅ Test 1: LB-01 - Site Sign-In/Sign-Out

**Setup:**
1. Login as HR (`hr@workforce.com` / `Admin@123`)
2. Create a Site:
   - Go to `/hr/sites`
   - Create site with GPS coordinates (e.g., 51.5074, -0.1278)
3. Create a Labour Worker:
   - Go to `/hr/create-employee`
   - Role: Labour
   - Email: `labour@workforce.com`
   - Password: `Labour123`
   - Assign to the site you created

**Test Steps:**
- [ ] Logout and login as labour worker
- [ ] Should redirect to `/attendance/scan`
- [ ] Click "Scan QR Code"
- [ ] Allow camera permission
- [ ] Get QR code from `/hr/qr-display` (login as HR first)
- [ ] Scan QR code or enter manually
- [ ] Verify sign-in successful message
- [ ] Check attendance is recorded
- [ ] Test sign-out functionality
- [ ] Verify sign-out time is recorded

**Expected Results:**
- ✅ QR scan works
- ✅ Geolocation validation works
- ✅ Sign-in time recorded
- ✅ Sign-out time recorded
- ✅ Attendance visible in system

**API Test:**
```bash
# Check attendance
curl http://localhost:3000/api/v1/attendance?employeeId=<employee_id>
```

---

#### ✅ Test 2: HR-01 - Employee On-boarding

**Test Steps:**
- [ ] Login as HR
- [ ] Go to `/hr/create-employee`
- [ ] Fill in all fields:
  - First Name, Last Name
  - Email (unique)
  - Phone
  - Role (test all roles: labour, site_manager, contracts_manager, hr_officer, ehs_officer)
  - Password
  - Pay Rate
- [ ] Click "Create Employee"
- [ ] Verify employee appears in `/hr/employees`
- [ ] Test login with created credentials

**Expected Results:**
- ✅ Employee created successfully
- ✅ All roles can be created
- ✅ Employee appears in list
- ✅ Can login with created credentials

**API Test:**
```bash
# Create employee via API
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@workforce.com","phone":"+441234567890","role":"labour","password":"Test123","payRate":12.00}'
```

---

#### ✅ Test 3: Core Platform - Authentication & RBAC

**Test Steps:**
- [ ] Test login with different roles
- [ ] Verify role-based redirects:
  - HR → `/hr/dashboard`
  - Site Manager → `/site-manager/dashboard`
  - Contracts Manager → `/contracts-manager/dashboard`
  - Labour → `/attendance/scan`
- [ ] Test unauthorized access:
  - Try accessing `/hr/timesheets` as labour (should fail)
  - Try accessing `/contracts-manager/dashboard` as site manager (should fail)
- [ ] Test logout functionality

**Expected Results:**
- ✅ Role-based redirects work
- ✅ Unauthorized access blocked
- ✅ Logout works correctly

---

### **Sprint-2 Features**

#### ✅ Test 4: SM-01 - Daily Site Log

**Setup:**
1. Create Site Manager (as HR)
2. Assign Site Manager to a site

**Test Steps:**
- [ ] Login as Site Manager
- [ ] Go to `/site-manager/dashboard`
- [ ] Create daily log:
  - Date: Today
  - Weather: "Sunny"
  - Headcount: 25
  - Planned Headcount: 30
  - Add delivery:
    - Material: "Concrete"
    - Docket Number: "DOCK-001"
    - Docket Photo: "https://example.com/photo.jpg"
  - Issues: "No issues"
- [ ] Save as draft
- [ ] Edit the draft log
- [ ] Lock the log
- [ ] Send to Contracts Manager
- [ ] Verify log appears in `/site-manager/daily-logs`
- [ ] Try to edit locked log (should fail)

**Expected Results:**
- ✅ Can create daily log
- ✅ Can edit draft logs
- ✅ Can lock log
- ✅ Can send to Contracts Manager
- ✅ Cannot edit locked/sent logs
- ✅ One log per site per day enforced

**API Test:**
```bash
# List daily logs
curl http://localhost:3000/api/v1/daily-logs

# Get single log
curl http://localhost:3000/api/v1/daily-logs/<log_id>
```

---

#### ✅ Test 5: SM-02 - Workforce Attendance Verification

**Test Steps:**
- [ ] Login as Site Manager
- [ ] Go to `/site-manager/attendance-verification`
- [ ] Select site
- [ ] Select date (today)
- [ ] Click "Verify Attendance"
- [ ] Verify displays:
  - Planned headcount
  - Actual headcount
  - Attendance percentage
  - Present employees list
  - Missing employees list
  - Status (good/warning/critical)

**Expected Results:**
- ✅ Shows planned vs actual headcount
- ✅ Calculates attendance percentage correctly
- ✅ Lists present and missing employees
- ✅ Status reflects attendance level

**API Test:**
```bash
# Get attendance verification
curl http://localhost:3000/api/v1/sites/<site_id>/attendance-verification?date=2024-01-15
```

---

#### ✅ Test 6: HR-04 - Timesheet Approval

**Setup:**
1. Ensure labour workers have attendance records
2. Login as HR

**Test Steps:**
- [ ] Go to `/hr/timesheets`
- [ ] Click "Generate All"
- [ ] Verify timesheets created for employees with attendance
- [ ] Click "View" on a timesheet
- [ ] Verify displays:
  - Employee details
  - Daily breakdown (Monday-Sunday)
  - Total hours
  - Status
- [ ] Click "Approve Timesheet"
  - Add approval notes (optional)
  - Click "Approve"
- [ ] Verify status changed to "approved"
- [ ] Click "Lock for Payroll"
- [ ] Verify status changed to "locked"
- [ ] Try to regenerate locked timesheet (should fail)

**Expected Results:**
- ✅ Can generate timesheets
- ✅ Timesheets show correct hours from attendance
- ✅ Can approve timesheets
- ✅ Can lock timesheets
- ✅ Locked timesheets cannot be edited

**API Test:**
```bash
# Generate timesheet
curl -X POST http://localhost:3000/api/v1/timesheets \
  -H "Content-Type: application/json" \
  -d '{"generateForAll": true}'

# Approve timesheet
curl -X POST http://localhost:3000/api/v1/timesheets/<timesheet_id>/approve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved"}'
```

---

### **Sprint-3 Features**

#### ✅ Test 7: CM-01 - Multi-Site Dashboard

**Setup:**
1. Create Contracts Manager (as HR)
2. Create multiple sites
3. Assign sites to Contracts Manager

**Test Steps:**
- [ ] Login as Contracts Manager
- [ ] Should redirect to `/contracts-manager/dashboard`
- [ ] Verify dashboard displays:
  - Dashboard totals (headcount, progress, incidents, spend, alerts)
  - Site widgets grid
  - Each site showing:
    - Headcount (current/planned)
    - Progress %
    - Incidents count
    - Spend
    - Alert indicators
- [ ] Click "Refresh" button
- [ ] Verify data updates
- [ ] Click on "Active Alerts" widget
- [ ] Should navigate to alerts page

**Expected Results:**
- ✅ Dashboard loads with all sites
- ✅ Widgets show correct data
- ✅ Totals are accurate
- ✅ Refresh works
- ✅ Alert indicators display
- ✅ Links work correctly

**API Test:**
```bash
# Get dashboard data
curl http://localhost:3000/api/v1/dashboard/multi-site
```

---

#### ✅ Test 8: LB-03 - Leave Request

**Setup:**
1. Create Labour Worker with annual leave balance (e.g., 25 days)

**Test Steps:**
- [ ] Login as labour worker
- [ ] Go to `/attendance/leave-request`
- [ ] Fill in leave request:
  - Leave Type: Annual
  - Start Date: Future date
  - End Date: End date
  - Reason: "Family vacation"
- [ ] Verify days calculated (excluding weekends)
- [ ] Submit leave request
- [ ] Logout and login as HR
- [ ] Go to `/hr/leave-requests`
- [ ] Find the pending request
- [ ] Click "Approve"
- [ ] Verify employee's leave balance decreased
- [ ] Test rejection workflow

**Expected Results:**
- ✅ Can create leave request
- ✅ Days calculated correctly (excluding weekends)
- ✅ Can approve/reject
- ✅ Leave balance updates on approval
- ✅ Overlap checking works

**API Test:**
```bash
# Create leave request
curl -X POST http://localhost:3000/api/v1/leave-requests \
  -H "Content-Type: application/json" \
  -d '{"type":"annual","startDate":"2024-02-01","endDate":"2024-02-05","reason":"Vacation"}'

# Approve leave request
curl -X POST http://localhost:3000/api/v1/leave-requests/<request_id>/approve \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved"}'
```

---

#### ✅ Test 9: HR-05 - Payroll Run & Export

**Setup:**
1. Ensure locked timesheets exist
2. Login as HR

**Test Steps:**
- [ ] Go to `/hr/payroll`
- [ ] Click "Create Payroll Run"
- [ ] Fill in:
  - Period Start: Start of current month
  - Period End: End of current month
- [ ] Select locked timesheets
- [ ] Click "Create"
- [ ] Open the payroll run
- [ ] Click "Calculate Payroll"
- [ ] Verify calculations:
  - Gross pay = payRate × totalHours
  - Tax calculated
  - Net pay calculated
  - Totals calculated
- [ ] Click "Export to Sage"
- [ ] Select format (CSV or JSON)
- [ ] Click "Export"
- [ ] Verify file downloads

**Expected Results:**
- ✅ Can create payroll run
- ✅ Can calculate payroll
- ✅ Calculations are correct
- ✅ Can export to Sage
- ✅ Export file is valid

**API Test:**
```bash
# Create payroll run
curl -X POST http://localhost:3000/api/v1/payroll-runs \
  -H "Content-Type: application/json" \
  -d '{"periodStart":"2024-01-01","periodEnd":"2024-01-31","timesheets":["<timesheet_id>"]}'

# Calculate payroll
curl -X POST http://localhost:3000/api/v1/payroll-runs/<run_id>/calculate
```

---

#### ✅ Test 10: CM-03 - Exception Alert Review

**Setup:**
1. Login as Contracts Manager
2. Ensure sites exist with some issues (missing daily log, low attendance, etc.)

**Test Steps:**
- [ ] Go to `/contracts-manager/alerts`
- [ ] Click "Generate Alerts"
- [ ] Verify alerts created:
  - Missed daily log alerts (if no log after 5 PM)
  - Low attendance alerts (if attendance < 80%)
  - Missing timesheet alerts (if no timesheet)
- [ ] Verify alert counts display correctly
- [ ] Test filters:
  - Filter by status (active, acknowledged, resolved)
  - Filter by severity (critical, warning, info)
  - Filter by type (missed_daily_log, low_attendance, etc.)
- [ ] Click "Acknowledge" on an alert
  - Add notes (optional)
  - Click "Acknowledge"
- [ ] Verify status changed to "acknowledged"
- [ ] Click "Resolve" on an alert
  - Add notes (optional)
  - Click "Resolve"
- [ ] Verify status changed to "resolved"
- [ ] Go to `/contracts-manager/dashboard`
- [ ] Verify "Active Alerts" widget shows count
- [ ] Verify site widgets show alert badges
- [ ] Click on alert widget/link
- [ ] Should navigate to filtered alerts page

**Expected Results:**
- ✅ Can generate alerts
- ✅ Alerts created for issues
- ✅ Can filter alerts
- ✅ Can acknowledge alerts
- ✅ Can resolve alerts
- ✅ Dashboard integration works
- ✅ Auto-resolution works (when conditions improve)

**API Test:**
```bash
# Generate alerts
curl -X POST http://localhost:3000/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '{"action": "generate"}'

# List alerts
curl http://localhost:3000/api/v1/alerts?status=active&severity=critical

# Acknowledge alert
curl -X POST http://localhost:3000/api/v1/alerts/<alert_id>/acknowledge \
  -H "Content-Type: application/json" \
  -d '{"notes": "Acknowledged"}'
```

---

### **Additional Features**

#### ✅ Test 11: SM-03 - Material Receipt & PO Auto-Matching

**Setup:**
1. Create Purchase Order (via API or database)
2. Login as Site Manager

**Test Steps:**
- [ ] Create daily log with delivery:
  - Material: "Concrete" (matches PO)
  - Docket Number: "PO-001-DOCK-123"
- [ ] Save daily log
- [ ] Verify delivery auto-matched to PO
- [ ] Check PO match status shows "matched"
- [ ] Verify PO ID linked to delivery

**Expected Results:**
- ✅ Delivery auto-matches to PO
- ✅ PO match status shows "matched"
- ✅ PO ID linked correctly

**API Test:**
```bash
# Create PO (if API exists)
# Then create daily log with matching material
```

---

#### ✅ Test 12: HR-02 - Profile Maintenance

**Test Steps:**
- [ ] Login as HR
- [ ] Go to `/hr/employees`
- [ ] Find an employee
- [ ] Click "Edit"
- [ ] Update:
  - Phone number
  - Pay rate
  - Site assignment
  - Bank details
- [ ] Click "Save"
- [ ] Verify changes saved
- [ ] Verify changes reflected immediately

**Expected Results:**
- ✅ Can edit employee details
- ✅ All fields can be updated
- ✅ Changes saved correctly
- ✅ Changes reflected immediately

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

### Issue: "Alerts not generating"
**Solution:** 
- Check if sites have issues (missing log, low attendance)
- Make sure it's after 5 PM for missed log alerts
- Check if employees have attendance for attendance alerts

---

## 📊 Test Results Template

Use this to track your testing:

```
✅ LB-01: Site Sign-In/Sign-Out - [PASS/FAIL] - Notes: ___________
✅ HR-01: Employee On-boarding - [PASS/FAIL] - Notes: ___________
✅ Core Platform - [PASS/FAIL] - Notes: ___________
✅ SM-01: Daily Site Log - [PASS/FAIL] - Notes: ___________
✅ SM-02: Workforce Attendance Verification - [PASS/FAIL] - Notes: ___________
✅ HR-04: Timesheet Approval - [PASS/FAIL] - Notes: ___________
✅ CM-01: Multi-Site Dashboard - [PASS/FAIL] - Notes: ___________
✅ LB-03: Leave Request - [PASS/FAIL] - Notes: ___________
✅ HR-05: Payroll Run & Export - [PASS/FAIL] - Notes: ___________
✅ CM-03: Exception Alert Review - [PASS/FAIL] - Notes: ___________
✅ SM-03: Material Receipt & PO Auto-Matching - [PASS/FAIL] - Notes: ___________
✅ HR-02: Profile Maintenance - [PASS/FAIL] - Notes: ___________
```

---

## 🎯 Quick Test Script

### Automated Test Flow:

```bash
# 1. Start server
npm run dev

# 2. Initialize (first time only)
# Visit: http://localhost:3000/api/v1/init

# 3. Test Flow:
# - Login as HR → Create test users → Create sites → Assign users
# - Login as Labour → Test sign-in/sign-out → Test leave request
# - Login as Site Manager → Test daily log → Test attendance verification
# - Login as HR → Test timesheet approval → Test payroll
# - Login as Contracts Manager → Test dashboard → Test alerts
```

---

## 📝 Testing Notes

- **Test each feature independently** before testing integrations
- **Document any bugs** you find with steps to reproduce
- **Test edge cases** (empty data, invalid inputs, etc.)
- **Test responsive design** on mobile, tablet, desktop
- **Test error handling** (network errors, validation errors, etc.)

---

## 🚀 After Testing

1. **Document Issues**: Create a list of bugs found
2. **Fix Critical Bugs**: Address any blocking issues
3. **Update Documentation**: Update any outdated docs
4. **Proceed to Next Features**: Once quality is confirmed

---

**Happy Testing! 🧪**

