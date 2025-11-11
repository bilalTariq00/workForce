# Next Steps - Implementation Roadmap

## ✅ Completed (Sprint 1 - Part 1)

- ✅ **Core Platform**: Authentication, RBAC, MongoDB connection
- ✅ **HR-01**: Employee On-boarding (Create employees with all roles)
- ✅ **HR-02**: Profile Maintenance (Basic structure)
- ✅ **Dashboard**: HR Dashboard with collapsible sidebar, brown/white theme
- ✅ **UI Framework**: shadcn/ui components integrated

## 🎯 Next Priority: LB-01 - Site Sign-In/Sign-Out (QR Code)

According to Sprint-1, the next critical feature is **LB-01: Site Sign-In/Sign-Out** with QR code scanning.

### What Needs to Be Built:

1. **Site Management**
   - Create Sites model
   - Generate unique QR codes for each site
   - Site CRUD operations

2. **QR Code System**
   - Generate QR codes for sites
   - QR code contains: site ID, timestamp, type
   - Display QR codes in site management

3. **Attendance System**
   - Attendance model (already in data dictionary)
   - QR code scanner (mobile-friendly)
   - Sign-in/Sign-out API endpoints
   - **Geolocation validation** (only allow sign-in within specific radius)
   - Real-time attendance tracking

4. **Mobile-Optimized Pages**
   - QR scanner page for workers
   - Camera access for QR scanning
   - Manual entry fallback
   - Location permission request

### Implementation Order:

#### Step 1: Site Management (Foundation)
- Create Site model
- Site CRUD API
- Site management page in HR dashboard
- QR code generation for each site

#### Step 2: QR Code Attendance (LB-01)
- Attendance model
- QR code scanner component
- Sign-in page (mobile-first)
- Geolocation validation
- Sign-out functionality
- Attendance API endpoints

#### Step 3: Integration
- Connect attendance to employee records
- Update dashboard with attendance data
- Real-time attendance status

## 📋 Detailed Implementation Plan

### Phase 1: Site Management (2-3 hours)

**Files to Create:**
1. `lib/models/Site.js` - Site model
2. `app/api/v1/sites/route.js` - Site CRUD API
3. `app/hr/sites/page.jsx` - Site management page
4. `components/hr/SiteList.jsx` - Site list component
5. `components/hr/CreateSiteForm.jsx` - Create site form

**Features:**
- Create sites with name, address, location (lat/lng)
- Generate unique QR code for each site
- Display QR code for printing/display
- Edit/Delete sites
- Assign Contracts Manager to site

### Phase 2: QR Code Attendance (3-4 hours)

**Files to Create:**
1. `lib/models/Attendance.js` - Attendance model
2. `app/api/v1/attendance/sign-in/route.js` - Sign-in API
3. `app/api/v1/attendance/sign-out/route.js` - Sign-out API
4. `app/attendance/sign-in/page.jsx` - Sign-in page (mobile)
5. `components/attendance/QRScanner.jsx` - QR scanner component
6. `lib/utils/geolocation.js` - Geolocation validation

**Features:**
- QR code scanner using camera
- Manual QR code entry fallback
- Geolocation check (within X meters of site)
- Sign-in/Sign-out with timestamp
- Prevent duplicate sign-ins
- Show current attendance status

### Phase 3: Attendance Dashboard (1-2 hours)

**Files to Create:**
1. `app/hr/attendance/page.jsx` - Attendance overview
2. `components/hr/AttendanceList.jsx` - Attendance records
3. `components/hr/AttendanceStats.jsx` - Attendance statistics

**Features:**
- View all attendance records
- Filter by site, employee, date
- Export attendance data
- Real-time attendance status

## 🔧 Technical Requirements

### Geolocation Validation

```javascript
// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Haversine formula
  // Return distance in meters
}

// Validate if user is within allowed radius (e.g., 100 meters)
function isWithinRadius(siteLocation, userLocation, radiusMeters) {
  const distance = calculateDistance(
    siteLocation.lat, siteLocation.lng,
    userLocation.lat, userLocation.lng
  );
  return distance <= radiusMeters;
}
```

### QR Code Format

```json
{
  "type": "site_signin",
  "siteId": "site_001",
  "timestamp": 1234567890
}
```

### Required Permissions

- Camera access (for QR scanning)
- Location/GPS access (for geolocation validation)

## 📱 Mobile Considerations

- Full-screen QR scanner
- Large touch targets
- Clear visual feedback
- Offline capability (store locally, sync later)
- Progressive Web App (PWA) features

## 🎨 UI/UX Requirements

- Simple, one-step sign-in process
- Clear success/error messages
- Visual confirmation of sign-in
- Show current status (signed in/out)
- Quick sign-out option

## 📊 Data Flow

1. Worker scans QR code → Gets site ID
2. App requests location permission
3. Validates location (within radius)
4. Creates attendance record
5. Updates dashboard in real-time
6. Site Manager can see who's on site

## Next Steps After LB-01

Once LB-01 is complete, move to:
- **Sprint-2**: SM-01 (Daily Site Log), SM-02 (Attendance Verification), HR-04 (Timesheet Approval)
- **LB-03**: Leave/Absence Request
- **HR-06**: Certification Tracking

---

**Ready to start?** I can begin implementing the Site Management and QR Attendance system now!

