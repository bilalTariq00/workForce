# Cloudinary Setup Instructions (Free Tier)

## Quick Start

### Step 1: Sign Up for Cloudinary (Free)
1. Go to: **https://cloudinary.com/users/register/free**
2. Create your free account
3. Verify your email

### Step 2: Get Your Credentials
1. Log in to Cloudinary Dashboard
2. Go to **Settings** → **Product Environment Settings**
3. Copy these three values:
   - **Cloud Name** (e.g., `dxyz12345`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Add to Your Environment File
Create or edit `.env.local` in your project root:

```env
# File Storage - Use Cloudinary
FILE_STORAGE_TYPE=cloudinary

# Cloudinary Credentials (from Step 2)
CLOUDINARY_CLOUD_NAME=your-cloud-name-here
CLOUDINARY_API_KEY=your-api-key-here
CLOUDINARY_API_SECRET=your-api-secret-here
```

### Step 4: Restart Your Server
```bash
npm run dev
```

**That's it!** File uploads will now use Cloudinary.

---

## What You Get (Free Tier)

✅ **25GB Storage** - Plenty for certifications, photos, documents  
✅ **25GB Bandwidth/month** - Fast CDN delivery  
✅ **Unlimited Transformations** - Image optimization, resizing  
✅ **Unlimited Uploads** - No upload limits  

---

## How It Works

- **If Cloudinary is configured:** Files upload to Cloudinary cloud storage
- **If Cloudinary is NOT configured:** Files automatically save to local storage (`public/uploads/`)
- **Automatic fallback:** If Cloudinary fails, it falls back to local storage

---

## Testing

1. Go to `/attendance/certifications`
2. Upload a certification document
3. Check the URL - it should be a Cloudinary URL (e.g., `https://res.cloudinary.com/...`)

---

## Troubleshooting

**Problem:** "Cloudinary upload failed"  
**Solution:** Check your credentials. System will automatically use local storage as fallback.

**Problem:** Files not showing  
**Solution:** Make sure your `.env.local` file has correct credentials and restart the server.

**Problem:** Want to use local storage instead  
**Solution:** Set `FILE_STORAGE_TYPE=local` or don't add Cloudinary credentials.

---

## Security

⚠️ **Never commit `.env.local` to Git** - It's already in `.gitignore`

Your API secret is private - keep it secure!

---

## Need Help?

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Cloudinary Support:** support@cloudinary.com
- **Free Tier Limits:** https://cloudinary.com/pricing

