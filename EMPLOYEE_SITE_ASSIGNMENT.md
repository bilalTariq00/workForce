# Employee Site Assignment & Annual Leave Balance

## Overview
You can now assign labour workers (and other employees) to sites and set their annual leave balance when creating or editing employees.

## How to Assign a Labour Worker to a Site

### Role-Based Field Display
- **Site Assignment**: Only shown for `labour` and `site_manager` roles
- **Annual Leave Balance**: Only shown for `labour` role
- Other roles (HR Officer, Contracts Manager, EHS Officer, Admin) will not see these fields

### Option 1: During Employee Creation
1. Navigate to **HR Dashboard** → **Create Employee** (`/hr/create-employee`)
2. Fill in the employee details (name, email, phone, etc.)
3. **Select the Role**:
   - For **Labour**: You'll see both "Assign to Site" and "Annual Leave Balance" fields
   - For **Site Manager**: You'll see "Assign to Site" field only
   - For other roles: These fields will be hidden
4. If creating a **Labour** worker:
   - In the **"Assign to Site"** dropdown, select the site (optional)
   - Set the **"Annual Leave Balance"** (in days) - default is 0
5. If creating a **Site Manager**:
   - In the **"Assign to Site"** dropdown, select the site (optional)
6. Click **"Create Employee"**

### Option 2: Edit Existing Employee
1. Navigate to **HR Dashboard** → **Employees** (`/hr/employees`)
2. Click the **Edit** icon (pencil) next to the employee you want to modify
3. **If the employee is a Labour worker**:
   - You'll see both "Assign to Site" and "Annual Leave Balance" fields
   - Update as needed
4. **If the employee is a Site Manager**:
   - You'll see "Assign to Site" field only
   - Update as needed
5. **If changing the role**:
   - Changing from Labour to another role will automatically clear site assignment and leave balance
   - Changing to Labour or Site Manager will show the appropriate fields
6. Click **"Update Employee"**

## Important Notes

### Site Assignment
- **Role-based**: Only `labour` and `site_manager` roles can be assigned to sites
- **Optional**: Site assignment is optional - employees can exist without being assigned to a site
- **Unassignment**: You can unassign an employee from a site by selecting "No Site Assignment"
- **Auto-clear**: If you change an employee's role from `labour` or `site_manager` to another role, the site assignment is automatically cleared
- **Validation**: The system validates that the selected site exists before saving

### Annual Leave Balance
- **Role-based**: Only `labour` role can have an annual leave balance
- **Default**: If not specified, the balance defaults to 0 days
- **Decimal values**: You can enter half-days (e.g., 0.5, 1.5, 25.5)
- **Auto-update**: When a leave request is approved, the balance is automatically deducted
- **Auto-clear**: If you change an employee's role from `labour` to another role, the leave balance is automatically cleared
- **Viewing**: Employees can see their balance when submitting leave requests

## Use Cases

### Creating a New Labour Worker
1. Go to `/hr/create-employee`
2. Fill in:
   - First Name: "John"
   - Last Name: "Smith"
   - Email: "john.smith@example.com"
   - Phone: "07123456789"
   - Role: "Labour / Tradesperson"
   - Assign to Site: "Site A"
   - Annual Leave Balance: "25" (days)
   - Password: (set initial password)
3. Click "Create Employee"

### Reassigning an Employee to a Different Site
1. Go to `/hr/employees`
2. Click Edit on the employee
3. Change "Assign to Site" to the new site
4. Click "Update Employee"

### Updating Annual Leave Balance
1. Go to `/hr/employees`
2. Click Edit on the employee
3. Update "Annual Leave Balance" field (e.g., from 20 to 25 days)
4. Click "Update Employee"

## API Endpoints

### Create Employee (POST `/api/v1/employees`)
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "email": "john@example.com",
  "phone": "07123456789",
  "password": "password123",
  "role": "labour",
  "siteId": "507f1f77bcf86cd799439011",  // Optional
  "annualLeaveBalance": 25  // Optional, defaults to 0
}
```

### Update Employee (PATCH `/api/v1/employees/[id]`)
```json
{
  "siteId": "507f1f77bcf86cd799439011",  // Set to null to unassign
  "annualLeaveBalance": 30
}
```

## Database Fields

- **`siteId`**: ObjectId reference to the Site (nullable)
- **`annualLeaveBalance`**: Number (default: 0, minimum: 0)

## Related Features

- **Leave Requests (LB-03)**: Employees can request leave, and the balance is checked and updated automatically
- **Attendance (LB-01)**: Assigned employees can sign in/out at their assigned site
- **Site Manager Dashboard**: Site Managers can see employees assigned to their site

