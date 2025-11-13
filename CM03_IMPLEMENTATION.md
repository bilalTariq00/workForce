# CM-03: Exception Alert Review - Implementation Complete ✅

## Overview

The Exception Alert Review system provides Contracts Managers with automated alerts for red-flag events across all sites. This completes Sprint-3.

## What Was Implemented

### 1. Alert Model (`lib/models/Alert.js`)

**Purpose:** Store alert records in the database

**Key Fields:**
- `type`: Alert type (cost_variance, missed_daily_log, low_attendance, missing_timesheet, etc.)
- `severity`: Alert severity (critical, warning, info)
- `siteId`: Reference to Site
- `title`: Alert title
- `description`: Alert details
- `status`: Alert status (active, acknowledged, resolved)
- `metadata`: Flexible data for different alert types
- `relatedEntityId` & `relatedEntityType`: Link to related entities

**Methods:**
- `acknowledge()`: Acknowledge an alert
- `resolve()`: Resolve an alert
- `getActiveCount()`: Get active alerts count for a site
- `getCriticalCount()`: Get critical alerts count

---

### 2. Alert Engine Service (`lib/services/alertEngine.js`)

**Purpose:** Generate alerts based on business rules

**Alert Rules Implemented:**

1. **Missed Daily Log Alert**
   - Trigger: No daily log for a site after 5 PM
   - Severity: Warning
   - Auto-resolves when log is created

2. **Low Attendance Alert**
   - Trigger: Attendance < 80% of planned
   - Severity: Warning (80-70%), Critical (<70%)
   - Auto-resolves when attendance improves

3. **Missing Timesheet Alert**
   - Trigger: No timesheet generated for employee for current week
   - Severity: Warning
   - Checks all active labour employees

4. **Cost Variance Alert** (Framework ready)
   - Trigger: Budget vs actual spend exceeds threshold
   - Severity: Warning (10-20%), Critical (>20%)
   - Ready for implementation when budget tracking is added

5. **High Incident Rate Alert** (Framework ready)
   - Trigger: Incident count exceeds threshold
   - Severity: Critical
   - Ready for implementation when EHS-01 is done

**Functions:**
- `generateAlertsForSite(site)`: Generate alerts for a single site
- `generateAlertsForAllSites()`: Generate alerts for all sites
- `autoResolveAlerts(site)`: Auto-resolve alerts that are no longer valid

---

### 3. Alert API Endpoints

#### GET `/api/v1/alerts`
- List all alerts with filters (siteId, type, severity, status)
- Returns alert counts (total, active, critical, warning)
- Access: Contracts Manager, Admin only

#### GET `/api/v1/alerts/[id]`
- Get a single alert by ID
- Includes populated site and user references

#### POST `/api/v1/alerts`
- Manually trigger alert generation
- Body: `{ "action": "generate" }`

#### POST `/api/v1/alerts/[id]/acknowledge`
- Acknowledge an alert
- Body: `{ "notes": "optional notes" }`

#### POST `/api/v1/alerts/[id]/resolve`
- Resolve an alert
- Body: `{ "notes": "optional notes" }`

---

### 4. Alert Dashboard UI

#### Alert Dashboard Page (`/contracts-manager/alerts`)
- Lists all alerts with filters
- Shows alert counts (total, active, critical, warning)
- Filter by status, severity, type
- Manual alert generation button
- Auto-refresh every 2 minutes

#### Components Created:
- `AlertListClient`: Main alert list component
- `AlertCard`: Individual alert card with details
- `AlertActions`: Acknowledge/Resolve actions with modals

**Features:**
- Color-coded severity indicators
- Status badges
- Alert metadata display
- Acknowledge/Resolve actions
- Filtering and search
- Real-time updates

---

### 5. Integration with CM-01 Dashboard

**Dashboard Totals Widget:**
- Added "Active Alerts" widget
- Shows total active alerts
- Shows critical alerts count
- Clickable link to alerts page

**Site Widgets:**
- Alert count badge on each site widget
- Shows active alerts count
- Shows critical alerts count
- Link to filtered alerts page for that site

**Dashboard API:**
- Updated `/api/v1/dashboard/multi-site` to include alert counts
- Returns `alerts.activeCount` and `alerts.criticalCount` for each site
- Returns total alert counts in `totals.alerts`

---

## Alert Types

### Currently Active:
1. **missed_daily_log**: No daily log after 5 PM
2. **low_attendance**: Attendance below 80%
3. **missing_timesheet**: No timesheet for current week

### Ready for Future Implementation:
4. **cost_variance**: Budget vs actual spend (when budget tracking is added)
5. **high_incident_rate**: High incident count (when EHS-01 is implemented)

---

## Alert Workflow

```
Alert Generated (by Alert Engine)
    ↓
Status: 'active'
    ↓
Contracts Manager Reviews
    ↓
Acknowledge (optional)
    ↓
Status: 'acknowledged'
    ↓
Resolve (when issue fixed)
    ↓
Status: 'resolved'
```

---

## Auto-Resolution

The alert engine automatically resolves alerts when:
- **Missed Daily Log**: Daily log is created
- **Low Attendance**: Attendance improves above 80%

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

## Files Created

1. `lib/models/Alert.js` - Alert model
2. `lib/services/alertEngine.js` - Alert generation service
3. `app/api/v1/alerts/route.js` - List and generate alerts API
4. `app/api/v1/alerts/[id]/route.js` - Get single alert API
5. `app/api/v1/alerts/[id]/acknowledge/route.js` - Acknowledge alert API
6. `app/api/v1/alerts/[id]/resolve/route.js` - Resolve alert API
7. `app/contracts-manager/alerts/page.jsx` - Alert dashboard page
8. `components/contracts-manager/AlertListClient.jsx` - Alert list component
9. `components/contracts-manager/AlertCard.jsx` - Alert card component
10. `components/contracts-manager/AlertActions.jsx` - Alert actions component

## Files Modified

1. `app/api/v1/dashboard/multi-site/route.js` - Added alert counts
2. `components/contracts-manager/DashboardTotals.jsx` - Added alerts widget
3. `components/contracts-manager/SiteWidget.jsx` - Added alert indicators

---

## Testing

### Manual Testing Steps:

1. **Generate Alerts**
   - Login as Contracts Manager
   - Go to `/contracts-manager/alerts`
   - Click "Generate Alerts"
   - Should create alerts for sites with issues

2. **View Alerts**
   - Should see list of alerts
   - Should see alert counts
   - Should see filters working

3. **Acknowledge Alert**
   - Click "Acknowledge" on an alert
   - Add optional notes
   - Alert status should change to "acknowledged"

4. **Resolve Alert**
   - Click "Resolve" on an alert
   - Add optional notes
   - Alert status should change to "resolved"

5. **Filter Alerts**
   - Filter by status (active, acknowledged, resolved)
   - Filter by severity (critical, warning, info)
   - Filter by type (missed_daily_log, low_attendance, etc.)

6. **Dashboard Integration**
   - Go to `/contracts-manager/dashboard`
   - Should see "Active Alerts" widget
   - Should see alert counts on site widgets
   - Click on alerts widget should go to alerts page

---

## Alert Generation Triggers

### Automatic (via Alert Engine):
- Runs when "Generate Alerts" is clicked
- Can be scheduled (future enhancement)

### Manual:
- Contracts Manager clicks "Generate Alerts" button
- Generates alerts for all active sites

---

## Status

✅ **COMPLETE** - CM-03: Exception Alert Review is fully implemented and ready for use.

**Sprint-3 Status:** ✅ **100% COMPLETE**

---

## Next Steps

According to the use case document, the next priorities are:

1. **LB-06 & HR-06: Certification Upload & Tracking** (High priority - safety compliance)
2. **SM-06 & CM-04: Variation/Change Order** (Critical for cost management)
3. **CM-02: Resource Re-Allocation** (Medium priority)
4. **EHS Module** (EHS-01, EHS-02, EHS-03) (Medium priority)

---

## Notes

- Alert engine is extensible - new alert types can be easily added
- Auto-resolution ensures alerts stay current
- Alert metadata provides flexible data storage
- Integration with dashboard provides immediate visibility
- Alert filtering allows Contracts Managers to focus on critical issues

---

**Sprint-3 is now 100% complete! 🎉**

