# Environment Setup for Cloudinary

## Your Cloudinary Credentials

Based on what you provided:
- **Cloud Name:** `dqrwpbrn2`
- **API Secret:** `BeglWhJpqbnEHOOgtbzzPDsWlZ8`
- **API Key:** You need to get this from your Cloudinary dashboard

## Setup Instructions

### Step 1: Get Your API Key

1. Go to: https://console.cloudinary.com/settings/product
2. Look for **"API Key"** (it's a number like `123456789012345`)
3. Copy it

### Step 2: Create `.env.local` File

Create a file named `.env.local` in your project root (`/Users/nc/Desktop/workforce/.env.local`) with this content:

```env
# File Storage Configuration
FILE_STORAGE_TYPE=cloudinary

# Option 1: Use CLOUDINARY_URL (Easier - one line)
# Replace YOUR_API_KEY with the actual API key from dashboard
CLOUDINARY_URL=cloudinary://YOUR_API_KEY:BeglWhJpqbnEHOOgtbzzPDsWlZ8@dqrwpbrn2

# Option 2: Use Individual Credentials (Alternative)
# CLOUDINARY_CLOUD_NAME=dqrwpbrn2
# CLOUDINARY_API_KEY=YOUR_API_KEY
# CLOUDINARY_API_SECRET=BeglWhJpqbnEHOOgtbzzPDsWlZ8
```

### Step 3: Replace YOUR_API_KEY

Replace `YOUR_API_KEY` in the CLOUDINARY_URL with the actual API key number from your dashboard.

**Example:**
If your API key is `123456789012345`, your CLOUDINARY_URL should be:
```env
CLOUDINARY_URL=cloudinary://123456789012345:BeglWhJpqbnEHOOgtbzzPDsWlZ8@dqrwpbrn2
```

### Step 4: Restart Your Server

```bash
npm run dev
```

## Testing

1. Go to `/attendance/certifications`
2. Upload a certification document
3. Check the response - the `documentUrl` should be a Cloudinary URL (starts with `https://res.cloudinary.com/`)

## Troubleshooting

**If uploads still use local storage:**
- Check that `.env.local` file exists in the project root
- Make sure the API key is correct (it's a number, not text)
- Restart your server after making changes
- Check server console for any Cloudinary errors

**If you see "Invalid API key":**
- Double-check the API key from your dashboard
- Make sure there are no extra spaces in the `.env.local` file
- The API key should be just numbers (no quotes, no spaces)

## Security Note

⚠️ The `.env.local` file is already in `.gitignore` - it won't be committed to Git. Keep your API secret secure!

