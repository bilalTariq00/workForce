# HR Management Module - Complete Implementation Plan

## Overview
This document provides a step-by-step implementation plan for the HR Management module following the existing codebase structure and architecture patterns.

## Architecture Structure (Following Existing Patterns)

```
workforce/
├── app/
│   ├── api/v1/
│   │   ├── employees/
│   │   │   ├── route.js                    # GET, POST
│   │   │   ├── [id]/
│   │   │   │   ├── route.js                # GET, PATCH, DELETE
│   │   │   │   └── sites/
│   │   │   │       └── route.js            # Multi-site management
│   │   ├── role-templates/
│   │   │   ├── route.js                     # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.js                 # GET, PATCH, DELETE
│   │   ├── payroll-runs/                   # Existing
│   │   ├── timesheets/                      # Existing
│   │   └── dashboard/hr/
│   │       └── route.js                     # Dashboard stats API
│   ├── hr/
│   │   ├── dashboard/
│   │   │   └── page.jsx                    # Enhanced dashboard
│   │   ├── employees/
│   │   │   ├── page.jsx                     # Employee list
│   │   │   └── [id]/
│   │   │       └── page.jsx                 # Employee detail with tabs
│   │   ├── create-employee/
│   │   │   └── page.jsx                    # Create employee form
│   │   └── settings/
│   │       └── permission-templates/
│   │           └── page.jsx                # Permission templates UI
│
├── lib/
│   ├── models/
│   │   ├── Employee.js                      # Extended with HR + Payroll
│   │   ├── EmployeeSite.js                  # NEW: Multi-site assignment
│   │   ├── RoleTemplate.js                  # NEW: Permission templates
│   │   ├── RoleTemplatePermission.js        # NEW: Template permissions
│   │   ├── TaxConfig.js                     # NEW: UK tax configuration
│   │   ├── NIConfig.js                      # NEW: NI rates
│   │   ├── PensionConfig.js                 # NEW: Pension schemes
│   │   ├── PayrollItem.js                   # NEW: Per-employee payroll
│   │   └── Notification.js                  # NEW: Notifications
│   ├── services/
│   │   ├── ukTaxCalculator.js               # NEW: UK tax calculation
│   │   ├── ukNICalculator.js                # NEW: NI calculation
│   │   ├── pensionCalculator.js              # NEW: Pension calculation
│   │   ├── payrollCalculator.js             # MODIFY: Add UK calculations
│   │   ├── certificateNotificationService.js # NEW: Certificate notifications
│   │   └── dashboardStatsService.js         # NEW: Dashboard stats
│   └── utils/
│       └── permissions.js                    # NEW: Permission checking
│
├── components/
│   └── hr/
│       ├── CreateEmployeeForm.jsx            # MODIFY: Add HR + Payroll fields
│       ├── EditEmployeeModal.jsx             # MODIFY: Add HR + Payroll fields
│       ├── EmployeeList.jsx                  # MODIFY: Show multi-site
│       ├── EmployeeDetailTabs.jsx            # NEW: Tabbed employee view
│       ├── DashboardStats.jsx                # MODIFY: Enhanced stats
│       ├── DashboardWidgets.jsx               # NEW: Charts and widgets
│       ├── PermissionTemplateList.jsx        # NEW: Template list
│       ├── CreatePermissionTemplateForm.jsx  # NEW: Template form
│       └── PermissionMatrix.jsx              # NEW: Permission checkbox matrix
│
└── scripts/
    ├── seed-role-templates.js                # NEW: Seed default templates
    └── seed-uk-tax-config.js                 # NEW: Seed UK tax config
```

## Implementation Phases

### Phase 1: Foundation Models (Steps 1-5)
### Phase 2: Multi-Site Management (Steps 6-10)
### Phase 3: Employee Profile Extensions (Steps 11-14)
### Phase 4: Role & Permission Templates (Steps 15-20)
### Phase 5: UK Payroll Engine (Steps 21-26)
### Phase 6: Payroll UI Enhancements (Steps 27-30)
### Phase 7: Timesheet Approvals (Steps 31-33)
### Phase 8: Certificates & Notifications (Steps 34-36)
### Phase 9: Site-Specific QR Codes (Steps 37-40)
### Phase 10: HR Dashboard (Steps 41-45)
### Phase 11: Testing & Polish (Steps 46-50)

---

## Detailed Step-by-Step Implementation

### PHASE 1: FOUNDATION MODELS

#### Step 1: Create EmployeeSite Model
**File:** `lib/models/EmployeeSite.js`
**Purpose:** Enable multi-site employee assignments

#### Step 2: Extend Employee Model
**File:** `lib/models/Employee.js`
**Purpose:** Add HR data + Payroll data fields

#### Step 3: Create Role & Permission Template Models
**Files:** 
- `lib/models/RoleTemplate.js`
- `lib/models/RoleTemplatePermission.js`
**Purpose:** Permission template system

#### Step 4: Create UK Tax/NI/Pension Config Models
**Files:**
- `lib/models/TaxConfig.js`
- `lib/models/NIConfig.js`
- `lib/models/PensionConfig.js`
**Purpose:** UK payroll configuration

#### Step 5: Create Seed Scripts
**Files:**
- `scripts/seed-role-templates.js`
- `scripts/seed-uk-tax-config.js`
**Purpose:** Seed default data

---

### PHASE 2: MULTI-SITE MANAGEMENT

#### Step 6: Create EmployeeSite API
**File:** `app/api/v1/employees/[id]/sites/route.js`
**Purpose:** Manage employee-site assignments

#### Step 7: Update Employee API
**Files:**
- `app/api/v1/employees/route.js`
- `app/api/v1/employees/[id]/route.js`
**Purpose:** Support multi-site in employee CRUD

#### Step 8: Update Create Employee Form
**File:** `components/hr/CreateEmployeeForm.jsx`
**Purpose:** Multi-site selection UI

#### Step 9: Update Edit Employee Modal
**File:** `components/hr/EditEmployeeModal.jsx`
**Purpose:** Multi-site management UI

#### Step 10: Update Employee Views
**Files:**
- `components/hr/EmployeeList.jsx`
- `app/hr/employees/[id]/page.jsx` (create if needed)
**Purpose:** Display multi-site assignments

---

### PHASE 3: EMPLOYEE PROFILE EXTENSIONS

#### Step 11: Add HR + Payroll Fields to Create Form
**File:** `components/hr/CreateEmployeeForm.jsx`
**Purpose:** Complete employee data collection

#### Step 12: Add HR + Payroll Fields to Edit Modal
**File:** `components/hr/EditEmployeeModal.jsx`
**Purpose:** Edit all employee data

#### Step 13: Create Employee Detail Page
**Files:**
- `app/hr/employees/[id]/page.jsx`
- `components/hr/EmployeeDetailTabs.jsx`
**Purpose:** Comprehensive employee view

#### Step 14: Update API Validation
**Files:**
- `app/api/v1/employees/route.js`
- `app/api/v1/employees/[id]/route.js`
**Purpose:** Validate new fields

---

### PHASE 4: ROLE & PERMISSION TEMPLATES

#### Step 15: Create Permission Utilities
**File:** `lib/utils/permissions.js`
**Purpose:** Permission checking functions

#### Step 16: Create Permission Template API
**Files:**
- `app/api/v1/role-templates/route.js`
- `app/api/v1/role-templates/[id]/route.js`
**Purpose:** Template CRUD operations

#### Step 17: Create Permission Template UI
**Files:**
- `app/hr/settings/permission-templates/page.jsx`
- `components/hr/PermissionTemplateList.jsx`
- `components/hr/CreatePermissionTemplateForm.jsx`
- `components/hr/PermissionMatrix.jsx`
**Purpose:** Template management interface

#### Step 18: Link Templates to Employees
**Files:**
- `components/hr/CreateEmployeeForm.jsx`
- `components/hr/EditEmployeeModal.jsx`
- `app/api/v1/employees/route.js`
**Purpose:** Assign templates to employees

#### Step 19: Add Permission Middleware
**Files:** All API routes
**Purpose:** Enforce permissions

#### Step 20: Add UI Permission Checks
**Files:** All HR components
**Purpose:** Show/hide based on permissions

---

### PHASE 5: UK PAYROLL ENGINE

#### Step 21: Create UK Tax Calculator
**File:** `lib/services/ukTaxCalculator.js`
**Purpose:** UK tax band calculations

#### Step 22: Create UK NI Calculator
**File:** `lib/services/ukNICalculator.js`
**Purpose:** National Insurance calculations

#### Step 23: Create Pension Calculator
**File:** `lib/services/pensionCalculator.js`
**Purpose:** Pension contribution calculations

#### Step 24: Update Payroll Calculator
**File:** `lib/services/payrollCalculator.js`
**Purpose:** Integrate UK calculations

#### Step 25: Create PayrollItem Model
**File:** `lib/models/PayrollItem.js`
**Purpose:** Per-employee payroll breakdown

#### Step 26: Update PayrollRun
**Files:**
- `lib/models/PayrollRun.js`
- `app/api/v1/payroll-runs/route.js`
**Purpose:** Use PayrollItems

---

### PHASE 6: PAYROLL UI ENHANCEMENTS

#### Step 27: Enhance Payroll Detail UI
**Files:**
- `components/hr/PayrollRunDetail.jsx`
- `app/hr/payroll/[id]/page.jsx`
**Purpose:** Detailed breakdown display

#### Step 28: Update Payroll Dashboard
**Files:**
- `app/hr/payroll/page.jsx`
- `components/hr/PayrollRunList.jsx`
**Purpose:** Enhanced stats and charts

#### Step 29: Enhance Payroll Export
**Files:**
- `app/api/v1/payroll-runs/[id]/export/route.js`
- `lib/services/sageExport.js`
**Purpose:** Include all new fields

#### Step 30: Add Payslip PDF (Optional)
**Files:**
- `lib/services/payslipGenerator.js`
- `app/api/v1/payroll-runs/[id]/payslips/[employeeId]/route.js`
**Purpose:** Generate payslips

---

### PHASE 7: TIMESHEET APPROVALS

#### Step 31: Add Site Manager Approval
**Files:**
- `lib/models/Timesheet.js`
- `app/api/v1/timesheets/[id]/approve/route.js`
**Purpose:** Two-step approval workflow

#### Step 32: Create Site Manager Timesheet UI
**Files:**
- `app/site-manager/timesheets/page.jsx`
- `components/site-manager/TimesheetApprovalList.jsx`
**Purpose:** Site Manager approval interface

#### Step 33: Update HR Timesheet UI
**Files:**
- `app/hr/timesheets/page.jsx`
- `components/hr/TimesheetListClient.jsx`
**Purpose:** Show approval status

---

### PHASE 8: CERTIFICATES & NOTIFICATIONS

#### Step 34: Create Notification System
**Files:**
- `lib/models/Notification.js`
- `lib/services/certificateNotificationService.js`
- `scripts/daily-certificate-check.js`
**Purpose:** Expiry notifications

#### Step 35: Integrate Notifications into Dashboard
**Files:**
- `app/hr/dashboard/page.jsx`
- `components/hr/DashboardStats.jsx`
**Purpose:** Show notification counts

#### Step 36: Verify Certificate Upload
**Files:**
- `app/attendance/certifications/page.jsx`
- `components/attendance/CertificationUpload.jsx`
**Purpose:** Ensure functionality works

---

### PHASE 9: SITE-SPECIFIC QR CODES

#### Step 37: Create SiteQRToken Model
**File:** `lib/models/SiteQRToken.js`
**Purpose:** Site-specific QR tokens

#### Step 38: Create QR Token API
**Files:**
- `app/api/v1/sites/[id]/qr-token/route.js`
- `app/api/v1/sites/[id]/qr-token/regenerate/route.js`
**Purpose:** QR token management

#### Step 39: Create QR Token Route
**File:** `app/qr/[token]/page.jsx`
**Purpose:** QR code scanning endpoint

#### Step 40: Update Site Page
**Files:**
- `app/hr/sites/page.jsx`
- `components/hr/SiteList.jsx`
**Purpose:** QR management UI

---

### PHASE 10: HR DASHBOARD

#### Step 41: Create Dashboard Stats Service
**File:** `lib/services/dashboardStatsService.js`
**Purpose:** Calculate dashboard statistics

#### Step 42: Update Dashboard Stats Component
**Files:**
- `components/hr/DashboardStats.jsx`
- `app/hr/dashboard/page.jsx`
**Purpose:** Enhanced stats display

#### Step 43: Create Dashboard Widgets
**File:** `components/hr/DashboardWidgets.jsx`
**Purpose:** Charts and visualizations

#### Step 44: Add Quick Actions
**File:** `app/hr/dashboard/page.jsx`
**Purpose:** Quick action buttons

#### Step 45: Create Dashboard API
**File:** `app/api/v1/dashboard/hr/route.js`
**Purpose:** Efficient data fetching

---

### PHASE 11: TESTING & POLISH

#### Step 46: Create Test Suite
**File:** `tests/hr-module.test.js`
**Purpose:** Comprehensive testing

#### Step 47: Fix Bugs
**Files:** As needed
**Purpose:** Bug fixes and edge cases

#### Step 48: Performance Optimization
**Files:** As needed
**Purpose:** Optimize queries and caching

#### Step 49: Documentation
**File:** `HR_MODULE_DOCUMENTATION.md`
**Purpose:** Complete documentation

#### Step 50: Final Review
**Purpose:** Deployment preparation

---

## Implementation Order

Following the structure, we'll implement in this order:
1. Models first (foundation)
2. APIs (backend logic)
3. Services (business logic)
4. Components (UI)
5. Integration & Testing

Let's start with Phase 1, Step 1!

