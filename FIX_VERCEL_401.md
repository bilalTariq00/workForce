# Fix 401 Unauthorized on Vercel

## Quick Fix Steps

### Step 1: Check Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:

```
NEXTAUTH_URL=https://work-force-qtya.vercel.app
NEXTAUTH_SECRET=<your-secret-here>
MONGODB_URI=<your-mongodb-uri>
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

**Critical:** `NEXTAUTH_URL` must match your Vercel URL exactly (with `https://`)

### Step 2: Generate NEXTAUTH_SECRET

If you don't have a secret, generate one:

```bash
openssl rand -base64 32
```

Add this to Vercel environment variables.

### Step 3: Initialize HR Admin

After deployment, visit:
```
https://work-force-qtya.vercel.app/api/v1/init
```

Or use curl:
```bash
curl -X POST https://work-force-qtya.vercel.app/api/v1/init
```

### Step 4: Redeploy

After changing environment variables:
1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

### Step 5: Check Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → Functions tab
3. Look for `[AUTH]` prefixed logs to see what's failing

## Common Error Messages

### "NEXTAUTH_SECRET is not set"
- **Fix:** Add `NEXTAUTH_SECRET` to Vercel environment variables
- **Generate:** `openssl rand -base64 32`

### "Database connection failed"
- **Fix:** Check `MONGODB_URI` is correct
- **Fix:** Verify MongoDB Atlas Network Access allows Vercel IPs (or use 0.0.0.0/0)

### "Employee not found"
- **Fix:** Initialize HR admin: Visit `/api/v1/init`

### "Invalid email or password"
- **Fix:** Use default credentials: `hr@workforce.com` / `Admin@123`
- **Fix:** Make sure HR admin was initialized

## Debug Mode

Add to Vercel environment variables:
```
NEXTAUTH_DEBUG=true
```

This will show detailed auth logs in Vercel function logs.

## Test After Fix

1. Visit: `https://work-force-qtya.vercel.app/login`
2. Use credentials:
   - Email: `hr@workforce.com`
   - Password: `Admin@123`
3. Should redirect to dashboard on success

## Still Not Working?

1. Check Vercel Function Logs for `[AUTH]` messages
2. Verify all environment variables are set
3. Test MongoDB connection: `GET /api/test-connection`
4. Try initializing HR admin again
5. Clear browser cookies and retry

