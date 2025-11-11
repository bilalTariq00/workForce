# Universal QR Attendance Flow

## Flow Overview

1. **User Logs In** → Redirected to QR Scan page
2. **User Scans Universal QR Code** → System validates:
   - User is authenticated (from session)
   - User's location is within allowed radius
   - QR code is valid
   - User hasn't already marked attendance today
3. **Attendance Marked** → Redirected to dashboard
4. **If Already Marked Today** → Skip QR scan, go directly to dashboard

## Key Features

- **Universal QR Code**: Same QR code for all users/sites
- **Location-Based**: Determines site based on user's GPS location
- **Radius Validation**: Only allows attendance within X meters (configurable)
- **Daily Attendance**: One attendance record per day per user
- **Session-Based**: Uses logged-in user's session to identify who's marking attendance

## Technical Flow

```
Login → Check Attendance Today → 
  If Not Marked: Show QR Scan Page → 
    Scan QR → Get Location → 
      Validate Location (within radius) → 
        Mark Attendance → 
          Redirect to Dashboard
  If Already Marked: Redirect to Dashboard
```

## Data Structure

### Attendance Record
- employeeId (from session)
- siteId (determined from location)
- date (today's date)
- signInTime (timestamp)
- location (lat/lng when scanned)
- signInMethod: "qr"
- status: "present"

### Site Configuration
- location (lat/lng)
- attendanceRadius (meters, e.g., 100m)
- name, address, etc.

## Implementation Steps

1. Create Site model with location and radius
2. Create Attendance model
3. Create universal QR code (static, can be displayed anywhere)
4. Create QR scan page (middleware after login)
5. Implement geolocation validation
6. Create attendance API endpoint
7. Add attendance check middleware

