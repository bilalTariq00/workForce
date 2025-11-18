# EHS Module Implementation

## Overview

The EHS (Environment, Health & Safety) module has been fully implemented, covering all three use cases:
- **EHS-01**: Incident Triage & Investigation
- **EHS-02**: Site Inspection & Checklist
- **EHS-03**: Training Register Oversight

## Components Implemented

### 1. Incident Management (EHS-01)

#### Models
- **`lib/models/Incident.js`**: Incident model with fields for:
  - Site, reporter, type (incident/near-miss), severity
  - Description, photos, location
  - Status workflow: reported → under_investigation → resolved → closed
  - Corrective actions with assignment and tracking
  - Investigation notes

#### API Endpoints
- `GET /api/v1/incidents` - List incidents with filters
- `POST /api/v1/incidents` - Create incident report
- `GET /api/v1/incidents/[id]` - Get single incident
- `PUT /api/v1/incidents/[id]` - Update incident
- `POST /api/v1/incidents/[id]/assign` - Assign to EHS officer
- `POST /api/v1/incidents/[id]/resolve` - Resolve with notes and actions
- `POST /api/v1/incidents/[id]/close` - Close resolved incident
- `PUT /api/v1/incidents/[id]/actions/[actionId]` - Update corrective action status

#### UI Components
- **`app/attendance/incidents/page.jsx`**: Employee incident reporting page
- **`components/attendance/IncidentReportForm.jsx`**: Form for reporting incidents
- **`components/attendance/IncidentList.jsx`**: List of employee's reported incidents
- **`app/ehs/incidents/page.jsx`**: EHS incident triage page
- **`components/ehs/IncidentTriageList.jsx`**: List of all incidents for EHS officers
- **`components/ehs/IncidentTriageModal.jsx`**: Modal for triaging and investigating incidents

#### Features
- Employees and Site Managers can report incidents/near-misses
- Photo upload support (max 10 photos)
- EHS officers can assign, investigate, and resolve incidents
- Corrective actions can be assigned to employees
- Status tracking throughout investigation lifecycle

### 2. Site Inspection & Checklist (EHS-02)

#### Models
- **`lib/models/Inspection.js`**: Inspection model with fields for:
  - Site, inspector, inspection date, type (safety/environmental/compliance/general)
  - Title, notes, checklist items
  - Issues found with severity, location, photos
  - Issue assignment and tracking
  - Overall rating and follow-up requirements

#### API Endpoints
- `GET /api/v1/inspections` - List inspections with filters
- `POST /api/v1/inspections` - Create new inspection
- `GET /api/v1/inspections/[id]` - Get single inspection
- `PUT /api/v1/inspections/[id]` - Update inspection
- `POST /api/v1/inspections/[id]/complete` - Mark inspection as completed

#### Features
- EHS officers can create inspections with checklist items
- Issues can be logged with severity levels
- Issues can be assigned to employees for resolution
- Status tracking: draft → completed
- Follow-up date tracking

### 3. Training Register (EHS-03)

#### Models
- **`lib/models/TrainingRegister.js`**: Training register model with fields for:
  - Employee, training type, title, description
  - Mandatory flag, due date, expiry date
  - Status: not_started → in_progress → completed → overdue/expired
  - Link to certifications
  - Provider, certificate URL, notes
  - Auto-status updates based on dates

#### API Endpoints
- `GET /api/v1/training-register` - List training records with filters
  - Supports `overdue` and `dueSoon` query parameters
- `POST /api/v1/training-register` - Create training record
- `GET /api/v1/training-register/[id]` - Get single training record
- `PUT /api/v1/training-register/[id]` - Update training record

#### Features
- EHS/HR officers can assign mandatory training
- Auto-status updates (overdue, expired)
- Links to certification system
- Employees can update their training status
- Static methods for finding overdue/due soon training

### 4. Alert Integration

#### Alert Types Added
- **`critical_incident`**: Alerts for critical severity incidents
- **`overdue_training`**: Alerts for overdue mandatory training
- **`inspection_issue`**: Alerts for open inspection issues

#### Alert Engine Updates
- **`lib/services/alertEngine.js`**: Added functions:
  - `generateCriticalIncidentAlert()`: Generates alerts for critical incidents
  - `generateInspectionIssueAlert()`: Generates alerts for open inspection issues
  - `generateOverdueTrainingAlert()`: Generates alerts for overdue training

#### Alert Model Updates
- **`lib/models/Alert.js`**: Added new alert types to enum

## Access Control

### Incident Reporting
- **All authenticated users**: Can report incidents for their assigned site
- **EHS/HR/Admin**: Can see all incidents
- **Employees/Site Managers**: Can only see incidents for their assigned site

### Inspections
- **EHS officers**: Can create and manage inspections
- **Site Managers**: Can view inspections for their assigned site
- **HR/Admin**: Full access

### Training Register
- **Employees**: Can view and update their own training
- **EHS/HR/Admin**: Can create and manage all training records

## Usage

### Reporting an Incident
1. Navigate to `/attendance/incidents`
2. Click "Report New Incident"
3. Fill in incident details (type, severity, description, photos)
4. Submit - EHS will be notified

### Triage and Investigation
1. EHS officers navigate to `/ehs/incidents`
2. View all incidents with filters
3. Click "Triage" on reported incidents to assign
4. Click "Investigate" on assigned incidents to resolve
5. Add investigation notes and corrective actions
6. Close resolved incidents

### Creating an Inspection
1. EHS officers use the inspection API or UI (to be created)
2. Create inspection with checklist items
3. Log issues found during inspection
4. Assign issues to employees
5. Mark inspection as completed

### Managing Training
1. EHS/HR officers create training records via API
2. Set due dates and mandatory flags
3. System auto-updates status (overdue, expired)
4. Employees can update completion status
5. Link to certifications when applicable

## Integration Points

### Dashboard
- EHS data will appear in Contracts Manager dashboard
- Critical incidents shown as alerts
- Inspection issues tracked
- Overdue training highlighted

### Alerts
- Critical incidents generate critical alerts
- Inspection issues generate warning/critical alerts
- Overdue training generates warning alerts
- All alerts auto-resolve when conditions are met

## Next Steps

### UI Pages to Create
1. **Inspection Management Page** (`/ehs/inspections`)
   - Create new inspections
   - View inspection history
   - Manage checklist items
   - Log and assign issues

2. **Training Register Page** (`/ehs/training`)
   - View all training records
   - Create new training assignments
   - Track overdue training
   - Link to certifications

### Future Enhancements
1. Email notifications for critical incidents
2. SMS alerts for urgent safety issues
3. Training reminder system
4. Inspection scheduling
5. Compliance reporting
6. Integration with external training providers

## Testing

### Test Incident Flow
1. Employee reports incident
2. EHS officer assigns to investigator
3. Investigator resolves with actions
4. Actions are tracked and completed
5. Incident is closed

### Test Inspection Flow
1. EHS officer creates inspection
2. Adds checklist items
3. Logs issues found
4. Assigns issues to employees
5. Marks inspection complete

### Test Training Flow
1. EHS officer creates training record
2. Sets due date in past (should be overdue)
3. Employee updates status to completed
4. System updates status automatically

## Notes

- Photo upload currently uses data URLs - should be replaced with actual file upload service
- Training reminders can be implemented using scheduled tasks
- Inspection templates can be added for common inspection types
- Integration with certification system is ready via `certificationId` field

