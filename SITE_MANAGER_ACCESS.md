# How to Access Site Manager Pages

## Quick Access Methods

### Method 1: Direct URL (After Login)
Once logged in as a Site Manager, you can directly access:
```
/site-manager/dashboard
```

### Method 2: Automatic Redirect
- Site Managers are **automatically redirected** to `/site-manager/dashboard` when they:
  - Visit the home page (`/`)
  - Visit the main dashboard (`/dashboard`)
  - Complete attendance (if applicable)

### Method 3: From Personal Dashboard
If you're on the personal dashboard (`/dashboard`), there's a button:
- **"Go to Site Manager Dashboard"** button at the bottom

## Current Routing Logic

### Home Page (`/`)
```
Site Manager → Redirects to → /site-manager/dashboard
```

### Main Dashboard (`/dashboard`)
```
Site Manager → Redirects to → /site-manager/dashboard
```

### Site Manager Dashboard (`/site-manager/dashboard`)
- Shows daily log form/view
- Only accessible to Site Managers
- Requires site assignment (siteId in employee record)

## Requirements

For Site Managers to access their dashboard:

1. **Role**: Must have `role: 'site_manager'` in employee record
2. **Site Assignment**: Must have `siteId` assigned in employee record
3. **Authentication**: Must be logged in

## If You Can't Access

### Error: "You are not assigned to any site"
**Solution**: HR needs to assign you to a site
1. HR goes to `/hr/employees`
2. Finds your employee record
3. Edits and assigns a `siteId`

### Error: "Your assigned site was not found"
**Solution**: The site you're assigned to doesn't exist
1. Contact HR
2. HR should either:
   - Create the missing site
   - Reassign you to an existing site

## Available Pages

### Site Manager Dashboard
- **URL**: `/site-manager/dashboard`
- **Purpose**: Create and manage daily site logs
- **Features**:
  - Create daily log
  - Edit draft logs
  - Lock logs
  - Send logs to Contracts Manager
  - View locked/sent logs

### Attendance Verification (Coming Soon)
- **URL**: `/site-manager/attendance-verification`
- **Purpose**: Compare planned vs actual headcount
- **Status**: Not yet implemented (Sprint-2 Week 2)

## Testing Access

1. **Login as Site Manager**:
   - Use a Site Manager account
   - Should automatically redirect to `/site-manager/dashboard`

2. **Manual Navigation**:
   - Type `/site-manager/dashboard` in browser
   - Should work if you're logged in as Site Manager

3. **Check Site Assignment**:
   - If you see "not assigned to any site" message
   - Contact HR to assign you to a site

## Navigation Flow

```
Login
  ↓
Home Page (/)
  ↓
Check Role
  ↓
Site Manager? → Yes → /site-manager/dashboard
  ↓
No → Check Attendance → /attendance/scan or /dashboard
```

## Future Enhancements

- Add Site Manager navigation menu (similar to HR dashboard)
- Add breadcrumbs
- Add "Back" buttons
- Add quick links in header


