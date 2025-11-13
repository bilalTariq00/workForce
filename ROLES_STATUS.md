# Roles Status in System

## ✅ All 5 Required Roles Are Already Defined

### Current Role Definitions

In `lib/models/Employee.js` (line 37):
```javascript
role: {
  type: String,
  required: true,
  enum: ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin'],
}
```

### Role Mapping

| Required Role | System Role | Status |
|--------------|-------------|--------|
| 1. **Labour / Tradesperson / Sub-contractor** | `labour` | ✅ Defined |
| 2. **Site Manager** | `site_manager` | ✅ Defined |
| 3. **Contracts Manager** | `contracts_manager` | ✅ Defined |
| 4. **HR Officer / Payroll Clerk** | `hr_officer` | ✅ Defined |
| 5. **EHS Manager / Officer** | `ehs_officer` | ✅ Defined |
| **Bonus: Admin** | `admin` | ✅ Defined |

---

## Where Roles Are Used

### 1. Employee Model (`lib/models/Employee.js`)
- ✅ Role enum defined
- ✅ Validation enforced

### 2. Authentication (`lib/auth/config.js`)
- ✅ All roles supported in login
- ✅ Role stored in session

### 3. API Validation (`app/api/v1/employees/route.js`)
- ✅ Zod schema validates all roles
- ✅ Role enum: `['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin']`

### 4. Role-Based Access Control
- ✅ Used throughout the application
- ✅ Pages check roles for access control
- ✅ API endpoints check roles for permissions

---

## Role-Specific Features Implemented

### 1. `labour` (Labour / Tradesperson / Sub-contractor)
- ✅ QR code sign-in/sign-out (LB-01)
- ✅ Leave request form (LB-03)
- ✅ Attendance tracking
- ✅ Personal dashboard

### 2. `site_manager` (Site Manager)
- ✅ Site Manager layout
- ✅ Daily site log (SM-01)
- ✅ Attendance verification (SM-02)
- ✅ Material receipt & PO matching (SM-03)
- ✅ Site Manager dashboard

### 3. `contracts_manager` (Contracts Manager)
- ✅ Contracts Manager layout
- ✅ Multi-site dashboard (CM-01)
- ✅ Dashboard aggregation API
- ✅ Site widgets

### 4. `hr_officer` (HR Officer / Payroll Clerk)
- ✅ HR dashboard layout
- ✅ Employee on-boarding (HR-01)
- ✅ Profile maintenance (HR-02)
- ✅ Timesheet approval (HR-04)
- ✅ Payroll run & export (HR-05)
- ✅ Leave request approval (LB-03)

### 5. `ehs_officer` (EHS Manager / Officer)
- ✅ Role defined in system
- ⚠️ EHS features not yet implemented (EHS-01, EHS-02, EHS-03)
- ✅ Role can be assigned to employees

### 6. `admin` (Admin)
- ✅ Full system access
- ✅ Can access all dashboards
- ✅ Can manage all employees

---

## Role Access Summary

| Role | Dashboard | Pages Access |
|------|-----------|--------------|
| `labour` | Personal dashboard | Attendance scan, Leave request |
| `site_manager` | Site Manager dashboard | Daily logs, Attendance verification |
| `contracts_manager` | Contracts Manager dashboard | Multi-site dashboard, Sites |
| `hr_officer` | HR dashboard | Employees, Timesheets, Payroll, Leave requests |
| `ehs_officer` | (Not yet implemented) | (EHS features coming) |
| `admin` | All dashboards | Full access to all pages |

---

## Verification

All roles are:
- ✅ Defined in Employee model enum
- ✅ Validated in API endpoints
- ✅ Supported in authentication
- ✅ Used in access control
- ✅ Can be assigned when creating employees

**No additional roles need to be added - all 5 required roles are already in the system!**

