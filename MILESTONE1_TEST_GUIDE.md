# Milestone 1 Test Guide

## 🎯 Milestone 1 Features (Sprint-1)

This guide helps you test the three core features of Milestone 1:

1. **LB-01: Site Sign-In/Sign-Out** - QR code scanning and attendance tracking
2. **HR-01: Employee On-boarding** - Creating new employees with different roles
3. **Core Platform: Authentication & RBAC** - Login, role-based access, and redirects

---

## 📋 Prerequisites

### Step 1: Start Development Server

```bash
cd /Users/nc/Desktop/workforce
npm run dev
```

Wait for the server to start. You should see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

### Step 2: Initialize System (First Time Only)

1. Open browser: `http://localhost:3000/api/v1/init`
2. Click "Initialize HR Admin" button
3. Wait for success message
4. Default credentials created:
   - **Email:** `hr@workforce.com`
   - **Password:** `Admin@123`

---

## ✅ Test 1: HR-01 - Employee On-boarding

### Setup
- [ ] Server is running
- [ ] System initialized (HR admin created)
- [ ] Logged in as HR admin

### Test Steps

1. **Login as HR:**
   - [ ] Go to `http://localhost:3000/login`
   - [ ] Enter email: `hr@workforce.com`
   - [ ] Enter password: `Admin@123`
   - [ ] Click "Sign In"
   - [ ] Should redirect to `/hr/dashboard`

2. **Create a Site:**
   - [ ] Navigate to `/hr/sites`
   - [ ] Click "Create Site" or "Add Site"
   - [ ] Fill in form:
     - Site Code: `SITE-001`
     - Site Name: `Test Construction Site`
     - Address: `123 Test Street, London`
     - GPS Latitude: `51.5074`
     - GPS Longitude: `-0.1278`
     - Radius (meters): `100`
   - [ ] Click "Save" or "Create"
   - [ ] Verify site appears in sites list

3. **Create Labour Worker:**
   - [ ] Navigate to `/hr/create-employee`
   - [ ] Fill in form:
     - First Name: `John`
     - Last Name: `Doe`
     - Email: `labour@workforce.com`
     - Phone: `+441234567890`
     - Role: `Labour`
     - Password: `Labour123`
     - Pay Rate: `12.00`
     - Annual Leave Balance: `25`
     - Site Assignment: Select the site you created
   - [ ] Click "Create Employee"
   - [ ] Verify success message
   - [ ] Verify employee appears in `/hr/employees`

4. **Create Site Manager:**
   - [ ] Still on `/hr/create-employee`
   - [ ] Fill in form:
     - First Name: `Jane`
     - Last Name: `Smith`
     - Email: `sitemanager@workforce.com`
     - Phone: `+441234567891`
     - Role: `Site Manager`
     - Password: `SiteManager123`
     - Site Assignment: Select the site you created
   - [ ] Click "Create Employee"
   - [ ] Verify success message

5. **Create Contracts Manager:**
   - [ ] Still on `/hr/create-employee`
   - [ ] Fill in form:
     - First Name: `Bob`
     - Last Name: `Johnson`
     - Email: `contractsmanager@workforce.com`
     - Phone: `+441234567892`
     - Role: `Contracts Manager`
     - Password: `ContractsManager123`
   - [ ] Click "Create Employee"
   - [ ] Verify success message

### Expected Results
- ✅ All employees created successfully
- ✅ Employees appear in employee list
- ✅ Site assignment works for labour and site manager
- ✅ All roles can be created

### API Test (Optional)
```bash
# List all employees
curl http://localhost:3000/api/v1/employees

# Get specific employee
curl http://localhost:3000/api/v1/employees?email=labour@workforce.com
```

---

## ✅ Test 2: Core Platform - Authentication & RBAC

### Test Steps

1. **Test Role-Based Redirects:**
   
   **HR Officer:**
   - [ ] Logout (if logged in)
   - [ ] Login as `hr@workforce.com` / `Admin@123`
   - [ ] Should redirect to `/hr/dashboard`
   - [ ] Verify HR dashboard loads

   **Site Manager:**
   - [ ] Logout
   - [ ] Login as `sitemanager@workforce.com` / `SiteManager123`
   - [ ] Should redirect to `/site-manager/dashboard`
   - [ ] Verify Site Manager dashboard loads

   **Contracts Manager:**
   - [ ] Logout
   - [ ] Login as `contractsmanager@workforce.com` / `ContractsManager123`
   - [ ] Should redirect to `/contracts-manager/dashboard`
   - [ ] Verify Contracts Manager dashboard loads

   **Labour:**
   - [ ] Logout
   - [ ] Login as `labour@workforce.com` / `Labour123`
   - [ ] Should redirect to `/attendance/scan`
   - [ ] Verify attendance scan page loads

2. **Test Unauthorized Access:**
   
   **As Labour:**
   - [ ] While logged in as labour, try to access `/hr/dashboard`
   - [ ] Should be blocked or redirected
   - [ ] Try to access `/hr/timesheets`
   - [ ] Should be blocked or redirected
   - [ ] Try to access `/contracts-manager/dashboard`
   - [ ] Should be blocked or redirected

   **As Site Manager:**
   - [ ] Logout and login as site manager
   - [ ] Try to access `/hr/employees`
   - [ ] Should be blocked or redirected
   - [ ] Try to access `/contracts-manager/dashboard`
   - [ ] Should be blocked or redirected

   **As Contracts Manager:**
   - [ ] Logout and login as contracts manager
   - [ ] Try to access `/hr/timesheets`
   - [ ] Should be blocked or redirected
   - [ ] Try to access `/site-manager/dashboard`
   - [ ] Should be blocked or redirected

3. **Test Logout:**
   - [ ] While logged in, click logout button
   - [ ] Should redirect to `/login`
   - [ ] Try to access protected route (e.g., `/hr/dashboard`)
   - [ ] Should redirect to `/login`

4. **Test Invalid Credentials:**
   - [ ] Try to login with wrong password
   - [ ] Should show error message
   - [ ] Try to login with non-existent email
   - [ ] Should show error message

### Expected Results
- ✅ Role-based redirects work correctly
- ✅ Unauthorized access is blocked
- ✅ Logout works correctly
- ✅ Invalid credentials show appropriate errors

---

## ✅ Test 3: LB-01 - Site Sign-In/Sign-Out

### Setup
- [ ] Site created (from Test 1)
- [ ] Labour worker created and assigned to site
- [ ] Logged in as labour worker

### Test Steps

1. **Get QR Code:**
   - [ ] Open new browser tab/window
   - [ ] Login as HR (`hr@workforce.com` / `Admin@123`)
   - [ ] Navigate to `/hr/qr-display`
   - [ ] Select the site you created
   - [ ] QR code should display
   - [ ] Copy the QR code text (or keep page open for scanning)

2. **Test Sign-In (Manual Entry):**
   - [ ] Go back to labour worker tab
   - [ ] Should be on `/attendance/scan` page
   - [ ] Click "Enter QR Code Manually" or similar option
   - [ ] Enter the QR code text you copied
   - [ ] Click "Sign In" or "Submit"
   - [ ] Allow geolocation permission if prompted
   - [ ] Verify success message: "Sign-in successful" or similar
   - [ ] Verify sign-in time is displayed

3. **Test Sign-In (QR Scan):**
   - [ ] Click "Scan QR Code" button
   - [ ] Allow camera permission
   - [ ] Point camera at QR code (from HR tab)
   - [ ] QR code should be detected automatically
   - [ ] Verify success message
   - [ ] Verify sign-in time is recorded

4. **Test Geolocation Validation (Within Radius):**
   - [ ] Make sure you're within 100 meters of the site location
   - [ ] Try to sign in again (if allowed)
   - [ ] Should work if location is valid

5. **Test Sign-Out:**
   - [ ] After signing in, look for "Sign Out" button
   - [ ] Click "Sign Out"
   - [ ] Verify success message
   - [ ] Verify sign-out time is displayed
   - [ ] Verify both sign-in and sign-out times are shown

6. **Test Duplicate Attendance Prevention:**
   - [ ] Try to sign in again on the same day
   - [ ] Should show error: "Attendance already marked for today" or similar
   - [ ] Verify only one attendance record exists for today

7. **Verify Attendance Record:**
   - [ ] Login as HR
   - [ ] Navigate to `/hr/employees`
   - [ ] Find the labour worker
   - [ ] View their attendance records
   - [ ] Verify today's attendance shows:
     - Sign-in time
     - Sign-out time
     - Site name
     - Date

### Expected Results
- ✅ QR code can be scanned or entered manually
- ✅ Sign-in works correctly
- ✅ Geolocation validation works (if implemented)
- ✅ Sign-out works correctly
- ✅ Duplicate attendance is prevented
- ✅ Attendance records are saved correctly

### API Test (Optional)
```bash
# Check attendance for employee
curl http://localhost:3000/api/v1/attendance?employeeId=<employee_id>

# Check today's attendance
curl http://localhost:3000/api/v1/attendance?employeeId=<employee_id>&date=$(date +%Y-%m-%d)
```

---

## 📊 Test Results Summary

Fill out this checklist as you test:

### HR-01: Employee On-boarding
- [ ] **Status:** [ ] PASS [ ] FAIL [ ] PARTIAL
- [ ] **Notes:** _________________________________
- [ ] **Issues Found:** _________________________________

### Core Platform: Authentication & RBAC
- [ ] **Status:** [ ] PASS [ ] FAIL [ ] PARTIAL
- [ ] **Notes:** _________________________________
- [ ] **Issues Found:** _________________________________

### LB-01: Site Sign-In/Sign-Out
- [ ] **Status:** [ ] PASS [ ] FAIL [ ] PARTIAL
- [ ] **Notes:** _________________________________
- [ ] **Issues Found:** _________________________________

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Check MongoDB is running
- Verify `.env.local` has correct `MONGODB_URI`
- Check network access if using MongoDB Atlas

### Issue: "HR admin already exists"
**Solution:** 
- This is normal if you've initialized before
- Just proceed to login

### Issue: "Cannot create employee"
**Solution:**
- Make sure you're logged in as HR
- Check all required fields are filled
- Verify email is unique

### Issue: "QR code not scanning"
**Solution:**
- Allow camera permissions
- Ensure good lighting
- Try manual entry instead
- Check QR code is valid (from `/hr/qr-display`)

### Issue: "Geolocation not working"
**Solution:**
- Allow browser geolocation permission
- Check if you're within site radius
- Some browsers require HTTPS for geolocation

### Issue: "Wrong redirect after login"
**Solution:**
- Check employee role is set correctly
- Verify middleware is working
- Check browser console for errors

---

## ✅ Milestone 1 Completion Checklist

- [ ] All 3 features tested
- [ ] All test cases passed
- [ ] No critical bugs found
- [ ] Documentation updated
- [ ] Ready for Milestone 2

---

## 🚀 Next Steps

After completing Milestone 1 testing:

1. **Document any bugs** found
2. **Fix critical issues** before proceeding
3. **Move to Milestone 2** (Sprint-2 features):
   - SM-01: Daily Site Log
   - SM-02: Workforce Attendance Verification
   - HR-04: Timesheet Approval

---

**Happy Testing! 🧪**

