# File Upload Setup Guide

## Overview

The system now supports **Cloudinary** (free tier) for file uploads, with automatic fallback to local storage if Cloudinary is not configured.

## Free Storage Options

### ✅ **Cloudinary (Recommended)**
- **Free Tier:** 25GB storage, 25GB bandwidth/month
- **Sign up:** https://cloudinary.com/users/register/free
- **Pros:** 
  - Generous free tier
  - Automatic image optimization
  - CDN delivery
  - Easy to use
- **Cons:** None for free tier

### Alternative Free Options

#### **Supabase Storage**
- **Free Tier:** 1GB storage
- **Sign up:** https://supabase.com
- **Pros:** Good for small projects
- **Cons:** Limited storage

#### **Firebase Storage**
- **Free Tier:** 5GB storage
- **Sign up:** https://firebase.google.com
- **Pros:** Google infrastructure
- **Cons:** More complex setup

#### **Local Storage (Current Default)**
- **Free Tier:** Unlimited (your server storage)
- **Pros:** No external dependencies
- **Cons:** 
  - Files stored on server
  - No CDN
  - Manual backup required

---

## Setup Instructions

### Option 1: Cloudinary (Recommended)

#### Step 1: Sign up for Cloudinary
1. Go to https://cloudinary.com/users/register/free
2. Create a free account
3. Verify your email

#### Step 2: Get Your Credentials
1. Log in to Cloudinary dashboard
2. Go to **Settings** → **Product Environment Settings**
3. Copy your credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

#### Step 3: Configure Environment Variables
1. Create or update `.env.local` file in your project root:

```env
# File Storage Configuration
FILE_STORAGE_TYPE=cloudinary

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

2. Replace the values with your actual Cloudinary credentials

#### Step 4: Restart Your Server
```bash
npm run dev
```

That's it! File uploads will now use Cloudinary.

---

### Option 2: Local Storage (No Setup Required)

If you don't want to use Cloudinary, the system will automatically use local storage:

1. Set in `.env.local`:
```env
FILE_STORAGE_TYPE=local
```

Or simply don't set Cloudinary credentials - it will default to local storage.

Files will be stored in: `public/uploads/{folder}/`

---

## How It Works

### Automatic Fallback
The system automatically falls back to local storage if:
- Cloudinary is not configured
- Cloudinary upload fails
- `FILE_STORAGE_TYPE=local` is set

### File Upload Service
All file uploads go through `lib/services/fileUpload.js`:
- Handles both Cloudinary and local storage
- Automatic format detection
- Size validation
- Unique filename generation

### Supported File Types
- **Images:** JPG, JPEG, PNG
- **Documents:** PDF
- **Max Size:** 5MB (configurable)

---

## Usage Examples

### Uploading a File
```javascript
import { uploadFile } from '@/lib/services/fileUpload';

// Upload certification document
const result = await uploadFile(file, 'certifications', {
  maxSize: 5 * 1024 * 1024, // 5MB
});

// Result:
// {
//   url: 'https://res.cloudinary.com/...' (Cloudinary)
//   or '/uploads/certifications/file.jpg' (Local)
//   publicId: 'workforce/certifications/...' (Cloudinary only)
// }
```

### Deleting a File
```javascript
import { deleteFile } from '@/lib/services/fileUpload';

await deleteFile(url, publicId);
```

---

## Current Implementation

### Files Using File Upload:
1. ✅ **Certifications** (`/api/v1/certifications/upload`)
   - SafePass, CSCS, First Aid certificates
   - PDF, JPG, PNG formats

2. **Incident Photos** (to be updated)
   - Currently using data URLs
   - Should use file upload service

3. **Inspection Photos** (to be updated)
   - Currently not implemented
   - Should use file upload service

4. **Delivery Dockets** (to be updated)
   - Currently stored locally
   - Can be migrated to Cloudinary

---

## Cloudinary Free Tier Limits

- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** Unlimited
- **Uploads:** Unlimited

**Note:** If you exceed the free tier, you'll need to upgrade to a paid plan or use local storage.

---

## Troubleshooting

### Issue: "Cloudinary upload failed"
**Solution:** Check your credentials in `.env.local`. The system will automatically fall back to local storage.

### Issue: "File size exceeds limit"
**Solution:** Increase `maxSize` in the upload options, or compress files before upload.

### Issue: Files not showing
**Solution:** 
- For Cloudinary: Check that the URL is accessible
- For Local: Ensure `public/uploads/` directory exists and is writable

---

## Migration from Local to Cloudinary

If you're currently using local storage and want to migrate to Cloudinary:

1. Set up Cloudinary (see above)
2. Existing files will remain in local storage
3. New uploads will go to Cloudinary
4. Optionally, you can write a migration script to upload existing files to Cloudinary

---

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Keep API secrets secure**
3. **Validate file types** on both client and server
4. **Set appropriate file size limits**
5. **Use HTTPS** in production

---

## Next Steps

1. ✅ Set up Cloudinary account
2. ✅ Add credentials to `.env.local`
3. ✅ Test file uploads
4. ⏳ Update incident photo uploads
5. ⏳ Update inspection photo uploads
6. ⏳ Add file deletion functionality

---

## Support

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Cloudinary Support:** support@cloudinary.com
- **Free Tier Info:** https://cloudinary.com/pricing

