# Vercel Environment Variables Setup

## ⚠️ Fix Your Environment Variables

### Problem: 404 Error
The 404 error is likely because:
1. Missing required environment variables
2. `NEXTAUTH_URL` has trailing slash (should NOT have one)
3. Routes not deployed yet

## ✅ Complete Environment Variables List

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add ALL of these:

### 1. NEXTAUTH_URL (IMPORTANT: NO TRAILING SLASH)
```
NEXTAUTH_URL=https://work-force-qtya.vercel.app
```
❌ **WRONG:** `https://work-force-qtya.vercel.app/` (with trailing slash)
✅ **CORRECT:** `https://work-force-qtya.vercel.app` (no trailing slash)

### 2. NEXTAUTH_SECRET (REQUIRED)
Generate a new secret:
```bash
openssl rand -base64 32
```

Then add to Vercel:
```
NEXTAUTH_SECRET=<paste-the-generated-secret-here>
```

### 3. MONGODB_URI (REQUIRED)
```
MONGODB_URI=mongodb+srv://bilal002ta_db_user:1n9GS5zvaDWAgKBy@cluster0.eaatg0a.mongodb.net/workforce?retryWrites=true&w=majority
```

### 4. DEFAULT_HR_EMAIL (Optional - has default)
```
DEFAULT_HR_EMAIL=hr@workforce.com
```

### 5. DEFAULT_HR_PASSWORD (Optional - has default)
```
DEFAULT_HR_PASSWORD=Admin@123
```

## 📋 Step-by-Step Setup

### Step 1: Remove Trailing Slash from NEXTAUTH_URL

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `NEXTAUTH_URL`
3. Edit it and remove the trailing slash `/`
4. Should be: `https://work-force-qtya.vercel.app` (NOT `https://work-force-qtya.vercel.app/`)

### Step 2: Add Missing Variables

Make sure you have ALL 5 variables:
- ✅ `NEXTAUTH_URL` (without trailing slash)
- ✅ `NEXTAUTH_SECRET` (generate if missing)
- ✅ `MONGODB_URI` (your MongoDB connection string)
- ✅ `DEFAULT_HR_EMAIL` (optional)
- ✅ `DEFAULT_HR_PASSWORD` (optional)

### Step 3: Generate NEXTAUTH_SECRET

If you don't have `NEXTAUTH_SECRET`, generate one:

**On Mac/Linux:**
```bash
openssl rand -base64 32
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use online generator:**
- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret
- Add to Vercel as `NEXTAUTH_SECRET`

### Step 4: Redeploy

**IMPORTANT:** After changing environment variables, you MUST redeploy:

1. Go to Vercel Dashboard → Deployments
2. Click "..." on the latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete (1-2 minutes)

## 🧪 Test After Setup

### 1. Test Backend Connection
Visit: `https://work-force-qtya.vercel.app/api/test-connection`

Should return JSON with database connection status.

### 2. Initialize HR Admin
Visit: `https://work-force-qtya.vercel.app/api/v1/init`

Should show a page with "Initialize HR Admin" button.

### 3. Test Login
Visit: `https://work-force-qtya.vercel.app/login`

Use credentials:
- Email: `hr@workforce.com`
- Password: `Admin@123`

## 🔍 Troubleshooting

### Still Getting 404?

1. **Check Deployment Status:**
   - Go to Vercel Dashboard → Deployments
   - Make sure latest deployment is "Ready" (green checkmark)
   - If failed, check logs

2. **Check Environment Variables:**
   - Go to Settings → Environment Variables
   - Verify all variables are set
   - Make sure `NEXTAUTH_URL` has NO trailing slash

3. **Check Vercel Logs:**
   - Go to Deployments → Latest → Functions
   - Look for errors in logs
   - Check for `[AUTH]` or `[DB]` prefixed messages

4. **Force Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment
   - Wait for completion

### Still Getting 401?

1. Make sure `NEXTAUTH_SECRET` is set
2. Make sure `NEXTAUTH_URL` matches your domain exactly
3. Initialize HR admin at `/api/v1/init`
4. Check Vercel function logs for `[AUTH]` errors

## 📝 Quick Checklist

- [ ] `NEXTAUTH_URL` set (NO trailing slash)
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] `MONGODB_URI` set correctly
- [ ] `DEFAULT_HR_EMAIL` set (optional)
- [ ] `DEFAULT_HR_PASSWORD` set (optional)
- [ ] Redeployed after setting variables
- [ ] Tested `/api/test-connection`
- [ ] Initialized HR admin at `/api/v1/init`
- [ ] Tested login at `/login`

## 🚀 After Everything Works

1. Login with default credentials
2. **CHANGE THE PASSWORD IMMEDIATELY**
3. Start using the system!

