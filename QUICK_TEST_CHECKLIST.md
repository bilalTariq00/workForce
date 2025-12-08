# Quick Testing Checklist - HR Module Phases 1-4

## 🚀 Quick Start

1. **Prerequisites:**
   ```bash
   # Run seed scripts
   node scripts/seed-role-templates.js
   node scripts/seed-uk-tax-config.js
   ```

2. **Login:** Use HR Officer or Admin account

3. **Navigate:** `/hr/dashboard` or `/hr/employees`

---

## ✅ Phase 1: Foundation Models

- [ ] Check models exist in `lib/models/`
- [ ] Run seed scripts (no errors)
- [ ] Verify database has role templates
- [ ] Verify database has tax configs

---

## ✅ Phase 2: Multi-Site Management

### Create Employee with Sites
- [ ] Go to `/hr/create-employee`
- [ ] Fill basic info (name, email, role: Labour)
- [ ] Add 2 sites in "Assign to Sites"
- [ ] Set one as Primary
- [ ] Submit → Employee created

### View Sites
- [ ] Go to `/hr/employees`
- [ ] See employee with site badges
- [ ] Click employee → "Sites" tab
- [ ] See both sites, one marked Primary

### Edit Sites
- [ ] Edit employee
- [ ] Add/remove sites
- [ ] Change primary site
- [ ] Save → Changes reflected

---

## ✅ Phase 3: Employee Profile Extensions

### Create with HR/Payroll Data
- [ ] Go to `/hr/create-employee`
- [ ] **Basic Tab:** Fill name, email, phone, role, password
- [ ] **HR Data Tab:**
  - [ ] Date of Birth
  - [ ] NI Number: `AB123456C`
  - [ ] Emergency Contact (name, relationship, phone)
  - [ ] Employment Details (start date, type, department, position)
- [ ] **Payroll Tab:**
  - [ ] Pay Type: Hourly
  - [ ] Currency: GBP
  - [ ] Tax Code: `1250L`
  - [ ] Pension Scheme
  - [ ] Pension Contribution: 5%
- [ ] Submit → Employee created

### View Profile
- [ ] Go to employee detail page
- [ ] **Overview Tab:** See all basic info
- [ ] **HR Data Tab:** See HR info
- [ ] **Payroll Tab:** See payroll info
- [ ] **Sites Tab:** See site assignments

### Edit Profile
- [ ] Edit employee
- [ ] Update HR data (emergency contact phone)
- [ ] Update Payroll data (pension %)
- [ ] Save → Changes reflected

---

## ✅ Phase 4: Certificates & Attachments

### Upload Certificate
- [ ] Go to employee detail → "Certificates" tab
- [ ] Click "Upload Certificate"
- [ ] Fill form:
  - [ ] Type: SafePass
  - [ ] Issue Date
  - [ ] Expiry Date (after issue date)
  - [ ] Upload file (PDF/image)
- [ ] Submit → Certificate appears with "Pending Validation"

### Validate Certificate
- [ ] Find pending certificate
- [ ] Click ✓ (approve) → Status: "Valid"
- [ ] OR click ✗ (reject) → Status: "Rejected"

### Test Expiry Status
- [ ] Upload certificate expiring in < 30 days
- [ ] Approve it
- [ ] See "Expiring Soon (Xd)" badge
- [ ] Upload certificate with past expiry date
- [ ] See "Expired" badge

### Other Actions
- [ ] Download certificate (click ↓)
- [ ] Delete certificate (click 🗑️)

---

## 🔍 Quick Verification

### Check Database
```javascript
// In MongoDB shell or Compass
db.employees.find().count()  // Should have employees
db.employeesites.find().count()  // Should have site assignments
db.employeecertificates.find().count()  // Should have certificates
db.roletemplates.find().count()  // Should have templates
```

### Check API
```bash
# Test endpoints (replace [id] with actual IDs)
GET /api/v1/employees
GET /api/v1/employees/[id]/sites
GET /api/v1/employees/[id]/certificates
```

---

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| "Schema not registered" | Import model in file |
| File upload fails | Check file size (max 5MB) and type (PDF/JPG/PNG) |
| Certificate status not updating | Refresh page or check expiry date |
| Sites not showing | Check EmployeeSite API response |
| Form validation errors | Check browser console for details |

---

## 📱 Mobile Testing

- [ ] Test on mobile device
- [ ] Camera upload works
- [ ] Forms are responsive
- [ ] Tabs work on mobile
- [ ] File upload works

---

## ✅ All Tests Pass?

If all checkboxes are checked:
- ✅ Phase 1: Foundation Models
- ✅ Phase 2: Multi-Site Management  
- ✅ Phase 3: Employee Profile Extensions
- ✅ Phase 4: Certificates & Attachments

**You're ready to proceed to Phase 5!** 🎉

---

## 📝 Notes

Write down any issues you find:

1. _________________________________
2. _________________________________
3. _________________________________

---

**For detailed testing instructions, see:** `HR_MODULE_TESTING_GUIDE.md`

