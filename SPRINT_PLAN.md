# Sprint Planning - Workforce Management System

## 📊 Current Status Assessment

### ✅ Sprint-1 COMPLETED

**Core Platform:**
- ✅ Authentication & RBAC (NextAuth)
- ✅ MongoDB connection & models
- ✅ HR Dashboard with all pages
- ✅ UI Framework (shadcn/ui)

**Use Cases Completed:**
- ✅ **HR-01**: Employee On-boarding (Create employee with all roles)
- ✅ **HR-02**: Profile Maintenance (Edit employee functionality)
- ✅ **LB-01**: Site Sign-In/Sign-Out (QR code attendance system)
  - Universal QR code system
  - Geolocation validation
  - Attendance marking
  - Mobile-optimized scan page

**Pages Created:**
- ✅ `/hr/dashboard` - Main HR dashboard
- ✅ `/hr/employees` - Employee management
- ✅ `/hr/sites` - Site management
- ✅ `/hr/reports` - Attendance reports
- ✅ `/hr/settings` - Settings page
- ✅ `/hr/create-employee` - Create employee
- ✅ `/hr/qr-display` - QR code display
- ✅ `/attendance/scan` - QR scan page

---

## 🎯 SPRINT-2 PRIORITIES (Next 2-3 Weeks)

According to the use case document, Sprint-2 focuses on:
1. **SM-01**: Daily Site Log
2. **SM-02**: Workforce Attendance Verification  
3. **HR-04**: Timesheet Approval

### Week 1: Daily Site Log (SM-01)

**Priority: NOW**

**Use Case:** Site Manager fills daily log with weather, headcount, deliveries, issues → locked & sent to CM.

**Tasks:**

#### Day 1-2: Daily Log Model & API
- [ ] Create `DailyLog` model (`lib/models/DailyLog.js`)
  - Fields: siteId, siteManagerId, date, weather, headcount, plannedHeadcount
  - Deliveries array: material, docketNumber, docketPhoto, poMatchStatus, poId
  - Issues field
  - Status: draft, locked, sent
  - Validation: One log per site per day
- [ ] Create API endpoints (`app/api/v1/daily-logs/route.js`)
  - GET: List logs (filter by site, date, status)
  - POST: Create new log
  - PATCH: Update log (only if draft)
  - POST `/lock`: Lock log (cannot edit after)
  - POST `/send`: Send to Contracts Manager
- [ ] Create single log API (`app/api/v1/daily-logs/[id]/route.js`)
  - GET: Get single log
  - PATCH: Update log
  - DELETE: Delete log (only if draft)

#### Day 3-4: Daily Log Form UI
- [ ] Create Site Manager dashboard page (`app/site-manager/dashboard/page.jsx`)
  - Check if daily log exists for today
  - Show "Create Daily Log" button if not exists
  - Show "Edit Daily Log" if draft
  - Show "View Daily Log" if locked
- [ ] Create Daily Log Form component (`components/site-manager/DailyLogForm.jsx`)
  - Weather input (text/select)
  - Headcount inputs (actual vs planned)
  - Deliveries section (add/remove deliveries)
    - Material description
    - Docket number
    - Photo upload (docket photo)
    - PO match status dropdown
  - Issues/Notes textarea
  - Save as draft button
  - Lock & Send button
- [ ] Create Delivery Item component (`components/site-manager/DeliveryItem.jsx`)
  - Form fields for each delivery
  - Photo upload functionality
  - Remove delivery button

#### Day 5: Lock & Send Functionality
- [ ] Implement lock API endpoint
  - Validate all required fields
  - Change status to "locked"
  - Set lockedAt timestamp
  - Prevent future edits
- [ ] Implement send to CM functionality
  - Change status to "sent"
  - Set sentAt timestamp
  - Create event/notification for CM
- [ ] Add validation rules
  - Cannot lock if required fields missing
  - Cannot edit after locked
  - One log per site per day

**Files to Create:**
```
lib/models/DailyLog.js
app/api/v1/daily-logs/route.js
app/api/v1/daily-logs/[id]/route.js
app/api/v1/daily-logs/[id]/lock/route.js
app/api/v1/daily-logs/[id]/send/route.js
app/site-manager/dashboard/page.jsx
components/site-manager/DailyLogForm.jsx
components/site-manager/DeliveryItem.jsx
components/site-manager/DailyLogView.jsx
```

---

### Week 2: Attendance Verification (SM-02)

**Priority: NOW**

**Use Case:** Compare planned vs scanned headcount → flag missing workers.

**Tasks:**

#### Day 1-2: Headcount Comparison Logic
- [ ] Create API endpoint (`app/api/v1/sites/[id]/attendance-verification/route.js`)
  - Get planned headcount from daily log
  - Get actual headcount from attendance records (today)
  - Compare and identify missing workers
  - Return comparison data with flags
- [ ] Create comparison algorithm
  - Match employees by site assignment
  - Identify who should be present but isn't
  - Calculate attendance percentage
  - Flag discrepancies

#### Day 3-4: Attendance Verification UI
- [ ] Create Attendance Verification page (`app/site-manager/attendance-verification/page.jsx`)
  - Show planned vs actual headcount
  - List of expected employees
  - List of present employees
  - List of missing employees (flagged)
  - Attendance percentage
  - Refresh button
- [ ] Create Attendance Comparison component (`components/site-manager/AttendanceComparison.jsx`)
  - Side-by-side comparison view
  - Color-coded status (present/absent)
  - Missing workers highlighted
  - Export to PDF option

#### Day 5: Integration & Testing
- [ ] Integrate with Daily Log
  - Link planned headcount from daily log
  - Auto-update when daily log changes
- [ ] Add notifications
  - Alert Site Manager if discrepancies found
  - Email/notification to HR if significant variance
- [ ] Testing
  - Test with various scenarios
  - Test edge cases (no planned headcount, no attendance, etc.)

**Files to Create:**
```
app/api/v1/sites/[id]/attendance-verification/route.js
app/site-manager/attendance-verification/page.jsx
components/site-manager/AttendanceComparison.jsx
components/site-manager/MissingWorkersList.jsx
```

---

### Week 3: Timesheet Approval (HR-04)

**Priority: NOW**

**Use Case:** Check weekly hours; lock for payroll.

**Tasks:**

#### Day 1-2: Timesheet Model & Auto-Generation
- [ ] Create `Timesheet` model (`lib/models/Timesheet.js`)
  - Fields: employeeId, weekStartDate, weekEndDate
  - Hours array: date, hours, attendanceId
  - totalHours (auto-calculated)
  - Status: draft, submitted, approved, locked
  - approvedBy, approvedAt
- [ ] Create timesheet generation service (`lib/services/timesheetGenerator.js`)
  - Auto-generate from attendance records
  - Calculate hours from signIn/signOut times
  - Group by week (Monday-Sunday)
  - Handle missing sign-out (default to 8 hours)
- [ ] Create API endpoint (`app/api/v1/timesheets/route.js`)
  - GET: List timesheets (filter by employee, week, status)
  - POST: Create/generate timesheet
  - Auto-generate for all employees for a week

#### Day 3-4: Timesheet Approval UI
- [ ] Create Timesheet List page (`app/hr/timesheets/page.jsx`)
  - List all timesheets (pending approval)
  - Filter by status, employee, week
  - Show total hours, status badges
  - Bulk approval option
- [ ] Create Timesheet Detail/Approval component (`components/hr/TimesheetApproval.jsx`)
  - Show employee details
  - Show daily hours breakdown
  - Show linked attendance records
  - Approve/Reject buttons
  - Add notes/comments
  - Lock for payroll button
- [ ] Create Timesheet View component (`components/hr/TimesheetView.jsx`)
  - Read-only view of timesheet
  - Daily breakdown table
  - Total hours summary
  - Status history

#### Day 5: Lock & Payroll Integration
- [ ] Implement lock functionality
  - Change status to "locked"
  - Prevent further edits
  - Mark as ready for payroll
- [ ] Create payroll preparation endpoint
  - Get all locked timesheets for a period
  - Calculate gross pay (hours × payRate)
  - Export to CSV/Excel for payroll system
- [ ] Add notifications
  - Notify employee when timesheet approved
  - Notify HR when timesheet locked

**Files to Create:**
```
lib/models/Timesheet.js
lib/services/timesheetGenerator.js
app/api/v1/timesheets/route.js
app/api/v1/timesheets/[id]/route.js
app/api/v1/timesheets/[id]/approve/route.js
app/api/v1/timesheets/[id]/lock/route.js
app/hr/timesheets/page.jsx
components/hr/TimesheetList.jsx
components/hr/TimesheetApproval.jsx
components/hr/TimesheetView.jsx
```

---

## 🚀 SPRINT-3 PRIORITIES (After Sprint-2)

### CM-01: Multi-Site Dashboard
- Live widgets: headcount, progress %, incidents, spend for each site
- Real-time updates from events
- Exception alerts

### LB-03: Leave Request
- Mobile form for leave requests
- Approval workflow (Supervisor/HR)
- Auto-update roster & payroll
- Leave balance management

### HR-05: Payroll Run & Export
- Calculate gross/net from timesheets
- Export to Sage/payroll system
- Publish payslips
- Payroll run history

### SM-03: Material Receipt & Docket Match
- Log delivery with docket photo
- Auto-match to PO
- PO matching status tracking

### SM-06: Variation/Change Order
- Create draft VO with cost & delay
- Send to CM for approval
- Approval workflow

---

## 📋 Implementation Guidelines

### Data Models Needed

1. **DailyLog** (SM-01)
2. **Timesheet** (HR-04)
3. **LeaveRequest** (LB-03 - Sprint-3)
4. **Variation** (SM-06 - Sprint-3)
5. **PayrollRun** (HR-05 - Sprint-3)

### API Endpoints Needed

**Daily Logs:**
- `GET /api/v1/daily-logs`
- `POST /api/v1/daily-logs`
- `GET /api/v1/daily-logs/[id]`
- `PATCH /api/v1/daily-logs/[id]`
- `POST /api/v1/daily-logs/[id]/lock`
- `POST /api/v1/daily-logs/[id]/send`

**Timesheets:**
- `GET /api/v1/timesheets`
- `POST /api/v1/timesheets` (auto-generate)
- `GET /api/v1/timesheets/[id]`
- `POST /api/v1/timesheets/[id]/approve`
- `POST /api/v1/timesheets/[id]/lock`

**Attendance Verification:**
- `GET /api/v1/sites/[id]/attendance-verification`

### Pages Needed

**Site Manager:**
- `/site-manager/dashboard` - Daily log creation/view
- `/site-manager/attendance-verification` - Headcount comparison

**HR:**
- `/hr/timesheets` - Timesheet approval list
- `/hr/timesheets/[id]` - Timesheet detail/approval

---

## 🎯 Recommended Next Steps

1. **Start with SM-01 (Daily Site Log)** - Foundation for other features
2. **Then SM-02 (Attendance Verification)** - Uses data from SM-01 and LB-01
3. **Then HR-04 (Timesheet Approval)** - Uses attendance data from LB-01

This sequence ensures:
- Each feature builds on previous work
- Data flows logically (Attendance → Daily Log → Timesheet)
- Site Managers can use the system end-to-end
- HR can process payroll data

---

## 📝 Notes

- All models should follow the data dictionary structure
- Use existing authentication/authorization patterns
- Follow the same UI/UX patterns as HR dashboard
- Mobile-responsive design for Site Manager pages
- Add proper error handling and validation
- Include loading states and user feedback
- Test with real data scenarios

---

**Ready to start Sprint-2?** I recommend beginning with **SM-01: Daily Site Log** as it's the foundation for other Site Manager features.


