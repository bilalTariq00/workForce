# Troubleshooting Guide

## CredentialsSignin Error

If you're getting a `CredentialsSignin` error when trying to login, it usually means:

### 1. HR Admin User Doesn't Exist

**Solution:** You need to initialize the HR admin user first.

**Option A: Use the Setup Page**
1. Go to: `http://localhost:3000/setup`
2. Click "Initialize HR Admin"
3. Wait for success message
4. Use the credentials shown to login

**Option B: Use API Endpoint**
```bash
curl -X POST http://localhost:3000/api/v1/init
```

**Option C: Use Browser**
Visit: `http://localhost:3000/api/v1/init` in your browser

### 2. Wrong Credentials

Make sure you're using:
- **Email:** `hr@workforce.com` (or the email from your `.env.local`)
- **Password:** `Admin@123` (or the password from your `.env.local`)

### 3. NEXTAUTH_SECRET Missing

Check your `.env.local` file has:
```env
NEXTAUTH_SECRET=your-secret-key-here
```

If missing, generate one:
```bash
openssl rand -base64 32
```

Then add it to `.env.local` and **restart your server**.

### 4. MongoDB Connection Issue

Check:
- MongoDB is running (if local) or Atlas cluster is accessible
- `MONGODB_URI` in `.env.local` is correct
- Your IP is whitelisted in MongoDB Atlas Network Access
- Database name is correct in connection string

### 5. Server Not Restarted

After changing `.env.local`, you **must restart** the development server:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## Common Issues

### "Cannot connect to MongoDB"
- Check your `MONGODB_URI` in `.env.local`
- For Atlas: Ensure your IP is whitelisted
- Check if MongoDB service is running (if local)

### "NEXTAUTH_SECRET is missing"
- Add `NEXTAUTH_SECRET` to `.env.local`
- Restart the server after adding it

### "Employee not found" in console
- The HR admin user hasn't been created yet
- Run the initialization step first

### Text not showing in forms
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check if Tailwind CSS is compiling
- Clear browser cache

## Quick Fix Checklist

1. ✅ `.env.local` file exists with all required variables
2. ✅ `MONGODB_URI` is correct and accessible
3. ✅ `NEXTAUTH_SECRET` is set
4. ✅ Server restarted after `.env.local` changes
5. ✅ HR admin initialized via `/setup` or `/api/v1/init`
6. ✅ Using correct login credentials

## Still Having Issues?

1. Check server console for error messages
2. Check browser console for client-side errors
3. Verify MongoDB connection by checking server logs
4. Try clearing browser cookies and cache
5. Make sure you're using the correct port (default: 3000)

