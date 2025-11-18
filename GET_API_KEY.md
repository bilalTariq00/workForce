# How to Get Your Cloudinary API Key

## Quick Steps

1. **Log in to Cloudinary Dashboard**
   - Go to: https://cloudinary.com/console
   - Sign in with your account

2. **Navigate to Settings**
   - Click on your account name (top right)
   - Select **Settings** from the dropdown

3. **Go to Product Environment Settings**
   - In the left sidebar, click **Product Environment Settings**
   - Or go directly to: https://console.cloudinary.com/settings/product

4. **Copy Your API Key**
   - Look for **"API Key"** field
   - It's a number (e.g., `123456789012345`)
   - Click the copy icon or select and copy it

5. **Update `.env.local`**
   - Replace `YOUR_API_KEY_HERE` with the actual API key number
   - Save the file

6. **Restart Your Server**
   ```bash
   npm run dev
   ```

## Your Current Credentials

✅ **Cloud Name:** `dqrwpbrn2`  
✅ **API Secret:** `BeglWhJpqbnEHOOgtbzzPDsWlZ8`  
❌ **API Key:** Need to get from dashboard (see above)

## Alternative: Using CLOUDINARY_URL

If you prefer, you can use the CLOUDINARY_URL format instead:

```env
CLOUDINARY_URL=cloudinary://YOUR_API_KEY:BeglWhJpqbnEHOOgtbzzPDsWlZ8@dqrwpbrn2
```

But you still need to replace `YOUR_API_KEY` with the actual API key from your dashboard.

---

## Testing

Once you've added the API key:

1. Restart your server
2. Try uploading a certification at `/attendance/certifications`
3. Check the console - you should see Cloudinary URLs instead of local paths

