# Data Dictionary - Workforce Management System

## Core Entities

### 1. Employee (`employees`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `employeeId` | String | Unique employee identifier | Required, Unique | Yes |
| `firstName` | String | First name | Required, Max 50 chars | No |
| `lastName` | String | Last name | Required, Max 50 chars | No |
| `email` | String | Email address | Required, Unique, Valid email | Yes |
| `phone` | String | Phone number | Required, Format: +44... | No |
| `role` | Enum | User role | One of: labour, site_manager, contracts_manager, hr_officer, ehs_officer, admin | Yes |
| `siteId` | ObjectId | Currently assigned site | Reference to sites | Yes |
| `payRate` | Number | Hourly pay rate | Required, Min 0, Decimal(2) | No |
| `bankDetails` | Object | Bank account information | | |
| `bankDetails.accountNumber` | String | Account number | Required, 8-12 digits | No |
| `bankDetails.sortCode` | String | Sort code | Required, Format: XX-XX-XX | No |
| `status` | Enum | Employment status | One of: active, inactive, terminated | Yes |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- One-to-Many: `attendance`, `leave_requests`, `certifications`, `timesheets`
- Many-to-One: `sites`

---

### 2. Attendance (`attendance`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `employeeId` | ObjectId | Employee reference | Required, Foreign key | Yes |
| `siteId` | ObjectId | Site reference | Required, Foreign key | Yes |
| `signInTime` | Date | Sign-in timestamp | Required | Yes |
| `signOutTime` | Date | Sign-out timestamp | Optional | No |
| `signInMethod` | Enum | Sign-in method | One of: qr, barcode, manual | No |
| `signOutMethod` | Enum | Sign-out method | One of: qr, barcode, manual | No |
| `hoursWorked` | Number | Calculated hours | Decimal(2), Auto-calculated | No |
| `status` | Enum | Attendance status | One of: present, absent, late | Yes |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |

**Relationships:**
- Many-to-One: `employees`, `sites`
- One-to-One: `timesheets` (via hours array)

**Business Rules:**
- `signOutTime` must be after `signInTime`
- `hoursWorked` = (`signOutTime` - `signInTime`) / 3600000
- Status "late" if signInTime > scheduled start time + 15 minutes

---

### 3. Leave Request (`leave_requests`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `employeeId` | ObjectId | Employee reference | Required, Foreign key | Yes |
| `type` | Enum | Leave type | One of: annual, sick, unpaid, compassionate | Required | Yes |
| `startDate` | Date | Leave start date | Required, Must be future | Yes |
| `endDate` | Date | Leave end date | Required, Must be >= startDate | Yes |
| `days` | Number | Number of days | Auto-calculated, Excludes weekends | No |
| `reason` | String | Reason for leave | Required, Max 500 chars | No |
| `status` | Enum | Request status | One of: pending, approved, rejected | Required | Yes |
| `approvedBy` | ObjectId | Approver reference | Optional, Foreign key | No |
| `approvedAt` | Date | Approval timestamp | Optional | No |
| `rejectionReason` | String | Rejection reason | Optional, Max 500 chars | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `employees` (requester)
- Many-to-One: `employees` (approver)

**Business Rules:**
- `days` calculated excluding weekends
- Cannot overlap with existing approved leave
- Auto-updates employee leave balance on approval

---

### 4. Certification (`certifications`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `employeeId` | ObjectId | Employee reference | Required, Foreign key | Yes |
| `type` | Enum | Certification type | One of: SafePass, CSCS, FirstAid, Forklift, Other | Required | Yes |
| `documentUrl` | String | Document storage URL | Required, Valid URL | No |
| `documentType` | Enum | File type | One of: pdf, jpg, png | Required | No |
| `issueDate` | Date | Issue date | Required | No |
| `expiryDate` | Date | Expiry date | Required, Must be > issueDate | Yes |
| `status` | Enum | Validation status | One of: pending_validation, valid, expired, rejected | Required | Yes |
| `validatedBy` | ObjectId | Validator reference | Optional, Foreign key | No |
| `validatedAt` | Date | Validation timestamp | Optional | No |
| `rejectionReason` | String | Rejection reason | Optional | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `employees`
- Many-to-One: `employees` (validator)

**Business Rules:**
- Status auto-updates to "expired" when `expiryDate` < today
- Expired certifications block site access
- Reminder sent 30 days before expiry

---

### 5. Site (`sites`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `siteCode` | String | Unique site code | Required, Unique, Format: SITE### | Yes |
| `name` | String | Site name | Required, Max 100 chars | No |
| `address` | Object | Site address | Required | |
| `address.street` | String | Street address | Required | No |
| `address.city` | String | City | Required | No |
| `address.postcode` | String | Postcode | Required | No |
| `address.country` | String | Country | Default: "UK" | No |
| `qrCode` | String | QR code data | Required, Unique | Yes |
| `qrCodeImage` | String | QR code image URL | Auto-generated | No |
| `contractsManagerId` | ObjectId | Assigned CM | Required, Foreign key | Yes |
| `status` | Enum | Site status | One of: planning, active, completed, on_hold | Required | Yes |
| `startDate` | Date | Project start date | Optional | No |
| `endDate` | Date | Project end date | Optional | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- One-to-Many: `employees` (assigned workers)
- One-to-Many: `daily_logs`, `attendance`, `incidents`, `variations`
- Many-to-One: `employees` (contracts manager)

---

### 6. Daily Site Log (`daily_logs`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `siteId` | ObjectId | Site reference | Required, Foreign key | Yes |
| `siteManagerId` | ObjectId | Site manager reference | Required, Foreign key | Yes |
| `date` | Date | Log date | Required, Unique per site | Yes |
| `weather` | String | Weather conditions | Max 200 chars | No |
| `headcount` | Number | Actual headcount | Required, Min 0 | No |
| `plannedHeadcount` | Number | Planned headcount | Optional | No |
| `deliveries` | Array | Material deliveries | | |
| `deliveries[].material` | String | Material description | Required | No |
| `deliveries[].docketNumber` | String | Delivery docket number | Required | No |
| `deliveries[].docketPhoto` | String | Photo URL | Required | No |
| `deliveries[].poMatchStatus` | Enum | PO match status | One of: matched, pending, unmatched | Required | No |
| `deliveries[].poId` | ObjectId | Matched PO reference | Optional | No |
| `issues` | String | Site issues/notes | Max 1000 chars | No |
| `status` | Enum | Log status | One of: draft, locked, sent | Required | Yes |
| `lockedAt` | Date | Lock timestamp | Optional | No |
| `sentAt` | Date | Sent to CM timestamp | Optional | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `sites`, `employees` (site manager)

**Business Rules:**
- Only one log per site per day
- Cannot edit after "locked" status
- Auto-sent to Contracts Manager on lock

---

### 7. Variation / Change Order (`variations`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `siteId` | ObjectId | Site reference | Required, Foreign key | Yes |
| `siteManagerId` | ObjectId | Creator reference | Required, Foreign key | Yes |
| `title` | String | Variation title | Required, Max 200 chars | No |
| `description` | String | Detailed description | Required, Max 2000 chars | No |
| `cost` | Number | Additional cost | Required, Min 0, Decimal(2) | No |
| `delayDays` | Number | Project delay in days | Required, Min 0 | No |
| `status` | Enum | Variation status | One of: draft, pending, approved, rejected | Required | Yes |
| `approvedBy` | ObjectId | Approver reference | Optional, Foreign key | No |
| `approvedAt` | Date | Approval timestamp | Optional | No |
| `commercialNotes` | String | CM's commercial notes | Optional, Max 1000 chars | No |
| `rejectionReason` | String | Rejection reason | Optional | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `sites`, `employees` (site manager, approver)

---

### 8. Incident (`incidents`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `siteId` | ObjectId | Site reference | Required, Foreign key | Yes |
| `reportedBy` | ObjectId | Reporter reference | Required, Foreign key | Yes |
| `type` | Enum | Incident type | One of: incident, near_miss | Required | Yes |
| `severity` | Enum | Severity level | One of: low, medium, high, critical | Required | Yes |
| `description` | String | Incident description | Required, Max 2000 chars | No |
| `photos` | Array[String] | Photo URLs | Max 10 photos | No |
| `location` | String | Location on site | Optional, Max 200 chars | No |
| `status` | Enum | Investigation status | One of: reported, under_investigation, resolved, closed | Required | Yes |
| `assignedTo` | ObjectId | EHS officer reference | Optional, Foreign key | Yes |
| `actions` | Array | Corrective actions | | |
| `actions[].description` | String | Action description | Required | No |
| `actions[].assignedTo` | ObjectId | Action assignee | Required | No |
| `actions[].dueDate` | Date | Due date | Required | No |
| `actions[].status` | Enum | Action status | One of: pending, in_progress, completed | Required | No |
| `investigationNotes` | String | Investigation notes | Optional, Max 5000 chars | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `sites`, `employees` (reporter, assigned EHS officer)

---

### 9. Timesheet (`timesheets`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `employeeId` | ObjectId | Employee reference | Required, Foreign key | Yes |
| `weekStartDate` | Date | Week start (Monday) | Required | Yes |
| `weekEndDate` | Date | Week end (Sunday) | Required | Yes |
| `hours` | Array | Daily hours breakdown | | |
| `hours[].date` | Date | Date | Required | No |
| `hours[].hours` | Number | Hours worked | Required, Min 0, Max 24, Decimal(2) | No |
| `hours[].attendanceId` | ObjectId | Attendance reference | Optional | No |
| `totalHours` | Number | Total hours for week | Auto-calculated, Decimal(2) | No |
| `status` | Enum | Timesheet status | One of: draft, submitted, approved, locked | Required | Yes |
| `approvedBy` | ObjectId | Approver reference | Optional, Foreign key | No |
| `approvedAt` | Date | Approval timestamp | Optional | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-One: `employees` (employee, approver)
- One-to-Many: `attendance` (via hours array)

**Business Rules:**
- Auto-generated from attendance records
- Cannot edit after "locked" status
- `totalHours` = sum of `hours[].hours`

---

### 10. Payroll Run (`payroll_runs`)

| Field | Type | Description | Constraints | Index |
|-------|------|-------------|-------------|-------|
| `_id` | ObjectId | Primary key | Auto-generated | Primary |
| `periodStart` | Date | Pay period start | Required | Yes |
| `periodEnd` | Date | Pay period end | Required | Yes |
| `timesheets` | Array[ObjectId] | Included timesheets | Required | No |
| `employees` | Array[ObjectId] | Employees in run | Auto-populated | No |
| `totalGross` | Number | Total gross pay | Auto-calculated, Decimal(2) | No |
| `totalNet` | Number | Total net pay | Auto-calculated, Decimal(2) | No |
| `status` | Enum | Run status | One of: draft, calculated, exported, paid | Required | Yes |
| `exportedToSage` | Boolean | Sage export flag | Default: false | No |
| `exportedAt` | Date | Export timestamp | Optional | No |
| `exportFileUrl` | String | Exported file URL | Optional | No |
| `createdBy` | ObjectId | Creator reference | Required, Foreign key | No |
| `createdAt` | Date | Record creation timestamp | Auto-generated | Yes |
| `updatedAt` | Date | Last update timestamp | Auto-updated | Yes |

**Relationships:**
- Many-to-Many: `timesheets`
- Many-to-Many: `employees`

**Business Rules:**
- Auto-calculates gross/net from timesheets
- Cannot modify after "exported" status

---

## Enumerations

### Role Enum
```typescript
enum Role {
  LABOUR = 'labour',
  SITE_MANAGER = 'site_manager',
  CONTRACTS_MANAGER = 'contracts_manager',
  HR_OFFICER = 'hr_officer',
  EHS_OFFICER = 'ehs_officer',
  ADMIN = 'admin'
}
```

### Leave Type Enum
```typescript
enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  COMPASSIONATE = 'compassionate'
}
```

### Certification Type Enum
```typescript
enum CertificationType {
  SAFEPASS = 'SafePass',
  CSCS = 'CSCS',
  FIRST_AID = 'FirstAid',
  FORKLIFT = 'Forklift',
  OTHER = 'Other'
}
```

### Status Enums
- **Request Status:** `pending`, `approved`, `rejected`
- **Validation Status:** `pending_validation`, `valid`, `expired`, `rejected`
- **Site Status:** `planning`, `active`, `completed`, `on_hold`
- **Log Status:** `draft`, `locked`, `sent`
- **Variation Status:** `draft`, `pending`, `approved`, `rejected`
- **Incident Status:** `reported`, `under_investigation`, `resolved`, `closed`
- **Timesheet Status:** `draft`, `submitted`, `approved`, `locked`
- **Payroll Status:** `draft`, `calculated`, `exported`, `paid`

---

## Indexes Summary

### Critical Indexes for Performance

```javascript
// employees
db.employees.createIndex({ email: 1 }, { unique: true });
db.employees.createIndex({ employeeId: 1 }, { unique: true });
db.employees.createIndex({ role: 1, status: 1 });
db.employees.createIndex({ siteId: 1 });

// attendance
db.attendance.createIndex({ employeeId: 1, createdAt: -1 });
db.attendance.createIndex({ siteId: 1, signInTime: -1 });
db.attendance.createIndex({ signInTime: 1, signOutTime: 1 });

// leave_requests
db.leave_requests.createIndex({ employeeId: 1, status: 1 });
db.leave_requests.createIndex({ startDate: 1, endDate: 1 });

// certifications
db.certifications.createIndex({ employeeId: 1, status: 1 });
db.certifications.createIndex({ expiryDate: 1 });
db.certifications.createIndex({ status: 1, expiryDate: 1 });

// sites
db.sites.createIndex({ siteCode: 1 }, { unique: true });
db.sites.createIndex({ contractsManagerId: 1, status: 1 });

// daily_logs
db.daily_logs.createIndex({ siteId: 1, date: -1 }, { unique: true });
db.daily_logs.createIndex({ siteManagerId: 1, status: 1 });

// incidents
db.incidents.createIndex({ siteId: 1, severity: 1, createdAt: -1 });
db.incidents.createIndex({ assignedTo: 1, status: 1 });

// timesheets
db.timesheets.createIndex({ employeeId: 1, weekStartDate: -1 });
db.timesheets.createIndex({ status: 1, weekStartDate: -1 });

// payroll_runs
db.payroll_runs.createIndex({ periodStart: 1, periodEnd: 1 });
db.payroll_runs.createIndex({ status: 1 });
```

---

## Data Validation Rules

1. **Email:** Must be valid email format, unique across system
2. **Phone:** UK format: +44XXXXXXXXXX
3. **Dates:** All dates stored as UTC, displayed in user's timezone
4. **Money:** Stored as Decimal128 or Number with 2 decimal places
5. **File URLs:** Must be valid HTTPS URLs, max 2048 chars
6. **Text Fields:** Enforce max lengths to prevent DoS
7. **Foreign Keys:** Cascade delete rules defined per relationship

---

## Data Retention Policy

- **Active Records:** Keep indefinitely
- **Terminated Employees:** Archive after 7 years (legal requirement)
- **Attendance Records:** Keep for 7 years
- **Payroll Records:** Keep for 7 years
- **Incidents:** Keep permanently
- **Daily Logs:** Keep for 5 years
- **Soft Deletes:** Use `status` field instead of hard deletes

