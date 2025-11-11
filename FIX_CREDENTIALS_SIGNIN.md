# Fix CredentialsSignin 401 Error

## 🔍 Quick Diagnosis

Visit this URL to see what's wrong:
```
https://work-force-qtya.vercel.app/api/v1/auth-debug
```

This will show you exactly what's missing or misconfigured.

## 🚨 Common Causes & Fixes

### 1. HR Admin Not Initialized

**Symptom:** `hrAdmin.exists: false` in debug output

**Fix:**
1. Visit: `https://work-force-qtya.vercel.app/api/v1/init`
2. Click "Initialize HR Admin" button
3. Wait for success message
4. Try logging in again

### 2. NEXTAUTH_SECRET Not Set

**Symptom:** `hasNextAuthSecret: false` in debug output

**Fix:**
1. Generate secret: `openssl rand -base64 32`
2. Go to Vercel → Settings → Environment Variables
3. Add: `NEXTAUTH_SECRET` = `<generated-secret>`
4. **Redeploy** (important!)

### 3. NEXTAUTH_URL Has Trailing Slash

**Symptom:** `nextAuthUrl` ends with `/`

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Edit `NEXTAUTH_URL`
3. Remove trailing slash: `https://work-force-qtya.vercel.app` (NOT `...app/`)
4. **Redeploy**

### 4. Database Connection Failed

**Symptom:** `database.connected: false` in debug output

**Fix:**
1. Check `MONGODB_URI` is correct in Vercel
2. Check MongoDB Atlas Network Access:
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` (allow all) OR
   - Add Vercel's IP addresses
3. Verify database user has read/write permissions

### 5. Password Mismatch

**Symptom:** `passwordMatches: false` in debug output

**Fix:**
1. Make sure `DEFAULT_HR_PASSWORD` in Vercel matches what you're using
2. Or reinitialize HR admin at `/api/v1/init`

### 6. HR Admin Status Not Active

**Symptom:** `status: 'inactive'` in debug output

**Fix:**
1. Update employee status to 'active' in database
2. Or reinitialize HR admin at `/api/v1/init`

## 📋 Step-by-Step Fix

### Step 1: Check Debug Endpoint

Visit: `https://work-force-qtya.vercel.app/api/v1/auth-debug`

Look at the JSON response and check:
- `status`: Should be `"healthy"`
- `issues`: Should be empty array `[]`
- `hrAdmin.exists`: Should be `true`
- `hrAdmin.passwordMatches`: Should be `true`
- `database.connected`: Should be `true`

### Step 2: Fix Issues Found

Follow the recommendations in the `recommendations` array.

### Step 3: Verify Environment Variables

In Vercel Dashboard → Settings → Environment Variables, verify:

```
NEXTAUTH_URL=https://work-force-qtya.vercel.app
NEXTAUTH_SECRET=<your-secret-here>
MONGODB_URI=<your-mongodb-uri>
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

### Step 4: Redeploy

**CRITICAL:** After changing environment variables:
1. Go to Vercel → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for completion

### Step 5: Initialize HR Admin

1. Visit: `https://work-force-qtya.vercel.app/api/v1/init`
2. Click "Initialize HR Admin"
3. Note the credentials shown

### Step 6: Test Login

1. Visit: `https://work-force-qtya.vercel.app/login`
2. Use credentials:
   - Email: `hr@workforce.com`
   - Password: `Admin@123`
3. Should redirect to dashboard on success

## 🔍 Check Vercel Logs

If still not working:

1. Go to Vercel Dashboard → Deployments → Latest → Functions
2. Look for `[AUTH]` prefixed logs
3. Common log messages:
   - `[AUTH] Missing credentials` → Form not submitting correctly
   - `[AUTH] NEXTAUTH_SECRET is not set` → Add secret and redeploy
   - `[AUTH] Database connection error` → Check MONGODB_URI
   - `[AUTH] Employee not found` → Initialize HR admin
   - `[AUTH] Invalid password` → Password mismatch

## ✅ Verification Checklist

- [ ] Visited `/api/v1/auth-debug` and status is "healthy"
- [ ] All environment variables set in Vercel
- [ ] `NEXTAUTH_URL` has NO trailing slash
- [ ] `NEXTAUTH_SECRET` is set and at least 32 characters
- [ ] `MONGODB_URI` is correct
- [ ] Redeployed after changing environment variables
- [ ] HR admin initialized at `/api/v1/init`
- [ ] Checked Vercel function logs for `[AUTH]` errors
- [ ] Tested login with correct credentials

## 🆘 Still Not Working?

1. **Check Vercel Function Logs:**
   - Look for `[AUTH]` messages
   - Check for database connection errors
   - Verify environment variables are loaded

2. **Test Database Connection:**
   - Visit: `/api/test-connection`
   - Should show database connected

3. **Verify HR Admin:**
   - Visit: `/api/v1/auth-debug`
   - Check `hrAdmin.exists` and `hrAdmin.passwordMatches`

4. **Clear Browser Data:**
   - Clear cookies for the site
   - Try incognito/private window
   - Try different browser

