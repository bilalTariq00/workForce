# Session Persistence Fix

## Issue
Users are being redirected to login page with `callbackUrl` parameter even after successful login. The session is not persisting properly.

## Root Causes
1. **Cookie name mismatch** - Using `__Secure-` prefix can cause issues with NextAuth middleware
2. **Middleware not reading session** - The middleware might not be detecting the session cookie
3. **callbackUrl not handled** - Login page wasn't reading the `callbackUrl` parameter from NextAuth

## Fixes Applied

### 1. Fixed Cookie Configuration (`lib/auth/config.js`)
- Removed `__Secure-` prefix from cookie name (NextAuth handles this automatically)
- Simplified cookie configuration to use default NextAuth behavior
- Kept `secure: true` for production HTTPS

### 2. Updated Login Page (`app/login/page.jsx`)
- Added handling for `callbackUrl` parameter (used by NextAuth middleware)
- Decodes URL-encoded callback URLs
- Properly redirects to the original destination after login
- Added small delay to ensure cookie is set before redirect

### 3. Improved Middleware (`middleware.js`)
- Added explicit check for token in middleware function
- Added `/login` to allowed paths to prevent redirect loops
- Better handling of session token detection

## Required Environment Variables

Make sure these are set in Vercel:

```bash
NEXTAUTH_URL=https://work-force-2n6n.vercel.app
NEXTAUTH_SECRET=your-secret-key
MONGODB_URI=your-mongodb-uri
```

**Important**: `NEXTAUTH_URL` must match your exact Vercel domain (no trailing slash).

## Testing Steps

1. Clear all cookies for your domain
2. Navigate to `/modules-dashboard` (should redirect to login)
3. Log in with credentials
4. Should redirect back to `/modules-dashboard` with session active
5. Refresh page - session should persist

## Debugging

If still having issues:

1. **Check Vercel Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `NEXTAUTH_URL` is exactly: `https://work-force-2n6n.vercel.app` (no trailing slash)

2. **Check Browser Cookies**:
   - Open DevTools → Application → Cookies
   - Look for `next-auth.session-token` cookie
   - Should be set with `Secure` and `HttpOnly` flags in production

3. **Check Vercel Logs**:
   - Go to Vercel Dashboard → Functions → View Logs
   - Look for authentication errors or session-related errors

4. **Test Session Endpoint**:
   - Visit: `https://work-force-2n6n.vercel.app/api/auth/session`
   - Should return session data if logged in, or `{}` if not

## Additional Notes

- The `trustHost: true` option is required for Vercel deployments
- Cookies work differently in production (HTTPS required)
- Session uses JWT strategy, so no database lookups needed for session validation
- The middleware runs on edge, so it needs to read cookies correctly


