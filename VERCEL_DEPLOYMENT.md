# Vercel Deployment Troubleshooting

## 401 Unauthorized Error Fix

If you're getting a `401 Unauthorized` error on `/api/auth/callback/credentials`, check the following:

### 1. Environment Variables

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```env
NEXTAUTH_URL=https://work-force-qtya.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
MONGODB_URI=your-mongodb-connection-string
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

**Important:**
- `NEXTAUTH_URL` must match your Vercel deployment URL exactly (including `https://`)
- `NEXTAUTH_SECRET` must be a strong random string (generate with: `openssl rand -base64 32`)
- After adding/changing environment variables, **redeploy** your application

### 2. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Click "Functions" tab
4. Look for errors in the logs

Common errors you might see:
- `NEXTAUTH_SECRET is not set`
- `Database connection failed`
- `Employee not found`

### 3. Initialize HR Admin

After deployment, initialize the HR admin user:

```bash
curl -X POST https://work-force-qtya.vercel.app/api/v1/init
```

Or visit: `https://work-force-qtya.vercel.app/api/v1/init`

### 4. Test Connection

Test if the backend is working:

```bash
curl https://work-force-qtya.vercel.app/api/test-connection
```

### 5. MongoDB Atlas Configuration

Make sure:
- Your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0) OR
- Vercel's IP addresses are whitelisted
- Database user has read/write permissions

### 6. Common Issues

#### Issue: "CredentialsSignin" error
**Solution:** 
- Check if HR admin exists: Visit `/api/v1/init` to create it
- Verify credentials match: `hr@workforce.com` / `Admin@123`

#### Issue: "NEXTAUTH_SECRET is missing"
**Solution:**
- Add `NEXTAUTH_SECRET` to Vercel environment variables
- Generate a new secret: `openssl rand -base64 32`
- Redeploy after adding

#### Issue: "Database connection failed"
**Solution:**
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas Network Access allows Vercel IPs
- Check database user permissions

#### Issue: "Employee not found"
**Solution:**
- Initialize HR admin: `POST /api/v1/init`
- Check if employee status is 'active'
- Verify email is correct (case-insensitive)

### 7. Debug Mode

To enable debug logging, add to Vercel environment variables:

```env
NEXTAUTH_DEBUG=true
NODE_ENV=production
```

This will show detailed auth logs in Vercel function logs.

### 8. Quick Fix Checklist

- [ ] `NEXTAUTH_URL` matches your Vercel URL exactly
- [ ] `NEXTAUTH_SECRET` is set and strong
- [ ] `MONGODB_URI` is correct
- [ ] MongoDB Atlas allows connections from Vercel
- [ ] HR admin initialized (`/api/v1/init`)
- [ ] Redeployed after changing environment variables
- [ ] Checked Vercel function logs for errors

### 9. Testing Login

1. Go to: `https://work-force-qtya.vercel.app/login`
2. Use default credentials:
   - Email: `hr@workforce.com`
   - Password: `Admin@123`
3. If it fails, check Vercel logs for the exact error

### 10. Still Not Working?

1. Check Vercel Function Logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test MongoDB connection separately
4. Try initializing HR admin again
5. Clear browser cookies and try again

## Production Best Practices

1. **Change Default Password:** After first login, change the HR password
2. **Use Strong Secrets:** Generate strong `NEXTAUTH_SECRET`
3. **Monitor Logs:** Regularly check Vercel logs for errors
4. **Database Backups:** Set up MongoDB Atlas backups
5. **IP Whitelisting:** Restrict MongoDB access to Vercel IPs only

