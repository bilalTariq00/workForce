# Quick Module Setup Guide

## Problem: No Modules Showing on Landing Page

If you don't see any modules on the landing page, you need to initialize them in the database first.

## Solution: Run These Commands

### Step 1: Initialize Modules in Database

```bash
node scripts/init-modules.js
```

This will create 6 modules:
- HRM ($99)
- Registers ($49)
- Process Management ($79)
- Finance & Payrolls ($129)
- Equipment Management ($59)
- Procurement ($89)

### Step 2: (Optional) Give Random Modules to Existing Users

```bash
node scripts/give-random-modules.js
```

This gives each active user 2-4 random modules.

## Verify It Worked

1. Refresh your landing page (`/`)
2. You should now see 6 modules displayed
3. If logged in, you'll see your name and email in the header
4. Click "Buy Now" on any module to purchase it
5. After purchase, you become the admin/owner of that module

## How Purchase Works

When a user clicks "Buy Now":
1. If not logged in → redirects to login
2. After login → returns to modules page
3. Purchase is associated with `session.user.id` (the logged-in user's ID)
4. User automatically becomes `isAdmin: true` for purchased modules
5. Module is added to `employee.purchasedModules` array
6. `UserSubscription` record is created

## Troubleshooting

**No modules showing?**
- Run `node scripts/init-modules.js`
- Check MongoDB connection
- Check browser console for errors

**Can't purchase modules?**
- Make sure you're logged in
- Check that modules exist in database
- Check API route `/api/v1/modules/purchase` is working

**User info not showing?**
- Make sure you're logged in
- Check session is valid
- Check `session.user.name` and `session.user.email` exist

