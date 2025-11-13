# CM-01: Multi-Site Dashboard - Implementation Complete ✅

## Overview

The Multi-Site Dashboard provides Contracts Managers with a real-time overview of all construction sites, displaying key metrics and widgets for each site.

## What Was Implemented

### 1. Contracts Manager Layout (`components/layouts/ContractsManagerLayout.jsx`)

**Purpose:** Provides consistent sidebar navigation for Contracts Manager pages

**Features:**
- Collapsible sidebar with tooltips
- Menu items:
  - Dashboard
  - Sites
  - Alerts
  - Resource Allocation
  - Variations
  - Reports
  - Settings
- Brown/white theme matching other layouts
- Responsive design (mobile and desktop)

---

### 2. Dashboard Aggregation API (`app/api/v1/dashboard/multi-site/route.js`)

**Purpose:** Aggregates data from all sites for dashboard display

**Returns:**
- List of sites with widgets:
  - **Headcount**: Current vs planned, attendance percentage, status (good/warning/critical)
  - **Progress %**: Placeholder (0% for now, will be implemented in SM-04)
  - **Incidents**: Placeholder (0 for now, will be implemented in EHS-01)
  - **Spend**: Calculated from payroll runs
- Totals across all sites
- Alerts (missing daily log, low attendance)

**Data Sources:**
- `Site` model - All active sites
- `Attendance` model - Current headcount (today's attendance)
- `DailyLog` model - Planned headcount, progress (placeholder)
- `PayrollRun` model - Spend calculation
- `Employee` model - Site assignments

**Access Control:**
- Only Contracts Managers and Admin can access

---

### 3. Dashboard Page (`app/contracts-manager/dashboard/page.jsx`)

**Purpose:** Main dashboard page for Contracts Managers

**Features:**
- Server-side authentication check
- Role-based access control
- Wraps content in `ContractsManagerLayout`

**Route:** `/contracts-manager/dashboard`

---

### 4. Dashboard Client Component (`components/contracts-manager/MultiSiteDashboardClient.jsx`)

**Purpose:** Client-side dashboard display with real-time updates

**Features:**
- Fetches dashboard data from API
- Auto-refresh every 5 minutes
- Manual refresh button
- Loading states
- Error handling
- Displays:
  - Dashboard totals (aggregated across all sites)
  - Site widgets grid

---

### 5. Dashboard Totals Component (`components/contracts-manager/DashboardTotals.jsx`)

**Purpose:** Displays aggregated totals across all sites

**Widgets:**
1. **Total Headcount**: Current / Planned with difference
2. **Average Progress**: Average progress % across all sites
3. **Total Incidents**: Sum of all incidents
4. **Total Spend**: Total payroll spend across all sites

**Design:**
- 4-column grid (responsive)
- Color-coded icons
- Large, readable numbers

---

### 6. Site Widget Component (`components/contracts-manager/SiteWidget.jsx`)

**Purpose:** Displays widgets for a single site

**Widgets:**
1. **Headcount Widget** (Blue)
   - Current / Planned headcount
   - Attendance percentage
   - Status badge (good/warning/critical)
   - Color-coded based on attendance

2. **Progress Widget** (Green)
   - Progress percentage
   - Last updated date

3. **Incidents Widget** (Orange)
   - Incident count
   - Period indicator

4. **Spend Widget** (Purple)
   - Total spend (formatted as currency)
   - Payroll indicator

**Additional Features:**
- Alert indicators (missing daily log, low attendance)
- View Site Details link
- Responsive card design

---

## Data Flow

```
Contracts Manager Dashboard
    ↓
MultiSiteDashboardClient (fetches data)
    ↓
GET /api/v1/dashboard/multi-site
    ↓
Aggregates from:
- Site model (all active sites)
- Attendance model (current headcount)
- DailyLog model (planned headcount, progress)
- PayrollRun model (spend)
- Employee model (site assignments)
    ↓
Returns aggregated data
    ↓
Displayed in widgets
```

---

## Widget Details

### Headcount Widget
- **Current**: Count of attendance records for today
- **Planned**: From today's daily log (`plannedHeadcount`)
- **Attendance %**: (Current / Planned) × 100
- **Status**:
  - `good`: ≥ 95%
  - `warning`: 80-94%
  - `critical`: < 80%

### Progress Widget
- **Current**: Placeholder (0%)
- **Future**: Will be implemented in SM-04 (Progress Photo & % Complete)
- **Last Updated**: Date of latest daily log

### Incidents Widget
- **Current**: Placeholder (0)
- **Future**: Will be implemented in EHS-01 (Incident Triage & Investigation)

### Spend Widget
- **Current**: Calculated from payroll runs
- **Method**: Simplified calculation (divides total by number of sites)
- **Future**: More accurate tracking per site when payroll is enhanced

---

## Alerts

### Missing Daily Log
- **Trigger**: No daily log for today AND time is after 5 PM
- **Display**: Red badge on site widget

### Low Attendance
- **Trigger**: Attendance percentage < 80%
- **Display**: Alert indicator on site widget

---

## Access Control

### Who Can Access:
- ✅ Contracts Managers (`contracts_manager` role)
- ✅ Admin (`admin` role)

### Who Cannot Access:
- ❌ Site Managers
- ❌ HR Officers
- ❌ Labour workers
- ❌ EHS Officers

---

## API Endpoint

### GET `/api/v1/dashboard/multi-site`

**Request:**
```http
GET /api/v1/dashboard/multi-site
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sites": [
      {
        "_id": "...",
        "name": "Construction Site A",
        "siteCode": "CSA-001",
        "address": {...},
        "status": "active",
        "contractsManager": {...},
        "widgets": {
          "headcount": {
            "current": 45,
            "planned": 50,
            "difference": -5,
            "attendancePercentage": 90,
            "status": "warning"
          },
          "progress": {
            "percentage": 0,
            "lastUpdated": null
          },
          "incidents": {
            "count": 0
          },
          "spend": {
            "total": 125000.50,
            "currency": "GBP"
          }
        },
        "alerts": {
          "missingDailyLog": false,
          "lowAttendance": false
        }
      }
    ],
    "totals": {
      "headcount": {
        "current": 120,
        "planned": 150
      },
      "progress": {
        "average": 0
      },
      "incidents": {
        "total": 0
      },
      "spend": {
        "total": 500000.00
      }
    },
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Future Enhancements

### When SM-04 is Implemented:
- Progress % will be calculated from daily logs or WBS progress
- Progress tracking will be accurate

### When EHS-01 is Implemented:
- Incidents count will be real
- Incident severity breakdown will be added
- Incident trends will be displayed

### When Payroll is Enhanced:
- More accurate spend calculation per site
- Site-specific payroll tracking
- Budget vs actual spend comparison

### When CM-03 is Implemented:
- Exception alerts will be integrated
- Alert dashboard will be available
- Alert filtering and actions

---

## Testing

### Manual Testing Steps:

1. **Login as Contracts Manager**
   - Create a Contracts Manager employee (via HR)
   - Login with credentials
   - Navigate to `/contracts-manager/dashboard`

2. **Verify Dashboard Loads**
   - Should see dashboard with site widgets
   - Should see totals at the top
   - Should see all active sites

3. **Verify Widgets Display**
   - Headcount widget shows current/planned
   - Progress widget shows 0% (placeholder)
   - Incidents widget shows 0 (placeholder)
   - Spend widget shows calculated spend

4. **Verify Alerts**
   - Missing daily log alert appears if no log after 5 PM
   - Low attendance alert appears if < 80%

5. **Verify Refresh**
   - Click refresh button
   - Data should update
   - Auto-refresh every 5 minutes

6. **Verify Responsive Design**
   - Test on mobile
   - Test on tablet
   - Test on desktop
   - Sidebar should collapse on mobile

---

## Files Created

1. `components/layouts/ContractsManagerLayout.jsx` - Layout component
2. `app/api/v1/dashboard/multi-site/route.js` - API endpoint
3. `app/contracts-manager/dashboard/page.jsx` - Dashboard page
4. `components/contracts-manager/MultiSiteDashboardClient.jsx` - Client component
5. `components/contracts-manager/DashboardTotals.jsx` - Totals component
6. `components/contracts-manager/SiteWidget.jsx` - Site widget component

---

## Integration Points

### Existing Systems:
- ✅ **Sites**: Reads from Site model
- ✅ **Attendance**: Reads from Attendance model for headcount
- ✅ **Daily Logs**: Reads from DailyLog model for planned headcount
- ✅ **Payroll**: Reads from PayrollRun model for spend

### Future Integrations:
- 🔜 **SM-04**: Progress % calculation
- 🔜 **EHS-01**: Incidents tracking
- 🔜 **CM-03**: Exception alerts
- 🔜 **SM-06/CM-04**: Variations tracking

---

## Status

✅ **COMPLETE** - CM-01: Multi-Site Dashboard is fully implemented and ready for use.

**Note:** Some widgets show placeholder data (progress %, incidents) which will be populated when related features (SM-04, EHS-01) are implemented.

---

## Next Steps

According to the use case document, the next priority is:

**CM-03: Exception Alert Review** - Alert engine and dashboard for red-flag events.

This will integrate with CM-01 to display alerts on the dashboard.

