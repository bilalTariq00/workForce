# Check Backend Connection

## Quick Test

Visit this URL in your browser to test the backend connection:

```
http://localhost:3000/api/test-connection
```

## What to Check

### ✅ Success Response
If you see:
```json
{
  "success": true,
  "message": "Backend is connected!",
  "database": {
    "connected": true,
    "employeeCount": 0,
    "hrAdminExists": false,
    "hrAdminEmail": null
  }
}
```

This means:
- ✅ MongoDB connection is working
- ✅ Backend is properly connected
- ⚠️ HR admin doesn't exist yet (you need to initialize it)

### ❌ Error Response
If you see an error, check:

1. **MongoDB Connection Error**
   - Check `.env.local` has correct `MONGODB_URI`
   - Verify MongoDB Atlas IP whitelist
   - Check if MongoDB service is running (if local)

2. **Environment Variables Missing**
   - Make sure `.env.local` exists
   - Check `NEXTAUTH_SECRET` is set
   - Restart server after changing `.env.local`

## Next Steps

### If Connection Works but HR Admin Doesn't Exist:

1. **Initialize HR Admin:**
   - Visit: `http://localhost:3000/setup`
   - Or: `http://localhost:3000/api/v1/init`

2. **Then Login:**
   - Go to: `http://localhost:3000/login`
   - Use credentials from initialization

### If Connection Fails:

1. Check `.env.local` file exists
2. Verify MongoDB URI is correct
3. Check server console for errors
4. Restart the development server

