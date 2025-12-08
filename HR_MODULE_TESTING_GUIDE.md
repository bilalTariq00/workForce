# HR Module Testing Guide - Phases 1-4

This guide will help you test all the features implemented in Phases 1-4 of the HR Management module.

## Prerequisites

1. **Database Setup**
   - Ensure MongoDB is running and connected
   - Run seed scripts if needed:
     ```bash
     node scripts/seed-role-templates.js
     node scripts/seed-uk-tax-config.js
     ```

2. **Authentication**
   - You need to be logged in as an HR Officer or Admin
   - Test user should have the `hr_officer` or `admin` role

3. **Access URLs**
   - HR Dashboard: `/hr/dashboard`
   - Employee List: `/hr/employees`
   - Create Employee: `/hr/create-employee`

---

## Phase 1: Foundation Models Testing

### Test 1.1: Verify Models Exist
**Location:** Database/Code

**Steps:**
1. Check that these models are created:
   - `EmployeeSite` (multi-site assignments)
   - `RoleTemplate` (permission templates)
   - `TaxConfig`, `NIConfig`, `PensionConfig` (UK payroll configs)

**Expected Result:**
- All models should be in `lib/models/` directory
- No compilation errors

---

### Test 1.2: Seed Scripts Execution
**Location:** Terminal

**Steps:**
```bash
# Run role templates seed
node scripts/seed-role-templates.js

# Run UK tax config seed
node scripts/seed-uk-tax-config.js
```

**Expected Result:**
- Scripts execute without errors
- Console shows "Seeded successfully" messages
- Database contains default role templates and tax configs

**Verify in Database:**
- `RoleTemplate` collection has entries (admin, hr_officer, site_manager, etc.)
- `TaxConfig` collection has 2024/2025 tax year data
- `NIConfig` collection has NI rates
- `PensionConfig` collection has pension schemes

---

## Phase 2: Multi-Site Management Testing

### Test 2.1: Create Employee with Multi-Site Assignment
**Location:** `/hr/create-employee`

**Steps:**
1. Navigate to Create Employee page
2. Fill in basic information:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "john.doe@test.com"
   - Phone: "1234567890"
   - Role: "Labour"
   - Password: "password123"
3. In the "Assign to Sites" section:
   - Click "Add a site..." dropdown
   - Select a site (e.g., "Site A")
   - Verify the site appears in "Assigned Sites" list
   - Add another site (e.g., "Site B")
   - Set one as "Primary" by clicking "Set Primary"
4. Submit the form

**Expected Result:**
- Employee is created successfully
- Redirected to employee list
- Employee appears in the list
- Both sites are assigned to the employee
- One site is marked as primary

**Verify:**
- Check employee detail page: `/hr/employees/[employeeId]`
- Go to "Sites" tab
- Should see both site assignments
- One should have "Primary" badge

---

### Test 2.2: View Employee with Multi-Site Assignments
**Location:** `/hr/employees`

**Steps:**
1. Navigate to Employee List
2. Find the employee created in Test 2.1
3. Check the "Sites" column (desktop) or site badges (mobile)

**Expected Result:**
- Employee row shows assigned sites
- Primary site has a star (★) indicator
- Sites are displayed as badges

---

### Test 2.3: Edit Employee - Add/Remove Sites
**Location:** `/hr/employees` → Click Edit on an employee

**Steps:**
1. Click "Edit" button on an employee
2. In the "Assign to Sites" section:
   - Add a new site
   - Remove an existing site
   - Change primary site
3. Save changes

**Expected Result:**
- Changes are saved successfully
- Site assignments are updated
- Primary site is updated

**Verify:**
- Go to employee detail page
- Check "Sites" tab
- Verify site assignments match your changes

---

### Test 2.4: EmployeeSite API Endpoints
**Location:** API Testing (Postman/Thunder Client/Browser DevTools)

**Test GET:**
```bash
GET /api/v1/employees/[employeeId]/sites
Headers: Authorization required
```

**Expected Result:**
- Returns array of site assignments
- Each assignment includes site details, role, isPrimary flag

**Test POST:**
```bash
POST /api/v1/employees/[employeeId]/sites
Body: {
  "siteId": "[siteId]",
  "role": "labour",
  "isPrimary": false
}
```

**Expected Result:**
- New site assignment created
- Returns 201 status with assignment data

**Test PATCH:**
```bash
PATCH /api/v1/employees/[employeeId]/sites/[siteId]
Body: {
  "isPrimary": true
}
```

**Expected Result:**
- Assignment updated
- Other primary assignments set to false

**Test DELETE:**
```bash
DELETE /api/v1/employees/[employeeId]/sites/[siteId]
```

**Expected Result:**
- Assignment removed
- Returns 200 with deleted data

---

## Phase 3: Employee Profile Extensions Testing

### Test 3.1: Create Employee with HR Data
**Location:** `/hr/create-employee`

**Steps:**
1. Navigate to Create Employee page
2. Fill in "Basic Information" tab:
   - First Name, Last Name, Email, Phone, Role, Password
3. Click "HR Data" tab:
   - Date of Birth: Select a date
   - National Insurance Number: Enter "AB123456C"
   - Emergency Contact:
     - Name: "Jane Doe"
     - Relationship: "Spouse"
     - Phone: "0987654321"
   - Employment Details:
     - Start Date: Select a date
     - Employment Type: "Full Time"
     - Department: "Construction"
     - Position: "Site Worker"
4. Click "Payroll Data" tab:
   - Pay Type: "Hourly"
   - Currency: "GBP"
   - Tax Code: "1250L"
   - Pension Scheme: "Auto Enrolment"
   - Pension Contribution: "5"
   - Student Loan: Check if applicable
5. Submit form

**Expected Result:**
- Employee created with all HR and Payroll data
- All tabs save data correctly
- No validation errors

**Verify:**
- Go to employee detail page
- Check "HR Data" tab - should show all entered information
- Check "Payroll" tab - should show all payroll data

---

### Test 3.2: View Employee Profile with All Data
**Location:** `/hr/employees/[employeeId]`

**Steps:**
1. Navigate to an employee detail page
2. Check each tab:
   - **Overview Tab:**
     - Personal information
     - Employment information
     - Contact details
   - **HR Data Tab:**
     - Date of Birth
     - National Insurance Number
     - Emergency Contact
     - Employment Details
   - **Payroll Tab:**
     - Pay Type, Currency
     - Tax Code
     - Pension information
     - Student Loan status
   - **Sites Tab:**
     - Site assignments
     - Primary site indicator

**Expected Result:**
- All tabs display data correctly
- Dates are formatted properly
- All fields show expected values

---

### Test 3.3: Edit Employee - Update HR/Payroll Data
**Location:** `/hr/employees` → Click Edit

**Steps:**
1. Click "Edit" on an employee
2. Navigate through tabs:
   - **Basic Information:** Update phone number
   - **HR Data:** Update emergency contact phone
   - **Payroll Data:** Update pension contribution percentage
3. Save changes

**Expected Result:**
- Changes saved successfully
- Updated data appears in employee detail page

**Verify:**
- Go to employee detail page
- Check that updated fields show new values

---

### Test 3.4: Form Validation
**Location:** `/hr/create-employee`

**Test Cases:**
1. **Required Fields:**
   - Try submitting without first name → Should show error
   - Try submitting without email → Should show error
   - Try submitting without password → Should show error

2. **Email Format:**
   - Enter invalid email (e.g., "notanemail") → Should show validation error

3. **National Insurance Number:**
   - Enter invalid format (e.g., "123456") → Should show error
   - Enter valid format (e.g., "AB123456C") → Should accept

4. **Date Validation:**
   - Enter expiry date before issue date → Should show error
   - Enter valid dates → Should accept

**Expected Result:**
- All validation errors display correctly
- Form prevents submission with invalid data
- Error messages are clear and helpful

---

## Phase 4: Certificates & Attachments Testing

### Test 4.1: Upload Certificate via File Upload
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Navigate to employee detail page
2. Click "Certificates" tab
3. Click "Upload Certificate" button
4. Fill in form:
   - Certificate Type: "SafePass"
   - Certificate Number: "SP123456" (optional)
   - Issue Date: Select a date
   - Expiry Date: Select a date (after issue date)
   - Upload Method: Select "File Upload"
   - Document: Click to upload a PDF or image file
   - Notes: "Test certificate" (optional)
5. Click "Upload Certificate"

**Expected Result:**
- File uploads successfully
- Certificate appears in the list
- Status shows "Pending Validation"
- Upload form closes

**Verify:**
- Certificate appears in list with correct type
- Status badge shows "Pending Validation"
- Issue and expiry dates are correct

---

### Test 4.2: Upload Certificate via Camera
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Navigate to employee detail page
2. Click "Certificates" tab
3. Click "Upload Certificate"
4. Click "Camera" button
5. Allow camera access (if prompted)
6. Take a photo or select from gallery
7. Fill in certificate details
8. Submit

**Expected Result:**
- Camera opens (on mobile/device with camera)
- Photo is captured/selected
- Preview shows the image
- Certificate uploads with uploadMethod: "camera"

**Note:** Camera capture works best on mobile devices. On desktop, it may open file picker.

---

### Test 4.3: Validate Certificate (Approve)
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Find a certificate with "Pending Validation" status
2. Click the green checkmark (✓) button
3. Confirm approval

**Expected Result:**
- Certificate status changes to "Valid"
- Status badge updates to green "Valid"
- Validated By field shows your name
- Validated At timestamp is set

---

### Test 4.4: Validate Certificate (Reject)
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Find a certificate with "Pending Validation" status
2. Click the red X (✗) button
3. Certificate is rejected

**Expected Result:**
- Certificate status changes to "Rejected"
- Status badge shows "Rejected"
- Rejection reason is displayed (if provided)
- Certificate can be updated and resubmitted

---

### Test 4.5: Certificate Expiry Status
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Test Cases:**

1. **Valid Certificate:**
   - Upload certificate with expiry date > 30 days away
   - Approve it
   - Status should show "Valid" (green badge)

2. **Expiring Soon:**
   - Upload certificate with expiry date < 30 days away
   - Approve it
   - Status should show "Expiring Soon (Xd)" (yellow badge)
   - Shows days until expiry

3. **Expired Certificate:**
   - Upload certificate with expiry date in the past
   - Status should automatically show "Expired" (red badge)
   - Or manually set expiry date to past date and save

**Expected Result:**
- Status badges update correctly based on expiry date
- Expiring soon certificates show warning
- Expired certificates are clearly marked

---

### Test 4.6: Download Certificate
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Find a certificate in the list
2. Click the download icon (↓)
3. File should download/open in new tab

**Expected Result:**
- Certificate document opens/downloads
- File is accessible
- URL is correct

---

### Test 4.7: Delete Certificate
**Location:** `/hr/employees/[employeeId]` → Certificates Tab

**Steps:**
1. Find a certificate
2. Click the trash icon (🗑️)
3. Confirm deletion

**Expected Result:**
- Confirmation dialog appears
- Certificate is removed from list
- Certificate is deleted from database

---

### Test 4.8: Certificate API Endpoints
**Location:** API Testing

**Test GET:**
```bash
GET /api/v1/employees/[employeeId]/certificates
```

**Expected Result:**
- Returns array of certificates for employee
- Includes all certificate details

**Test POST (Upload):**
```bash
POST /api/v1/employees/[employeeId]/certificates
Content-Type: multipart/form-data
Body (FormData):
  - file: [file]
  - type: "SafePass"
  - issueDate: "2024-01-01"
  - expiryDate: "2025-01-01"
  - uploadMethod: "file"
```

**Expected Result:**
- File uploads successfully
- Certificate record created
- Returns 201 with certificate data

**Test PATCH:**
```bash
PATCH /api/v1/employees/[employeeId]/certificates/[certId]
Body: {
  "notes": "Updated notes"
}
```

**Expected Result:**
- Certificate updated
- Returns updated certificate data

**Test DELETE:**
```bash
DELETE /api/v1/employees/[employeeId]/certificates/[certId]
```

**Expected Result:**
- Certificate deleted
- Returns 200 with deleted data

**Test Validate:**
```bash
POST /api/v1/employees/[employeeId]/certificates/[certId]/validate
Body: {
  "action": "approve" // or "reject"
}
```

**Expected Result:**
- Certificate status updated
- ValidatedBy and ValidatedAt set

---

## Integration Testing

### Test I.1: Complete Employee Workflow
**Steps:**
1. Create a new employee with:
   - Basic information
   - HR data
   - Payroll data
   - Multi-site assignments
2. Navigate to employee detail page
3. Upload a certificate
4. Validate the certificate
5. Edit employee to update HR data
6. Add another site assignment
7. View all data in detail page

**Expected Result:**
- All features work together seamlessly
- Data persists correctly
- No errors or conflicts

---

### Test I.2: Multi-Employee Scenario
**Steps:**
1. Create 3-5 employees with different:
   - Roles
   - Site assignments
   - Certificate types
2. View employee list
3. Filter/search employees
4. Check that all employees display correctly

**Expected Result:**
- Employee list shows all employees
- Site assignments display correctly
- No performance issues

---

## Common Issues & Troubleshooting

### Issue 1: "Schema hasn't been registered" Error
**Solution:**
- Ensure all models are imported in the file using them
- Check that `connectDB()` is called before using models

### Issue 2: File Upload Fails
**Solution:**
- Check file size (max 5MB)
- Verify file type (PDF, JPG, PNG only)
- Check Cloudinary/local storage configuration
- Verify `FILE_STORAGE_TYPE` environment variable

### Issue 3: Certificate Status Not Updating
**Solution:**
- Check that expiry date is set correctly
- Verify middleware in EmployeeCertificate model is working
- Manually refresh the page

### Issue 4: Site Assignment Not Showing
**Solution:**
- Verify EmployeeSite model is imported
- Check that `getEmployeeSites()` method is called
- Ensure site assignments are created via API

### Issue 5: Form Validation Errors
**Solution:**
- Check browser console for specific errors
- Verify all required fields are filled
- Check date formats (should be YYYY-MM-DD)
- Verify NI number format (AB123456C)

---

## Performance Testing

### Test P.1: Load Employee List
**Steps:**
1. Create 50+ employees
2. Navigate to employee list
3. Measure load time

**Expected Result:**
- Page loads in < 2 seconds
- No lag when scrolling
- Site assignments load correctly

### Test P.2: Load Employee Detail with Many Certificates
**Steps:**
1. Create employee with 20+ certificates
2. Navigate to employee detail page
3. Click Certificates tab
4. Measure load time

**Expected Result:**
- Certificates load in < 1 second
- No performance degradation

---

## Browser Compatibility Testing

Test in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Key Features to Test:**
- File upload (desktop and mobile)
- Camera capture (mobile)
- Form submission
- Tab navigation
- Responsive design

---

## Security Testing

### Test S.1: Authorization Checks
**Steps:**
1. Log in as different roles:
   - Labour (should not access HR pages)
   - Site Manager (should not access HR pages)
   - HR Officer (should access all HR features)
   - Admin (should access all features)

**Expected Result:**
- Unauthorized users are redirected
- API endpoints return 403 for unauthorized access
- Employees can only view their own certificates

### Test S.2: Input Validation
**Steps:**
1. Try SQL injection in text fields
2. Try XSS in text fields
3. Try uploading malicious files
4. Try invalid date formats

**Expected Result:**
- All inputs are sanitized
- File uploads are validated
- No security vulnerabilities exposed

---

## Checklist Summary

### Phase 1 ✅
- [ ] Models created and accessible
- [ ] Seed scripts run successfully
- [ ] Database contains default data

### Phase 2 ✅
- [ ] Create employee with multi-site
- [ ] View employee with site assignments
- [ ] Edit employee site assignments
- [ ] API endpoints work correctly

### Phase 3 ✅
- [ ] Create employee with HR data
- [ ] Create employee with Payroll data
- [ ] View employee profile with all tabs
- [ ] Edit employee HR/Payroll data
- [ ] Form validation works

### Phase 4 ✅
- [ ] Upload certificate via file
- [ ] Upload certificate via camera
- [ ] Validate certificate (approve)
- [ ] Validate certificate (reject)
- [ ] Certificate expiry status updates
- [ ] Download certificate
- [ ] Delete certificate
- [ ] API endpoints work correctly

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Document issues** in a bug tracker
3. **Optimize performance** if needed
4. **Add missing features** based on feedback
5. **Proceed to Phase 5** (UK Payroll Engine) once all tests pass

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check server logs
3. Verify database connections
4. Review API responses in Network tab
5. Check environment variables

Good luck with testing! 🚀

