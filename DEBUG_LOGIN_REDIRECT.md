# 🔍 Debug Login Redirect Issue

## Problem
User is being redirected back to login screen when accessing `/labour/dashboard`.

## Possible Causes

### 1. Session Not Found
- **Check:** Vercel logs for `[LABOUR DASHBOARD] No session found`
- **Cause:** NextAuth session not being created or maintained
- **Fix:** Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables

### 2. Wrong Role
- **Check:** Vercel logs for `[LABOUR DASHBOARD] Wrong role:`
- **Cause:** User's role is not 'labour'
- **Fix:** Verify employee role in database

### 3. Employee Not Found (MOST LIKELY)
- **Check:** Vercel logs for `[LABOUR DASHBOARD] Employee not found for ID:`
- **Cause:** `session.user.id` doesn't match any employee `_id` in database
- **Fix:** 
  - Check if employee exists in database
  - Verify `session.user.id` matches employee `_id`
  - Check if employee status is 'active'

### 4. Database Connection Error
- **Check:** Vercel logs for `[LABOUR DASHBOARD] Database connection error:`
- **Cause:** MongoDB connection failing
- **Fix:** Check `MONGODB_URI` environment variable

## Changes Made

### 1. Better Error Handling
- Changed from redirecting to showing error message when employee not found
- Added detailed logging at each step
- Added error message display instead of silent redirect

### 2. Middleware Update
- Added `/labour/:path*` to middleware matcher
- Added other role paths to middleware

### 3. Debugging Logs
All logs are prefixed with `[LABOUR DASHBOARD]` for easy filtering:
- Session found/not found
- User ID and role
- Database connection status
- Employee lookup results

## How to Debug

### Step 1: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter for `[LABOUR DASHBOARD]`
3. Look for error messages

### Step 2: Verify Employee Exists
1. Login as HR
2. Go to `/hr/employees`
3. Find the employee that's trying to login
4. Check:
   - Employee ID matches
   - Status is 'active'
   - Role is 'labour'

### Step 3: Check Session Data
The page now shows the session user ID in the error message if employee not found.

### Step 4: Verify Environment Variables
Make sure these are set in Vercel:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (without trailing slash)
- `MONGODB_URI`

## Expected Behavior

### If Employee Not Found:
- **Before:** Silent redirect to login
- **After:** Shows error message with:
  - Explanation of the issue
  - Session User ID for debugging
  - Instructions to contact HR

### If Database Error:
- **Before:** Silent redirect to login
- **After:** Shows error message instead of redirecting

## Testing

1. **Login as labour employee**
2. **Navigate to `/labour/dashboard`**
3. **Check:**
   - If employee exists: Should show dashboard
   - If employee not found: Should show error message (not redirect)
   - Check Vercel logs for detailed information

## Common Issues

### Issue: Employee ID Mismatch
**Symptom:** Employee not found error
**Cause:** `session.user.id` (from JWT token) doesn't match employee `_id` in database
**Fix:** 
- Check if employee was created with correct `_id`
- Verify JWT token contains correct user ID
- May need to logout and login again

### Issue: Employee Status Inactive
**Symptom:** Employee not found error
**Cause:** Employee exists but status is not 'active'
**Fix:** Update employee status to 'active' in database

### Issue: Session Expired
**Symptom:** No session found
**Cause:** JWT token expired or invalid
**Fix:** Logout and login again

## Next Steps

1. **Deploy the changes**
2. **Check Vercel logs** when accessing the page
3. **Look for the `[LABOUR DASHBOARD]` log messages**
4. **Share the logs** if issue persists

---

**Last Updated:** $(date)

