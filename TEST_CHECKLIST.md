# Test Checklist for Completed Functionalities

## ✅ LB-01: Site Sign-In/Sign-Out

### Test Cases:
- [ ] **Test 1**: QR Code Scanning
  - Create a site with location
  - Generate QR code
  - Login as employee
  - Scan QR code successfully
  - Verify attendance is marked

- [ ] **Test 2**: Geolocation Validation (Within Radius)
  - Mark attendance within site radius
  - Verify success response
  - Check attendance record created

- [ ] **Test 3**: Geolocation Validation (Outside Radius)
  - Try to mark attendance outside radius
  - Verify error message with distance
  - Check attendance NOT created

- [ ] **Test 4**: Duplicate Attendance Prevention
  - Mark attendance once
  - Try to mark again same day
  - Verify "already marked" error
  - Check only one attendance record exists

- [ ] **Test 5**: Manual QR Entry
  - Enter QR code manually
  - Verify validation works
  - Check attendance marked

### API Endpoints to Test:
- `POST /api/v1/attendance/mark`
- `GET /api/v1/attendance/check`

### Pages to Test:
- `/attendance/scan`

---

## ✅ SM-01: Daily Site Log

### Test Cases:
- [ ] **Test 1**: Create Daily Log
  - Login as Site Manager
  - Navigate to dashboard
  - Fill daily log form (weather, headcount, deliveries, issues)
  - Save as draft
  - Verify log created

- [ ] **Test 2**: Edit Draft Log
  - Open existing draft log
  - Modify fields
  - Save changes
  - Verify updates saved

- [ ] **Test 3**: Lock Daily Log
  - Open draft log
  - Click "Lock" button
  - Verify status changed to "locked"
  - Try to edit locked log (should fail)
  - Verify lockedAt timestamp set

- [ ] **Test 4**: Send to Contracts Manager
  - Open locked log
  - Click "Send" button
  - Verify status changed to "sent"
  - Verify sentAt timestamp set
  - Try to edit sent log (should fail)

- [ ] **Test 5**: One Log Per Site Per Day
  - Create log for today
  - Try to create another for same site/date
  - Verify duplicate error
  - Check only one log exists

- [ ] **Test 6**: View Daily Logs List
  - Navigate to `/site-manager/daily-logs`
  - Verify all logs listed
  - Check filters work (date, status)

- [ ] **Test 7**: View Single Daily Log
  - Click on log from list
  - Verify all details displayed
  - Check read-only view for locked/sent logs

### API Endpoints to Test:
- `GET /api/v1/daily-logs`
- `POST /api/v1/daily-logs`
- `GET /api/v1/daily-logs/[id]`
- `PATCH /api/v1/daily-logs/[id]`
- `POST /api/v1/daily-logs/[id]/lock`
- `POST /api/v1/daily-logs/[id]/send`

### Pages to Test:
- `/site-manager/dashboard`
- `/site-manager/daily-logs`
- `/site-manager/daily-logs/[id]`

---

## ✅ SM-02: Workforce Attendance Verification

### Test Cases:
- [ ] **Test 1**: Compare Planned vs Actual
  - Create daily log with planned headcount
  - Mark attendance for some employees
  - Navigate to attendance verification page
  - Verify comparison shows correct numbers
  - Check missing workers identified

- [ ] **Test 2**: No Daily Log (Uses Assigned Employees)
  - Don't create daily log
  - Mark attendance for employees
  - Check verification page
  - Verify uses assigned employees as planned

- [ ] **Test 3**: Missing Workers Detection
  - Set planned headcount higher than actual
  - Mark attendance for fewer employees
  - Verify missing workers list shows correct employees
  - Check status is "warning" or "critical"

- [ ] **Test 4**: Unexpected Workers Detection
  - Mark attendance for employees not in planned list
  - Verify unexpected workers identified
  - Check status indicators

- [ ] **Test 5**: Date Filtering
  - Select different date
  - Verify data updates
  - Check correct attendance records shown

- [ ] **Test 6**: Attendance Percentage Calculation
  - Set planned headcount: 10
  - Mark attendance: 8
  - Verify percentage: 80%
  - Check status color coding

### API Endpoints to Test:
- `GET /api/v1/sites/[id]/attendance-verification?date=YYYY-MM-DD`

### Pages to Test:
- `/site-manager/attendance-verification`

---

## ✅ SM-03: Material Receipt & PO Auto-Matching

### Test Cases:
- [ ] **Test 1**: Create Purchase Order
  - Login as HR/Admin
  - Create PO with line items (materials)
  - Verify PO saved with correct data

- [ ] **Test 2**: Auto-Match by Material Description
  - Create PO with material "Concrete"
  - Add delivery in daily log with material "Concrete"
  - Save daily log
  - Verify delivery auto-matched to PO
  - Check poMatchStatus = "matched"
  - Check poId populated

- [ ] **Test 3**: Auto-Match by Docket Number
  - Create PO with number "PO-2024-001"
  - Add delivery with docket "DOCK-PO-2024-001-12345"
  - Save daily log
  - Verify PO extracted from docket
  - Check match successful

- [ ] **Test 4**: Unmatched Delivery
  - Add delivery with material not in any PO
  - Save daily log
  - Verify poMatchStatus = "unmatched"
  - Check poId is null

- [ ] **Test 5**: Multiple Deliveries Matching
  - Create multiple POs
  - Add multiple deliveries
  - Save daily log
  - Verify all deliveries matched correctly
  - Check each has correct PO reference

- [ ] **Test 6**: Case-Insensitive Matching
  - Create PO with "Concrete"
  - Add delivery with "concrete" (lowercase)
  - Verify match works

### API Endpoints to Test:
- Daily Log API (auto-matching happens on create/update)
- PO Matching Service: `lib/services/poMatching.js`

### Models to Test:
- `lib/models/PurchaseOrder.js`

---

## ✅ HR-01: Employee On-boarding

### Test Cases:
- [ ] **Test 1**: Create Employee
  - Login as HR
  - Navigate to "Create Employee"
  - Fill all required fields
  - Submit form
  - Verify employee created
  - Check all fields saved correctly

- [ ] **Test 2**: Create with All Roles
  - Test creating employee with each role:
    - labour
    - site_manager
    - contracts_manager
    - hr_officer
    - ehs_officer
    - admin
  - Verify each role works

- [ ] **Test 3**: Site Assignment
  - Create employee
  - Assign to site
  - Verify siteId saved
  - Check employee appears in site's manager list

- [ ] **Test 4**: Validation
  - Try to create with invalid email
  - Try to create with duplicate employeeId
  - Try to create with duplicate email
  - Verify validation errors shown

- [ ] **Test 5**: Employee List
  - Navigate to `/hr/employees`
  - Verify all employees listed
  - Check filters work
  - Verify search works

### API Endpoints to Test:
- `POST /api/v1/employees`
- `GET /api/v1/employees`

### Pages to Test:
- `/hr/create-employee`
- `/hr/employees`

---

## ✅ HR-02: Profile Maintenance

### Test Cases:
- [ ] **Test 1**: Edit Employee
  - Navigate to employee list
  - Click edit on employee
  - Modify fields (name, email, phone, role, rate)
  - Save changes
  - Verify updates saved

- [ ] **Test 2**: Update Contact Info
  - Edit employee
  - Change email, phone
  - Save
  - Verify new contact info

- [ ] **Test 3**: Update Bank Details
  - Edit employee
  - Change account number, sort code
  - Save
  - Verify bank details updated

- [ ] **Test 4**: Change Role
  - Edit employee
  - Change role
  - Save
  - Verify role updated
  - Check permissions updated

- [ ] **Test 5**: Update Pay Rate
  - Edit employee
  - Change pay rate
  - Save
  - Verify pay rate updated

- [ ] **Test 6**: Site Reassignment
  - Edit employee
  - Change site assignment
  - Save
  - Verify siteId updated
  - Check appears in new site's list

- [ ] **Test 7**: Status Change
  - Edit employee
  - Change status (active/inactive/terminated)
  - Save
  - Verify status updated

### API Endpoints to Test:
- `GET /api/v1/employees/[id]`
- `PATCH /api/v1/employees/[id]`

### Pages to Test:
- `/hr/employees` (edit functionality)

---

## ✅ HR-04: Timesheet Approval

### Test Cases:
- [ ] **Test 1**: Generate Timesheet for Employee
  - Create attendance records for employee
  - Call generate API
  - Verify timesheet created
  - Check hours calculated correctly
  - Verify week start/end dates correct

- [ ] **Test 2**: Generate All Timesheets
  - Create attendance for multiple employees
  - Call bulk generate API
  - Verify timesheets created for all
  - Check no duplicates

- [ ] **Test 3**: View Timesheet List
  - Navigate to `/hr/timesheets`
  - Verify all timesheets listed
  - Check filters work (status, week)
  - Verify search works

- [ ] **Test 4**: View Timesheet Detail
  - Click on timesheet from list
  - Verify all details shown
  - Check daily hours breakdown
  - Verify total hours calculated

- [ ] **Test 5**: Approve Timesheet
  - Open timesheet in "draft" or "submitted" status
  - Click "Approve"
  - Verify status changed to "approved"
  - Check approvedBy and approvedAt set

- [ ] **Test 6**: Lock Timesheet
  - Open approved timesheet
  - Click "Lock"
  - Verify status changed to "locked"
  - Check lockedAt set
  - Try to edit (should fail)

- [ ] **Test 7**: Hours Calculation
  - Create attendance with sign-in/sign-out
  - Generate timesheet
  - Verify hours calculated correctly
  - Check total hours = sum of daily hours

- [ ] **Test 8**: Filter by Status
  - Filter by "draft"
  - Filter by "approved"
  - Filter by "locked"
  - Verify correct timesheets shown

- [ ] **Test 9**: Filter by Week
  - Select different week
  - Verify timesheets for that week shown

### API Endpoints to Test:
- `GET /api/v1/timesheets`
- `POST /api/v1/timesheets` (generate)
- `GET /api/v1/timesheets/[id]`
- `POST /api/v1/timesheets/[id]/approve`
- `POST /api/v1/timesheets/[id]/lock`

### Pages to Test:
- `/hr/timesheets`
- `/hr/timesheets/[id]`

---

## 🧪 Testing Instructions

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test each functionality systematically:**
   - Follow the test cases above
   - Check browser console for errors
   - Verify database records created/updated correctly
   - Test both success and error scenarios

3. **Document any issues found:**
   - Note the test case that failed
   - Document the error message
   - Note steps to reproduce

4. **Test with different user roles:**
   - Test as labour (attendance)
   - Test as site_manager (daily logs, attendance verification)
   - Test as hr_officer (employees, timesheets)
   - Test as admin (all features)

---

## 📝 Test Results Template

For each test case, document:
- ✅ Pass / ❌ Fail
- Notes (if any issues found)
- Screenshots (if needed)
- Error messages (if any)

