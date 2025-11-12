# Daily Site Log Implementation (SM-01) - Complete ✅

## Overview

The Daily Site Log feature allows Site Managers to create and manage daily logs for their assigned construction sites. Once completed and locked, logs are sent to Contracts Managers for review.

## What Was Implemented

### 1. Data Model (`lib/models/DailyLog.js`)

**Purpose:** Stores daily site log information

**Key Fields:**
- `siteId` - Reference to the construction site
- `siteManagerId` - Reference to the Site Manager who created it
- `date` - Date of the log (one log per site per day)
- `weather` - Weather conditions
- `headcount` - Actual number of workers present
- `plannedHeadcount` - Expected number of workers
- `deliveries` - Array of material deliveries with docket info
- `issues` - General notes and issues
- `status` - draft, locked, or sent

**Business Rules:**
- Only one log per site per day (enforced by unique index)
- Cannot edit after status is "locked"
- Headcount is required before locking
- Auto-sent to Contracts Manager when status changes to "sent"

**Methods:**
- `lock()` - Locks the log (prevents edits)
- `send()` - Sends to Contracts Manager

### 2. API Endpoints

#### GET `/api/v1/daily-logs`
- List all daily logs with filters
- Site Managers see only their own logs
- Contracts Managers, HR, and Admin see all logs
- Supports filtering by site, date, status, siteManagerId

#### POST `/api/v1/daily-logs`
- Create a new daily log
- Only Site Managers can create logs
- Validates one log per site per day
- Starts in "draft" status

#### GET `/api/v1/daily-logs/[id]`
- Get a single daily log by ID
- Includes populated site and site manager info

#### PATCH `/api/v1/daily-logs/[id]`
- Update a daily log
- Only works if status is "draft"
- Only the Site Manager who created it can update it

#### DELETE `/api/v1/daily-logs/[id]`
- Delete a daily log
- Only works if status is "draft"
- Only the Site Manager who created it can delete it

#### POST `/api/v1/daily-logs/[id]/lock`
- Lock a daily log (change status to "locked")
- Requires headcount to be set
- Cannot be undone
- Prevents further edits

#### POST `/api/v1/daily-logs/[id]/send`
- Send a locked log to Contracts Manager
- Changes status to "sent"
- Sets sentAt timestamp
- Future: Will trigger notification to CM

### 3. UI Components

#### Site Manager Dashboard (`app/site-manager/dashboard/page.jsx`)

**Purpose:** Main page for Site Managers to manage daily logs

**Features:**
- Checks if daily log exists for today
- Shows create form if no log exists
- Shows edit form if log is in "draft" status
- Shows read-only view if log is "locked" or "sent"
- Displays site information
- Quick action links

**Access Control:**
- Only Site Managers can access
- Must be assigned to a site (has siteId)
- Redirects if not assigned to a site

#### Daily Log Form (`components/site-manager/DailyLogForm.jsx`)

**Purpose:** Form for creating and editing daily logs

**Features:**
- Weather input
- Headcount inputs (actual vs planned)
- Material deliveries section (add/remove deliveries)
- Issues/notes textarea
- Save as draft button
- Lock button (when draft)
- Send button (when locked)

**State Management:**
- Tracks form data in component state
- Validates before saving
- Shows success/error messages
- Refreshes page after successful operations

#### Delivery Item (`components/site-manager/DeliveryItem.jsx`)

**Purpose:** Individual delivery item in the form

**Features:**
- Material description input
- Docket number input
- Photo URL input (file upload coming later)
- PO match status dropdown
- Remove button

**Note:** Photo upload is currently a URL input. In production, this would upload to cloud storage (S3, Cloudinary) and return a URL.

#### Daily Log View (`components/site-manager/DailyLogView.jsx`)

**Purpose:** Read-only view of a daily log

**Features:**
- Displays all log information
- Shows status badge
- Shows headcount comparison
- Lists all deliveries
- Shows issues/notes
- Displays timestamps (created, locked, sent)

**Used When:**
- Log is locked (cannot edit)
- Log is sent (already submitted)

## User Flow

### Creating a Daily Log

1. Site Manager logs in
2. Navigates to `/site-manager/dashboard`
3. System checks if log exists for today
4. If no log exists, shows create form
5. Site Manager fills in:
   - Weather conditions
   - Actual headcount (required)
   - Planned headcount (optional)
   - Material deliveries (optional)
   - Issues/notes (optional)
6. Clicks "Save as Draft"
7. Can continue editing later

### Locking a Log

1. Site Manager completes the log
2. Ensures headcount is filled in
3. Clicks "Lock Log"
4. System validates required fields
5. Status changes to "locked"
6. Log cannot be edited anymore

### Sending to Contracts Manager

1. Site Manager locks the log
2. Clicks "Send to Contracts Manager"
3. Status changes to "sent"
4. sentAt timestamp is set
5. Future: Notification sent to Contracts Manager

## Data Flow

```
Site Manager → Creates Draft Log → Saves → Locks → Sends → Contracts Manager
```

1. **Draft**: Can be edited, saved multiple times
2. **Locked**: Cannot be edited, ready to send
3. **Sent**: Already submitted to Contracts Manager

## Integration Points

### With Other Features

1. **SM-02 (Attendance Verification)**: Uses `plannedHeadcount` and `headcount` to compare expected vs actual workers
2. **CM-01 (Multi-Site Dashboard)**: Contracts Managers can view all sent logs
3. **SM-03 (Material Receipt)**: Deliveries section tracks material receipts with PO matching

## Security & Access Control

- **Site Managers**: Can only create/edit their own logs for their assigned site
- **Contracts Managers**: Can view all logs (read-only)
- **HR/Admin**: Can view all logs (read-only)
- **Validation**: Prevents duplicate logs, enforces business rules

## Future Enhancements

1. **File Upload**: Replace URL input with actual file upload for docket photos
2. **PO Matching**: Automatic matching of deliveries to Purchase Orders
3. **Notifications**: Email/notification to Contracts Manager when log is sent
4. **Event Bus**: Trigger events when log is locked/sent for dashboard updates
5. **Export**: Export logs to PDF/Excel
6. **Templates**: Pre-fill common values
7. **Mobile App**: Native mobile app for easier on-site entry

## Testing Checklist

- [ ] Create new daily log
- [ ] Edit draft log
- [ ] Save as draft multiple times
- [ ] Lock log (with headcount)
- [ ] Try to lock without headcount (should fail)
- [ ] Try to edit locked log (should fail)
- [ ] Send locked log to CM
- [ ] View sent log (read-only)
- [ ] Delete draft log
- [ ] Try to create duplicate log for same day (should fail)
- [ ] Site Manager can only see their own logs
- [ ] Contracts Manager can see all logs

## Files Created

1. `lib/models/DailyLog.js` - Data model
2. `app/api/v1/daily-logs/route.js` - List and create endpoints
3. `app/api/v1/daily-logs/[id]/route.js` - Get, update, delete endpoints
4. `app/api/v1/daily-logs/[id]/lock/route.js` - Lock endpoint
5. `app/api/v1/daily-logs/[id]/send/route.js` - Send endpoint
6. `app/site-manager/dashboard/page.jsx` - Site Manager dashboard
7. `components/site-manager/DailyLogForm.jsx` - Form component
8. `components/site-manager/DeliveryItem.jsx` - Delivery item component
9. `components/site-manager/DailyLogView.jsx` - Read-only view component

## Next Steps

After SM-01 is complete, move to:
- **SM-02**: Attendance Verification (uses headcount from daily logs)
- **HR-04**: Timesheet Approval (processes attendance data)

---

**Status**: ✅ Complete and ready for testing


