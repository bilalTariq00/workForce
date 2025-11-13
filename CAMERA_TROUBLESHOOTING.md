# Camera QR Scanner Troubleshooting Guide

## Overview
The QR code scanner uses your device's camera to scan QR codes for attendance marking. This guide helps you resolve common camera issues.

## Common Issues and Solutions

### 1. "Camera permission denied"
**Problem**: Browser is blocking camera access.

**Solutions**:
- **Chrome/Edge**: 
  - Click the lock icon in the address bar
  - Set "Camera" to "Allow"
  - Refresh the page
- **Firefox**:
  - Click the shield icon in the address bar
  - Click "Permissions" → Allow camera
  - Refresh the page
- **Safari (iOS)**:
  - Go to Settings → Safari → Camera
  - Allow camera access
  - Refresh the page
- **Mobile browsers**:
  - Check device Settings → Apps → Browser → Permissions
  - Enable Camera permission

### 2. "No camera found"
**Problem**: Device doesn't have a camera or camera is not detected.

**Solutions**:
- Ensure your device has a working camera
- Check if camera works in other apps
- Try refreshing the page
- On desktop, ensure external camera is connected and recognized

### 3. "Camera is already in use"
**Problem**: Another application is using the camera.

**Solutions**:
- Close other apps that might be using the camera (video calls, other QR scanners, etc.)
- Restart your browser
- On mobile, close all apps and reopen the browser

### 4. "Camera requires HTTPS connection"
**Problem**: Browsers require HTTPS for camera access (except localhost).

**Solutions**:
- **Development**: Use `http://localhost:3000` (works without HTTPS)
- **Production**: Ensure the site is accessed via HTTPS (`https://yourdomain.com`)
- Contact your IT team to set up HTTPS if needed

### 5. Camera starts but doesn't scan QR codes
**Problem**: Camera works but QR detection fails.

**Solutions**:
- Ensure good lighting
- Hold the camera steady
- Position QR code within the scanning frame
- Make sure QR code is clear and not damaged
- Try moving closer or further from the QR code
- Clean your camera lens

### 6. "Camera is not supported in this browser"
**Problem**: Browser doesn't support camera API.

**Solutions**:
- Update your browser to the latest version
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- On mobile, use the device's default browser

## Step-by-Step: Enabling Camera Access

### Chrome/Edge (Desktop)
1. Click the lock icon (🔒) or info icon (ℹ️) in the address bar
2. Find "Camera" in the permissions list
3. Change from "Block" to "Allow"
4. Refresh the page

### Firefox (Desktop)
1. Click the shield icon in the address bar
2. Click "Permissions"
3. Find "Use the Camera"
4. Click "Allow"
5. Refresh the page

### Safari (macOS)
1. Safari → Settings → Websites → Camera
2. Find your site
3. Set to "Allow"
4. Refresh the page

### Mobile (iOS Safari)
1. Settings → Safari → Camera
2. Ensure camera access is enabled
3. In Safari, when prompted, tap "Allow"

### Mobile (Android Chrome)
1. Settings → Apps → Chrome → Permissions
2. Enable Camera
3. In Chrome, when prompted, tap "Allow"

## Testing Camera Access

### Quick Test
1. Visit: `https://webcamtests.com` (or similar)
2. Click "Test my cam"
3. If camera works there, the issue is with permissions on our site

### Browser Console Check
1. Open browser console (F12)
2. Run: `navigator.mediaDevices.getUserMedia({ video: true })`
3. If it works, you'll see a permission prompt
4. If it fails, check the error message

## Manual Entry Alternative

If camera issues persist, you can use manual entry:
1. Look at the QR code displayed on the laptop/monitor at the site
2. Copy the QR code data (usually: `{"type":"attendance","version":"1.0"}`)
3. Paste it into the manual entry field
4. Click "Mark Attendance"

## Browser Compatibility

| Browser | Minimum Version | Camera Support |
|---------|----------------|----------------|
| Chrome | 53+ | ✅ Full support |
| Firefox | 36+ | ✅ Full support |
| Safari | 11+ | ✅ Full support |
| Edge | 12+ | ✅ Full support |
| Opera | 40+ | ✅ Full support |
| Mobile Safari (iOS) | 11+ | ✅ Full support |
| Chrome Mobile | 53+ | ✅ Full support |

## Still Having Issues?

1. **Clear browser cache and cookies**
2. **Try incognito/private mode** (to rule out extension issues)
3. **Disable browser extensions** that might block camera
4. **Update your browser** to the latest version
5. **Restart your device**
6. **Contact IT support** with:
   - Browser name and version
   - Device type (desktop/mobile)
   - Error message screenshot
   - Steps you've already tried

## Best Practices

- **Grant camera permission** when first prompted
- **Use HTTPS** in production environments
- **Ensure good lighting** when scanning
- **Hold device steady** for better QR detection
- **Keep camera lens clean**
- **Close other apps** using the camera

