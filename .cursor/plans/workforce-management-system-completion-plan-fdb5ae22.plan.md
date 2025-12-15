<!-- fdb5ae22-99e6-4a7c-9ff6-fd9f77b7e110 c3106843-5abc-41e3-838b-9ffc4be86d2f -->
# Workforce Management System - Complete Implementation Plan

This document contains both the detailed completion plan (Part 1) and the milestone-based plan (Part 2).

---

# PART 1: Detailed Completion Plan

## Current State Assessment

### ✅ Already Implemented

- **Models**: RoleTemplate, RoleTemplatePermission, Site (with lat/lng/radius), Employee (with roleTemplateId), Attendance, Timesheet, PayrollRun, EmployeeCertificate, Tool, TaxConfig, NIConfig, PensionConfig, EmployeeSite
- **QR System**: Universal QR code system (not site-specific)
- **Attendance**: Basic attendance with geolocation validation
- **Payroll**: Basic calculation (simplified 20% tax)
- **Reports**: Basic attendance reports
- **API Routes**: Most CRUD operations exist
- **UI Pages**: Most module pages exist

### ❌ Missing/Incomplete Features

See detailed breakdown by module below. For milestone-based implementation, see Part 2.

---

# PART 2: Milestone-Based Completion Plan

## Overview

This plan organizes all remaining work into 6 sequential milestones. Each milestone is a cohesive set of features that can be completed, tested, and deployed independently.

---

## 🎯 MILESTONE 1: Permission & Access Control Foundation

**Duration**: 1-2 weeks
**Priority**: Critical
**Goal**: Implement role-based permission templates and site-specific access control

### Deliverables

- Permission Templates UI for managing role permissions
- Template-based access control in navigation and APIs
- Per-site role assignments
- Backend permission enforcement

### Tasks

#### 1.1 Permission Templates Management

- [ ] Create `app/api/v1/role-templates/route.js` - Template CRUD API
- [ ] Create `app/api/v1/role-templates/[id]/route.js` - Individual template API
- [ ] Create `app/hr/settings/permission-templates/page.jsx` - Template list page
- [ ] Create `components/hr/PermissionTemplateList.jsx` - List component
- [ ] Create `components/hr/CreatePermissionTemplateForm.jsx` - Create/edit form
- [ ] Create `components/hr/PermissionMatrix.jsx` - Checkbox matrix (modules × actions)
- [ ] Create `components/hr/PermissionPreview.jsx` - Permission summary component
- [ ] Create `lib/utils/permissions.js` - Permission checking utilities

#### 1.2 Template-Based Access Control

- [ ] Update `lib/config/modules.js` - Use template permissions
- [ ] Update navigation components - Filter menu items by template permissions
- [ ] Create `lib/middleware/permissionMiddleware.js` - Permission middleware
- [ ] Update all API routes - Use template-based permission checks
- [ ] Update `app/api/v1/employees/route.js` - Template permission checks
- [ ] Update `app/api/v1/timesheets/route.js` - Template permission checks
- [ ] Update `app/api/v1/payroll-runs/route.js` - Template permission checks
- [ ] Update remaining API routes (alerts, incidents, inspections, etc.)

#### 1.3 Per-Site Role Assignment

- [ ] Update `lib/models/EmployeeSite.js` - Add `roleTemplateId` field
- [ ] Create migration script - Add roleTemplateId to existing EmployeeSite records
- [ ] Update `app/hr/sites/page.jsx` - Show role templates per site
- [ ] Update `components/hr/SiteList.jsx` - Manage site-specific role templates
- [ ] Create `lib/utils/sitePermissions.js` - Site-based access check utilities
- [ ] Update site-specific API routes - Check site permissions

#### 1.4 Testing & Validation

- [ ] Test permission template creation/editing
- [ ] Test navigation filtering by permissions
- [ ] Test API route permission enforcement
- [ ] Test site-specific access control
- [ ] Verify default templates are seeded correctly

**Dependencies**: None (foundation milestone)
**Blocks**: All subsequent milestones (access control required)

---

## 🎯 MILESTONE 2: Site-Specific QR & Attendance Events

**Duration**: 1-2 weeks
**Priority**: Critical
**Goal**: Implement site-specific QR codes and event-based attendance tracking

### Deliverables

- Site-specific QR token system
- QR code generation and management per site
- Attendance event model for IN/OUT tracking
- Enhanced geofencing with site-specific validation

### Tasks

#### 2.1 Site QR Token System

- [ ] Create `lib/models/SiteQRToken.js` - QR token model
- [ ] Create `app/api/v1/sites/[id]/qr-token/route.js` - Generate/get QR token
- [ ] Create `app/api/v1/sites/[id]/qr-token/regenerate/route.js` - Regenerate token
- [ ] Create `lib/utils/qrGenerator.js` - Site-specific QR generation utility
- [ ] Update `app/hr/sites/page.jsx` - Add QR preview section
- [ ] Update `components/hr/SiteList.jsx` - Add QR download (PNG/PDF) buttons
- [ ] Update `components/hr/SiteList.jsx` - Add "Regenerate QR" action
- [ ] Create `app/qr/[token]/page.jsx` - QR scanning route (resolves site_id)

#### 2.2 Attendance Event Model

- [ ] Create `lib/models/AttendanceEvent.js` - Event model (IN/OUT events)
- [ ] Create `lib/models/AuditLog.js` - Audit log for denied scans
- [ ] Update `app/api/v1/attendance/mark/route.js` - Create event records
- [ ] Update `app/api/v1/attendance/mark/route.js` - Log denied scans to audit log
- [ ] Create `app/api/v1/attendance/events/route.js` - List events API

#### 2.3 Enhanced Geofencing

- [ ] Update `app/attendance/scan/page.jsx` - Use site-specific QR tokens
- [ ] Update `app/api/v1/attendance/mark/route.js` - Resolve site from QR token
- [ ] Update `app/api/v1/attendance/mark/route.js` - Site-specific radius validation
- [ ] Update `app/hr/sites/page.jsx` - Add radius toggle UI (20/50/100 meters)
- [ ] Update `components/hr/SiteList.jsx` - Radius configuration component

#### 2.4 Testing & Validation

- [ ] Test QR token generation per site
- [ ] Test QR code scanning and site resolution
- [ ] Test geofencing with site-specific radius
- [ ] Test attendance event creation (IN/OUT)
- [ ] Test audit log for denied scans
- [ ] Test QR regeneration (invalidates old QR)

**Dependencies**: Milestone 1 (permissions)
**Blocks**: Milestone 3 (timesheet generation needs events)

---

## 🎯 MILESTONE 3: Automated Timesheet Generation

**Duration**: 1 week
**Priority**: Critical
**Goal**: Auto-generate timesheets from attendance events with manual adjustment capability

### Deliverables

- Automatic timesheet generation from IN/OUT events
- Multiple shifts per day handling
- Missing OUT event detection
- Manual adjustment UI with audit trail

### Tasks

#### 3.1 Timesheet Auto-Generation Service

- [ ] Create `lib/services/timesheetGenerator.js` - Auto-generation service
- [ ] Implement IN/OUT event pairing logic
- [ ] Handle multiple shifts per day
- [ ] Flag missing OUT events
- [ ] Create `app/api/v1/timesheets/auto-generate/route.js` - Auto-generation endpoint
- [ ] Create scheduled job/cron - Daily timesheet generation

#### 3.2 Timesheet UI Enhancements

- [ ] Update `app/hr/timesheets/page.jsx` - Show source (QR/MANUAL)
- [ ] Update `components/hr/TimesheetList.jsx` - Display source indicator
- [ ] Create `app/site-manager/timesheets/page.jsx` - Site Manager view (their sites only)
- [ ] Update `app/hr/timesheets/page.jsx` - HR view (all sites)
- [ ] Add lock period logic - Lock timesheets after payroll run
- [ ] Create `components/hr/TimesheetAdjustmentModal.jsx` - Manual adjustment UI
- [ ] Add audit trail to manual adjustments

#### 3.3 Timesheet Status & Workflow

- [ ] Update timesheet model - Add `source` field (QR/MANUAL)
- [ ] Update timesheet model - Add `adjustments` array with audit trail
- [ ] Update timesheet approval workflow - Show adjustment history
- [ ] Add error handling improvements - Better error messages

#### 3.4 Testing & Validation

- [ ] Test auto-generation from paired events
- [ ] Test multiple shifts per day
- [ ] Test missing OUT event flagging
- [ ] Test manual adjustment with audit trail
- [ ] Test site manager filtering (only their sites)
- [ ] Test timesheet locking after payroll run

**Dependencies**: Milestone 2 (attendance events)
**Blocks**: Milestone 4 (payroll needs accurate timesheets)

---

## 🎯 MILESTONE 4: Complete Payroll System (UK/EU)

**Duration**: 2 weeks
**Priority**: Critical
**Goal**: Full UK payroll calculation engine with proper tax, NI, and pension deductions

### Deliverables

- Complete UK payroll calculation (PAYE, NI, Pension)
- PayrollItem model for per-employee breakdown
- Enhanced payroll UI with full breakdown
- CSV export functionality

### Tasks

#### 4.1 Payroll Data Structures

- [ ] Create `lib/models/PayrollItem.js` - Per-employee payroll item model
- [ ] Update `lib/models/PayrollRun.js` - Link to PayrollItem records
- [ ] Create migration - Link existing payroll runs to items

#### 4.2 UK Payroll Calculation Engine

- [ ] Update `lib/services/payrollCalculator.js` - Implement full UK calculation
- [ ] Implement PAYE calculation - Use TaxConfig with tax bands
- [ ] Implement NI calculation - Employee NI (12%/2%) using NIConfig
- [ ] Implement NI calculation - Employer NI (13.8%) using NIConfig
- [ ] Implement pension contributions - Employee & employer using PensionConfig
- [ ] Implement student loan deductions - Plan 1/2/4/Postgraduate
- [ ] Implement other deductions - From employee.payroll.otherDeductions
- [ ] Calculate regular vs OT hours - Separate regular and overtime
- [ ] Calculate employer cost - Gross + Employer NI + Employer Pension
- [ ] Update `app/api/v1/payroll-runs/[id]/calculate/route.js` - Use new calculator

#### 4.3 Payroll UI Enhancements

- [ ] Update `components/hr/PayrollRunDetail.jsx` - Add employee breakdown table
- [ ] Add table columns: Employee, Site(s), Hours (regular/OT), Pay Rate(s), Gross, PAYE, NI EE, NI ER, Pension EE, Pension ER, Other Deductions, Net, Employer Cost
- [ ] Add "Timesheets Included" section - List timesheets with links
- [ ] Add "Calculate" button - Re-run calculations
- [ ] Add "Approve Run" button - Approve payroll run
- [ ] Update stats cards - Show NI, Pension breakdowns

#### 4.4 Payroll Exports

- [ ] Create `lib/services/payrollExport.js` - CSV export service
- [ ] Update `app/api/v1/payroll-runs/[id]/export/route.js` - Add CSV export
- [ ] Add CSV export button to UI
- [ ] Verify JSON export works correctly

#### 4.5 Testing & Validation

- [ ] Test PAYE calculation with different tax bands
- [ ] Test NI calculation (employee and employer)
- [ ] Test pension contributions
- [ ] Test student loan deductions
- [ ] Test regular vs OT hours separation
- [ ] Test CSV export format
- [ ] Validate calculations against UK tax rates (2024-2025)

**Dependencies**: Milestone 3 (timesheets)
**Blocks**: Milestone 5 (reports need payroll data)

---

## 🎯 MILESTONE 5: Plant & Machinery Module + Standard Reports

**Duration**: 2 weeks
**Priority**: Important
**Goal**: Rename Tools to Plant & Machinery, add advanced features, and implement standard reports

### Deliverables

- Renamed Plant & Machinery module with enhanced fields
- Barcode integration for plant items
- Plant usage logs and inspections
- Standard reports (Timesheet, Payroll, Certification, Plant Usage)

### Tasks

#### 5.1 Plant & Machinery Module Rename

- [ ] Update `lib/models/Tool.js` - Add fields: ownership, serial_no, location_site_id, next_inspection_date, service_interval_hours, hours_run_total
- [ ] Update all routes - `/hr/tools` → `/hr/equipment` or `/hr/plant`
- [ ] Update `lib/config/modules.js` - Rename module "Tools" → "Plant & Machinery"
- [ ] Update all UI labels and icons - Change "Tools" to "Plant & Machinery"
- [ ] Create migration script - Update existing tool records

#### 5.2 Plant Form Enhancements

- [ ] Update `components/hr/CreateToolForm.jsx` - Rename to `CreatePlantForm.jsx`
- [ ] Add Ownership dropdown - OWNED/HIRED
- [ ] Add Site dropdown - Current location
- [ ] Group form sections - Basic, Cost/Ownership, Location, Service, Notes
- [ ] Add validation - Mandatory fields
- [ ] Update `components/hr/EditToolModal.jsx` - Same enhancements

#### 5.3 Plant Barcode System

- [ ] Update Plant model - Add `plant_barcode` field (unique)
- [ ] Create `lib/utils/barcodeGenerator.js` - Generate Code128/QR barcode
- [ ] Update Plant detail page - Show barcode image
- [ ] Add "Download Label" button - PNG/PDF download
- [ ] Auto-generate barcode on plant creation

#### 5.4 Plant Quick Actions via Scan

- [ ] Create `app/plant/scan/[barcode]/page.jsx` - Scan route
- [ ] Create `components/plant/PlantScanActions.jsx` - Action menu component
- [ ] Implement "Log hours" action
- [ ] Implement "Perform inspection" action
- [ ] Implement "Assign/Return" action
- [ ] Implement "Report incident" action - Link to EHS form with plant prefilled

#### 5.5 Plant Logs & Inspections

- [ ] Create `lib/models/PlantUsageLog.js` - Hours and assignments log
- [ ] Create `lib/models/PlantInspection.js` - Inspection results & photos
- [ ] Create `app/hr/equipment/overdue/page.jsx` - Overdue tab
- [ ] Update Plant detail page - Show usage logs
- [ ] Update Plant detail page - Show inspection history
- [ ] Add overdue indicators - Plants with overdue return or inspection

#### 5.6 Standard Reports

- [ ] Create `app/hr/reports/timesheet-summary/page.jsx` - Timesheet summary report
- [ ] Create `app/hr/reports/payroll-summary/page.jsx` - Payroll summary report
- [ ] Create `app/hr/reports/certification-status/page.jsx` - Certification status report
- [ ] Create `app/hr/reports/plant-usage/page.jsx` - Plant & Machinery usage report
- [ ] Add filters to each report - Date range, site, employee, etc.
- [ ] Add CSV export to each report
- [ ] Update `app/hr/reports/page.jsx` - Add navigation to new reports

#### 5.7 Testing & Validation

- [ ] Test plant creation with all new fields
- [ ] Test barcode generation and scanning
- [ ] Test plant quick actions
- [ ] Test usage logs and inspections
- [ ] Test overdue detection
- [ ] Test all standard reports with filters
- [ ] Test CSV exports from reports

**Dependencies**: Milestone 4 (payroll reports need payroll data)
**Blocks**: None (can proceed in parallel with Milestone 6)

---

## 🎯 MILESTONE 6: Cross-Cutting Features & Polish

**Duration**: 1-2 weeks
**Priority**: Important
**Goal**: Add audit logging, improve notifications, verify security, and complete employee form enhancements

### Deliverables

- Global audit log system
- Consistent toast notifications
- Enhanced employee forms
- Security verification and improvements

### Tasks

#### 6.1 Global Audit Log

- [ ] Create `lib/models/AuditLog.js` - Global audit log model
- [ ] Create `lib/middleware/auditMiddleware.js` - Audit middleware
- [ ] Apply audit middleware to all API routes
- [ ] Create `app/hr/audit-log/page.jsx` - Audit log viewer (HR/Admin only)
- [ ] Add audit log filtering - By user, action, date range

#### 6.2 Toast Notifications

- [ ] Create `lib/utils/toast.js` - Toast utility wrapper
- [ ] Update `components/hr/CreateEmployeeForm.jsx` - Use toast for success/error
- [ ] Update `components/hr/EditEmployeeModal.jsx` - Use toast
- [ ] Update all forms - Consistent toast usage
- [ ] Add toast to API error handlers

#### 6.3 Employee Form Enhancements

- [ ] Verify `components/hr/CreateEmployeeForm.jsx` - All fields included
- [ ] Verify `components/hr/EditEmployeeModal.jsx` - All fields included
- [ ] Add role template dropdown - Link to role templates
- [ ] Add primary site dropdown - Link to sites
- [ ] Add inline validations - Email format, required fields, numeric validation
- [ ] Add toast notifications - Success/error messages
- [ ] Add redirect after successful create - To employee list or detail

#### 6.4 Security Verification

- [ ] Audit all API routes - Verify permission checks
- [ ] Update any missing permission checks
- [ ] Verify template-based permissions work correctly
- [ ] Test site-specific access control
- [ ] Verify all protected routes are secured
- [ ] Add security headers if needed

#### 6.5 Mobile Responsiveness Verification

- [ ] Verify worker-facing flows - QR scan, plant scan, certificate upload
- [ ] Test on mobile devices - iOS and Android
- [ ] Fix any mobile-specific issues
- [ ] Verify touch targets are adequate (min 44px)

#### 6.6 Testing & Validation

- [ ] Test audit log captures all actions
- [ ] Test toast notifications across all forms
- [ ] Test employee form with all validations
- [ ] Security audit - All routes protected
- [ ] Mobile testing - All critical flows work
- [ ] Performance testing - API response times

**Dependencies**: All previous milestones
**Blocks**: None (final milestone)

---

## 📊 Milestone Summary

| Milestone | Duration | Priority | Dependencies | Key Deliverables |
|-----------|----------|----------|--------------|------------------|
| **M1: Permission & Access Control** | 1-2 weeks | Critical | None | Permission templates UI, template-based access control |
| **M2: Site QR & Attendance Events** | 1-2 weeks | Critical | M1 | Site-specific QR, attendance events, enhanced geofencing |
| **M3: Automated Timesheets** | 1 week | Critical | M2 | Auto-generation from events, manual adjustments |
| **M4: Complete Payroll System** | 2 weeks | Critical | M3 | UK payroll calculations, enhanced UI, CSV export |
| **M5: Plant & Machinery + Reports** | 2 weeks | Important | M4 | Module rename, barcodes, logs, standard reports |
| **M6: Cross-Cutting & Polish** | 1-2 weeks | Important | All | Audit log, notifications, security, mobile verification |

**Total Estimated Duration**: 8-11 weeks

---

## 🎯 Success Criteria

### Milestone 1

- ✅ HR can create/edit permission templates
- ✅ Navigation filters by template permissions
- ✅ All API routes enforce template permissions
- ✅ Site-specific role assignments work

### Milestone 2

- ✅ Each site has unique QR code
- ✅ QR codes can be regenerated
- ✅ Attendance events are created for IN/OUT
- ✅ Geofencing validates against site-specific radius

### Milestone 3

- ✅ Timesheets auto-generate from events
- ✅ Multiple shifts per day handled
- ✅ Missing OUT events flagged
- ✅ Manual adjustments have audit trail

### Milestone 4

- ✅ Payroll calculates PAYE, NI, Pension correctly
- ✅ Employee breakdown table shows all columns
- ✅ CSV export works
- ✅ Calculations match UK tax rates

### Milestone 5

- ✅ Tools renamed to Plant & Machinery
- ✅ Barcode scanning works
- ✅ Plant logs and inspections functional
- ✅ All standard reports work with filters and exports

### Milestone 6

- ✅ Audit log captures all actions
- ✅ Toast notifications consistent
- ✅ Employee forms complete with validations
- ✅ Security verified and mobile tested