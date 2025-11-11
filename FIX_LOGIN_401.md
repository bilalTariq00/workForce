# Fixing 401 Unauthorized Login Error

## The Issue

You're getting a 401 Unauthorized error at `/api/auth/callback/credentials`. This happens when NextAuth cannot authenticate the user.

## Verified Status

✅ HR Admin exists in database
✅ Password is correct
✅ Employee is active
✅ Credentials are valid (tested via debug endpoint)

## Common Causes & Solutions

### 1. NEXTAUTH_SECRET Missing or Invalid

**Check:**
```bash
grep NEXTAUTH_SECRET .env.local
```

**Fix:**
- Make sure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate a new one if needed:
  ```bash
  openssl rand -base64 32
  ```
- **Restart the server** after changing `.env.local`

### 2. Server Not Restarted

After changing `.env.local`, you **MUST** restart:
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Check Server Console

Look at your terminal where `npm run dev` is running. You should see:
- "Attempting login for: hr@workforce.com"
- "Employee found: hr@workforce.com hr_officer"
- "Login successful for: hr@workforce.com"

If you see errors, they will help identify the issue.

### 4. Browser Cache/Cookies

Try:
1. Clear browser cookies for `localhost:3000`
2. Use incognito/private window
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### 5. Test Credentials Directly

Use the debug endpoint to verify:
```bash
curl -X POST http://localhost:3000/api/debug-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"hr@workforce.com","password":"Admin@123"}'
```

Should return: `"passwordMatch": true`

## Quick Fix Steps

1. **Check `.env.local` has NEXTAUTH_SECRET:**
   ```bash
   cat .env.local | grep NEXTAUTH_SECRET
   ```

2. **If missing, add it:**
   ```bash
   echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
   ```

3. **Restart server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Try login again**

## Still Not Working?

Check the server console logs when you try to login. The logs will show:
- If the employee is found
- If the password matches
- Any errors during authentication

Share the console output if you need more help!

