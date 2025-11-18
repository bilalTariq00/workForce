# Cloudinary Quick Setup

## Your Current Credentials

✅ **Cloud Name:** `dqrwpbrn2`  
✅ **API Secret:** `BeglWhJpqbnEHOOgtbzzPDsWlZ8`  
❌ **API Key:** Need to get from dashboard

## Step 1: Get Your API Key

1. Go to: **https://console.cloudinary.com/settings/product**
2. Look for **"API Key"** (it's a number like `123456789012345`)
3. Copy it

## Step 2: Update `.env.local`

Open or create `.env.local` in your project root and add:

```env
# File Storage - Use Cloudinary
FILE_STORAGE_TYPE=cloudinary

# Cloudinary URL Format
# Replace YOUR_API_KEY with the actual API key from Step 1
CLOUDINARY_URL=cloudinary://YOUR_API_KEY:BeglWhJpqbnEHOOgtbzzPDsWlZ8@dqrwpbrn2
```

**Example:**
If your API key is `123456789012345`, your line should be:
```env
CLOUDINARY_URL=cloudinary://123456789012345:BeglWhJpqbnEHOOgtbzzPDsWlZ8@dqrwpbrn2
```

## Step 3: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Step 4: Test

1. Go to `/attendance/certifications`
2. Upload a certification document
3. Check the response - `documentUrl` should be a Cloudinary URL like:
   ```
   https://res.cloudinary.com/dqrwpbrn2/image/upload/v.../workforce/certifications/...
   ```

## Benefits

✅ **Absolute URLs** - No more validation errors  
✅ **CDN Delivery** - Fast file access worldwide  
✅ **Automatic Optimization** - Images are optimized automatically  
✅ **25GB Free Storage** - Plenty for your needs  

---

**Note:** If you don't have the API key yet, the system will continue using local storage (relative URLs) until you add it.

