# Production Authentication Fix

## Issue
Users are being redirected to login page after successful login in production.

## Root Causes
1. **NEXTAUTH_URL not set** - Must match your production domain
2. **Cookie settings** - Need secure cookies for HTTPS
3. **Session persistence** - Session might not be persisting correctly

## Fixes Applied

### 1. Updated NextAuth Config (`lib/auth/config.js`)
- Added secure cookie settings for production
- Configured `useSecureCookies` for HTTPS
- Added proper cookie options with `httpOnly`, `sameSite`, and `secure` flags

### 2. Updated Login Redirect (`app/login/page.jsx`)
- Changed default redirect from `/` to `/modules-dashboard`
- Added forced page refresh after login to ensure session loads
- Improved redirect handling

## Required Environment Variables in Vercel

Make sure these are set in your Vercel project settings:

```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
```

### How to Set in Vercel:
1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Add/Update:
   - `NEXTAUTH_URL` = Your production URL (e.g., `https://workforce.vercel.app`)
   - `NEXTAUTH_SECRET` = A random secret string (generate with: `openssl rand -base64 32`)
   - `MONGODB_URI` = Your MongoDB connection string

## Testing

After deploying:
1. Clear browser cookies for your domain
2. Try logging in
3. Should redirect to `/modules-dashboard` (or `/dashboard` if no modules)
4. Session should persist on page refresh

## Debugging

If still having issues, check:
1. Browser console for errors
2. Vercel function logs for authentication errors
3. Verify `NEXTAUTH_URL` matches your domain exactly (no trailing slash)
4. Check that cookies are being set (in browser DevTools → Application → Cookies)

## Additional Notes

- The `trustHost: true` option is required for Vercel
- Cookies will only work over HTTPS in production
- Session token name uses `__Secure-` prefix in production for additional security

