# QR Code Attendance Flow - How It Works

## Current Flow (What You Want)

1. **HR displays QR code on laptop/computer** at site entrance
   - QR code is shown on `/hr/qr-display` page
   - Can be displayed on any device (laptop, tablet, monitor)

2. **Employee opens app on their mobile phone**
   - Logs in on their phone
   - Gets redirected to `/attendance/scan` page

3. **Employee scans QR code from laptop screen**
   - Uses phone camera to scan QR code displayed on laptop
   - QR code contains: `{"type":"attendance","version":"1.0"}`

4. **System marks attendance**
   - Validates QR code
   - Gets user location from phone GPS
   - Finds nearest site
   - Checks if within radius
   - Marks attendance for that day

## How It Works Technically

### QR Code Display (Laptop)
- **Page**: `/hr/qr-display`
- **What it shows**: Large QR code image
- **Can be**: Full screen on laptop, tablet, or monitor
- **QR Data**: Universal code (same for everyone)

### QR Code Scanning (Mobile Phone)
- **Page**: `/attendance/scan`
- **What it does**: 
  - Opens camera on phone
  - Scans QR code from laptop screen
  - Validates and marks attendance

### The Flow
```
Laptop (Site Entrance)          Mobile Phone (Employee)
─────────────────────          ──────────────────────
Display QR Code        →        User logs in
                              ↓
                              Opens /attendance/scan
                              ↓
                              Camera opens
                              ↓
Scans QR from laptop   ←        Points camera at laptop
                              ↓
                              QR code detected
                              ↓
                              Location validated
                              ↓
                              Attendance marked ✅
```

## Requirements

1. **Laptop/Computer**: 
   - Display `/hr/qr-display` page
   - Keep it open and visible
   - Can be full screen (F11)

2. **Mobile Phone**:
   - User must be logged in
   - Camera permission required
   - Location/GPS permission required
   - Must be within site radius

## Benefits

✅ QR code displayed on large screen (easy to scan)
✅ Employees use their own phones (no shared devices)
✅ Location validation (prevents remote attendance)
✅ One QR code for all employees
✅ Simple and fast process

## Alternative: Static QR Code

If you want a **static QR code** that can be printed and displayed:
- Generate QR code image
- Print it
- Display at site entrance
- Employees scan the printed QR code

This is also possible! The QR code is the same whether displayed on screen or printed.

