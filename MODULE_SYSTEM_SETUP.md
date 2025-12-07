# Module Subscription System Setup Guide

## Overview

This system implements a modular subscription model where users can purchase individual modules or all modules at a discounted price. Each module provides access to specific features and dashboards.

## Modules Available

1. **HRM (Human Resource Management)** - `/hr`
   - Employees, payroll, timesheets, leave requests, certifications
   - Price: $99

2. **Registers** - `/registers`
   - Attendance tracking, certifications, employee registers
   - Price: $49

3. **Process Management** - `/site-manager`
   - Daily logs, attendance verification, site process management
   - Price: $79

4. **Finance & Payrolls** - `/hr/payroll`
   - Payroll processing, timesheet management, financial reporting
   - Price: $129

5. **Equipment Management** - `/hr/tools`
   - Tools, equipment assignments, maintenance tracking
   - Price: $59

6. **Procurement** - `/procurement`
   - Purchase orders, vendor management, procurement workflows
   - Price: $89

**Buy All Price:** $384 (20% discount from $480)

## Setup Instructions

### Step 1: Initialize Modules in Database

Run the initialization script to create module records in the database:

```bash
node scripts/init-modules.js
```

This will create all 6 modules with their prices and configurations.

### Step 2: Give Random Modules to Existing Users

Run the migration script to assign 2-4 random modules to each existing active user:

```bash
node scripts/give-random-modules.js
```

This will:
- Give each active employee 2-4 random modules
- Make them admin for those modules
- Create UserSubscription records

### Step 3: Verify Setup

1. Log in as any user
2. Navigate to `/modules` to see the marketplace
3. Navigate to `/modules-dashboard` to see purchased modules
4. Try purchasing a module (no payment required, just clicks "Buy")

## How It Works

### Database Models

1. **Module** - Stores module definitions (code, name, price, features)
2. **UserSubscription** - Tracks which users have purchased which modules
3. **Employee.purchasedModules** - Array field storing purchased modules

### Access Control

- **Module Access Check**: Pages check if user has purchased the required module
- **Server-side**: Use `checkModuleAccessServer(moduleCode)` in server components
- **Client-side**: Use `<ModuleAccessGuard>` component to protect routes

### Key Routes

- `/modules` - Module marketplace (browse and purchase)
- `/modules-dashboard` - Unified dashboard showing purchased modules
- `/dashboard` - Redirects to modules-dashboard if user has modules

### Module Access in Pages

Example server component:
```javascript
import { checkModuleAccessServer } from '@/lib/utils/checkModuleAccessServer';

export default async function MyPage() {
  const { hasAccess } = await checkModuleAccessServer('hrm');
  if (!hasAccess) {
    redirect('/modules?required=hrm');
  }
  // ... rest of page
}
```

Example client component:
```javascript
import ModuleAccessGuard from '@/components/modules/ModuleAccessGuard';

export default function MyPage() {
  return (
    <ModuleAccessGuard moduleCode="hrm" moduleName="Human Resource Management">
      {/* Your page content */}
    </ModuleAccessGuard>
  );
}
```

## API Endpoints

### GET `/api/v1/modules`
Get all available modules with purchase status for current user.

### POST `/api/v1/modules/purchase`
Purchase modules.

**Body:**
```json
{
  "moduleCodes": ["hrm", "registers"],  // For specific modules
  "buyAll": false  // Set to true to buy all modules
}
```

## Features

- ✅ Modular subscription system
- ✅ Individual module purchase
- ✅ "Buy All" option with 20% discount
- ✅ Module access control
- ✅ Unified module dashboard
- ✅ Random module assignment for existing users
- ✅ Role-based access still works alongside modules

## Notes

- Payment integration is not implemented yet - clicking "Buy" immediately grants access
- Only the purchaser becomes admin for a module
- Existing users get 2-4 random modules assigned
- Role-based system continues to work alongside module system


