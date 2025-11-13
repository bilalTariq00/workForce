# How Timesheet Functionality Works

## 📋 Overview

The timesheet system automatically generates weekly timesheets from attendance records (LB-01), allowing HR to review, approve, and lock them for payroll processing (HR-04).

---

## 🔄 Complete Workflow

### Step 1: Employee Attendance (LB-01)
**What happens:**
- Employee scans QR code at site
- System marks attendance with sign-in time
- When employee signs out, `signOutTime` is recorded
- System calculates `hoursWorked` = (signOutTime - signInTime) / 3600000

**Data stored in `Attendance` model:**
```javascript
{
  employeeId: ObjectId,
  siteId: ObjectId,
  date: Date,
  signInTime: Date,
  signOutTime: Date,  // Optional - if missing, defaults to 8 hours
  hoursWorked: Number, // Auto-calculated
  status: 'present'
}
```

---

### Step 2: Timesheet Generation (HR-04)

**How it works:**

1. **Automatic Generation from Attendance**
   - System reads all attendance records for an employee in a week (Monday-Sunday)
   - For each day with attendance:
     - If `signOutTime` exists: calculates hours from sign-in to sign-out
     - If no `signOutTime`: defaults to 8 hours (standard work day)
   - Creates daily entries for all 7 days (Monday-Sunday)
   - Days without attendance show 0 hours

2. **Timesheet Structure:**
```javascript
{
  employeeId: ObjectId,
  weekStartDate: Date,  // Monday
  weekEndDate: Date,    // Sunday
  hours: [
    {
      date: Date,           // Monday
      hours: 8.0,           // From attendance
      attendanceId: ObjectId, // Link to attendance record
      siteId: ObjectId       // Site where work was done
    },
    {
      date: Date,           // Tuesday
      hours: 0,             // No attendance
      attendanceId: null,
      siteId: null
    },
    // ... for all 7 days
  ],
  totalHours: 40.0,  // Auto-calculated sum
  status: 'draft'
}
```

3. **Generation Methods:**
   - **Single Employee**: `POST /api/v1/timesheets` with `employeeId`
   - **All Employees**: `POST /api/v1/timesheets` with `generateForAll: true`
   - **Current Week**: Automatically uses current week (Monday-Sunday)

---

### Step 3: HR Review & Approval

**HR Dashboard (`/hr/timesheets`):**

1. **View All Timesheets**
   - Lists all timesheets with filters:
     - Status: draft, submitted, approved, locked
     - Week: Filter by specific week
     - Employee: Filter by employee (HR only)

2. **Generate Timesheets**
   - Click "Generate All" button
   - System generates timesheets for all active employees for current week
   - Only creates if doesn't exist or status is 'draft'

3. **View Timesheet Details** (`/hr/timesheets/[id]`)
   - Shows employee information
   - Shows daily breakdown (Monday-Sunday)
   - Shows total hours
   - Shows approval/lock status
   - Shows which attendance records were used

---

### Step 4: Approval Workflow

**Status Flow:**
```
draft → submitted → approved → locked
```

1. **Draft Status** (Initial)
   - Timesheet is auto-generated
   - Can be regenerated (updates hours from latest attendance)
   - HR can review

2. **Approve** (`POST /api/v1/timesheets/[id]/approve`)
   - HR clicks "Approve" button
   - Status changes to 'approved'
   - Records `approvedBy` and `approvedAt`
   - Optional approval notes can be added
   - Timesheet can still be viewed but not edited

3. **Lock** (`POST /api/v1/timesheets/[id]/lock`)
   - HR clicks "Lock" button (only on approved timesheets)
   - Status changes to 'locked'
   - Records `lockedBy` and `lockedAt`
   - **Cannot be edited or regenerated after this**
   - Ready for payroll processing

---

### Step 5: Payroll Processing (HR-05)

**How Timesheets Connect to Payroll:**

1. **Create Payroll Run**
   - HR selects pay period (start/end dates)
   - Selects multiple **locked** timesheets
   - Creates payroll run

2. **Calculate Payroll**
   - System reads each timesheet
   - Gets employee's `payRate` from Employee model
   - Calculates: `gross = payRate × totalHours`
   - Calculates tax, deductions, net pay
   - Updates payroll run totals

3. **Export to Sage**
   - Exports payroll data in Sage-compatible format
   - Includes employee details, hours, gross, tax, net
   - Downloads as CSV or JSON file

---

## 🔧 Technical Details

### Hours Calculation Logic

**From Attendance to Timesheet:**

```javascript
// If sign-out exists:
hours = (signOutTime - signInTime) / (1000 * 60 * 60)

// If no sign-out:
hours = 8.0  // Default work day
```

**Total Hours:**
```javascript
totalHours = sum of all daily hours in the week
// Rounded to 2 decimal places
```

### Week Calculation

- **Week Start**: Monday (00:00:00)
- **Week End**: Sunday (23:59:59)
- Uses `Timesheet.getWeekStart()` and `Timesheet.getWeekEnd()` static methods

### Data Flow Diagram

```
Attendance (LB-01)
    ↓
[Employee scans QR, marks attendance]
    ↓
Attendance Record Created
    ↓
Timesheet Generator Service
    ↓
[Reads attendance for week]
    ↓
Timesheet Created/Updated
    ↓
HR Reviews Timesheet
    ↓
HR Approves Timesheet
    ↓
HR Locks Timesheet
    ↓
Payroll Run Created (HR-05)
    ↓
[Includes locked timesheets]
    ↓
Payroll Calculated
    ↓
Exported to Sage
```

---

## 📊 Key Features

### 1. Auto-Generation
- ✅ Automatically creates timesheets from attendance
- ✅ Updates existing draft timesheets
- ✅ Fills missing days with 0 hours
- ✅ Links to original attendance records

### 2. Status Management
- ✅ Draft: Can be regenerated
- ✅ Approved: Ready for locking
- ✅ Locked: Final, cannot be changed

### 3. Access Control
- ✅ Employees: Can only see their own timesheets
- ✅ HR/Admin: Can see all timesheets
- ✅ HR/Admin: Can approve and lock

### 4. Integration
- ✅ Links to Attendance records
- ✅ Links to Employee (for pay rate)
- ✅ Links to Sites (where work was done)
- ✅ Used in Payroll Runs (HR-05)

---

## 🎯 Use Cases

### For HR:
1. **Weekly Timesheet Review**
   - Navigate to `/hr/timesheets`
   - Click "Generate All" to create timesheets for current week
   - Review each timesheet
   - Approve timesheets
   - Lock approved timesheets

2. **Filter & Search**
   - Filter by status (draft, approved, locked)
   - Filter by week
   - Filter by employee

3. **Payroll Preparation**
   - Only locked timesheets can be included in payroll runs
   - Ensures data integrity

### For Employees:
- Timesheets are auto-generated from their attendance
- They can view their own timesheets (if implemented)
- No manual entry required

---

## 🔍 Example Scenario

**Week: Monday, Jan 1 - Sunday, Jan 7, 2024**

**Employee Attendance:**
- Monday: Signed in 8:00 AM, Signed out 5:00 PM → 9 hours
- Tuesday: Signed in 8:00 AM, Signed out 5:00 PM → 9 hours
- Wednesday: Signed in 8:00 AM, No sign-out → 8 hours (default)
- Thursday: No attendance → 0 hours
- Friday: Signed in 8:00 AM, Signed out 4:00 PM → 8 hours
- Saturday: No attendance → 0 hours
- Sunday: No attendance → 0 hours

**Generated Timesheet:**
```javascript
{
  weekStartDate: "2024-01-01",
  weekEndDate: "2024-01-07",
  hours: [
    { date: "2024-01-01", hours: 9.0 },   // Monday
    { date: "2024-01-02", hours: 9.0 },   // Tuesday
    { date: "2024-01-03", hours: 8.0 },   // Wednesday
    { date: "2024-01-04", hours: 0.0 },   // Thursday
    { date: "2024-01-05", hours: 8.0 },   // Friday
    { date: "2024-01-06", hours: 0.0 },   // Saturday
    { date: "2024-01-07", hours: 0.0 }    // Sunday
  ],
  totalHours: 34.0,
  status: 'draft'
}
```

**HR Workflow:**
1. HR reviews timesheet
2. HR approves → status: 'approved'
3. HR locks → status: 'locked'
4. HR includes in payroll run
5. Payroll calculates: gross = payRate × 34 hours
6. Exported to Sage

---

## 🚨 Important Business Rules

1. **One timesheet per employee per week** (enforced by unique index)
2. **Only locked timesheets** can be included in payroll runs
3. **Draft timesheets can be regenerated** (updates from latest attendance)
4. **Locked timesheets cannot be changed** (data integrity for payroll)
5. **Hours default to 8** if no sign-out time recorded
6. **Week is Monday-Sunday** (standard work week)

---

## 📝 API Endpoints

### List Timesheets
```
GET /api/v1/timesheets?status=approved&weekStartDate=2024-01-01
```

### Generate Timesheet
```
POST /api/v1/timesheets
Body: { employeeId: "...", weekStartDate: "2024-01-01" }
```

### Generate All Timesheets
```
POST /api/v1/timesheets
Body: { generateForAll: true }
```

### Get Timesheet
```
GET /api/v1/timesheets/[id]
```

### Approve Timesheet
```
POST /api/v1/timesheets/[id]/approve
Body: { notes: "Approved" }
```

### Lock Timesheet
```
POST /api/v1/timesheets/[id]/lock
```

---

## 🎨 UI Pages

1. **`/hr/timesheets`** - List all timesheets
   - Filters (status, week)
   - Generate button
   - View button for each timesheet

2. **`/hr/timesheets/[id]`** - Timesheet detail
   - Daily breakdown
   - Approve button
   - Lock button
   - Employee information

---

## 🔗 Integration Points

1. **Attendance System (LB-01)**
   - Timesheets read from attendance records
   - Hours calculated from sign-in/sign-out times

2. **Employee Model**
   - Pay rate used in payroll calculation
   - Employee details displayed in timesheet

3. **Payroll System (HR-05)**
   - Locked timesheets included in payroll runs
   - Hours used to calculate gross pay

4. **Site Model**
   - Site information shown in timesheet details
   - Links to where work was performed

---

## 💡 Key Benefits

1. **Automation**: No manual timesheet entry required
2. **Accuracy**: Directly from attendance records
3. **Traceability**: Links to original attendance records
4. **Workflow**: Clear approval and locking process
5. **Integration**: Seamlessly connects to payroll

---

This system ensures accurate payroll processing by automatically generating timesheets from attendance data and providing a clear approval workflow for HR.

