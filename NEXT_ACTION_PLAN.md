# Next Action Plan

## 🎯 Recommended Next Step: Complete Sprint-3

### **CM-03: Exception Alert Review (Alert Engine)**

**Why This First:**
1. ✅ Part of Sprint-3 (75% complete - only this remains)
2. ✅ Integrates with CM-01 dashboard (just completed)
3. ✅ High visibility feature for Contracts Managers
4. ✅ Foundation for other alert-based features

---

## 📋 What Needs to Be Built

### 1. Alert Model (`lib/models/Alert.js`)
**Purpose:** Store alert records

**Fields:**
- `type`: Enum (cost_variance, missed_log, high_incident, low_attendance, etc.)
- `severity`: Enum (critical, warning, info)
- `siteId`: Reference to Site
- `title`: Alert title
- `description`: Alert details
- `status`: Enum (active, acknowledged, resolved)
- `acknowledgedBy`: Reference to Employee
- `acknowledgedAt`: Date
- `resolvedAt`: Date
- `metadata`: Object (flexible data for different alert types)
- `relatedEntityId`: Reference (to daily log, payroll run, etc.)
- `relatedEntityType`: String (daily_log, payroll_run, attendance, etc.)

### 2. Alert Engine Service (`lib/services/alertEngine.js`)
**Purpose:** Generate alerts based on rules

**Rules to Implement:**
1. **Cost Variance Alert**
   - Trigger: Budget vs actual spend exceeds threshold (e.g., >10%)
   - Check: Payroll spend vs budget (if budget exists)
   - Severity: `critical` if >20%, `warning` if 10-20%

2. **Missed Daily Log Alert**
   - Trigger: No daily log for a site after 5 PM
   - Check: Daily logs for today
   - Severity: `warning`

3. **High Incident Rate Alert**
   - Trigger: Incident count exceeds threshold (e.g., >3 in a week)
   - Check: Incident records (when EHS-01 is implemented)
   - Severity: `critical`

4. **Low Attendance Alert**
   - Trigger: Attendance < 80% of planned
   - Check: Attendance verification data
   - Severity: `warning` if 70-80%, `critical` if <70%

5. **Missing Timesheet Alert**
   - Trigger: No timesheet generated for employee for current week
   - Check: Timesheet records
   - Severity: `warning`

### 3. Alert API Endpoints
- `GET /api/v1/alerts` - List alerts with filters
- `GET /api/v1/alerts/[id]` - Get single alert
- `POST /api/v1/alerts/[id]/acknowledge` - Acknowledge alert
- `POST /api/v1/alerts/[id]/resolve` - Resolve alert
- `POST /api/v1/alerts/generate` - Manually trigger alert generation (for testing)

### 4. Alert Dashboard Page (`/contracts-manager/alerts`)
**Features:**
- List all alerts with filters (type, severity, status, site)
- Alert cards with color coding
- Acknowledge/Resolve actions
- Alert details modal
- Real-time updates

### 5. Integration with CM-01 Dashboard
- Show alert count in dashboard totals
- Show critical alerts on site widgets
- Alert indicators on site cards
- Link to alert dashboard

---

## 🏗️ Implementation Steps

### Step 1: Create Alert Model
- Define schema with all fields
- Add indexes for performance
- Add instance methods (acknowledge, resolve)

### Step 2: Create Alert Engine Service
- Implement alert generation rules
- Create functions for each alert type
- Add scheduled job (or manual trigger) to generate alerts

### Step 3: Create Alert API Endpoints
- List alerts with filters
- Get single alert
- Acknowledge alert
- Resolve alert
- Generate alerts (manual trigger)

### Step 4: Create Alert Dashboard UI
- Alert list page
- Alert filters
- Alert cards
- Acknowledge/Resolve actions

### Step 5: Integrate with CM-01 Dashboard
- Add alert count to dashboard totals
- Show alerts on site widgets
- Add alert indicators

### Step 6: Test Alert Generation
- Test each alert rule
- Test alert acknowledgment
- Test alert resolution
- Test alert filtering

---

## 📊 Estimated Time: 5-7 days

---

## 🔄 Alternative Options

### Option 2: LB-06 & HR-06: Certification Upload & Tracking
**Why:** Safety compliance requirement
**Priority:** High
**Estimated Time:** 7-10 days

**What's Needed:**
- Certification model
- File upload functionality
- HR/EHS validation workflow
- Expiry reminders
- Gate access blocking

### Option 3: SM-06 & CM-04: Variation/Change Order
**Why:** Critical for cost management
**Priority:** High
**Estimated Time:** 5-7 days

**What's Needed:**
- Variation model
- SM creates draft VO
- CM approval workflow
- Cost tracking

### Option 4: Test All Completed Features
**Why:** Ensure quality before moving forward
**Priority:** Medium
**Estimated Time:** 2-3 days

**What's Needed:**
- Test all 11 completed use cases
- Fix any bugs found
- Update test checklist

---

## 💡 Recommendation

**Complete Sprint-3 first (CM-03: Exception Alert Review)**

**Reasons:**
1. ✅ Closes out Sprint-3 (100% complete)
2. ✅ Natural extension of CM-01 dashboard
3. ✅ High value for Contracts Managers
4. ✅ Foundation for future alert-based features
5. ✅ Relatively self-contained (doesn't depend on other features)

**After CM-03, then:**
1. Test all completed features
2. Move to LB-06 & HR-06 (Certification)
3. Then SM-06 & CM-04 (Variations)

---

## 🚀 Ready to Start?

If you want to proceed with **CM-03: Exception Alert Review**, I can start implementing:
1. Alert Model
2. Alert Engine Service
3. Alert API Endpoints
4. Alert Dashboard UI
5. Integration with CM-01 Dashboard

This will complete Sprint-3 and provide Contracts Managers with a powerful alert system for monitoring all sites.

