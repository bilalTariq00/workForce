# Variation/Change Order System Implementation (SM-06 & CM-04)

**Status:** ✅ **COMPLETE**

**Implementation Date:** Current  
**Use Cases:** SM-06 (Variation/Change Order Initiation) & CM-04 (Variation/Change Order Approval)

---

## ✅ Completed Features

### 1. Variation Model (`lib/models/Variation.js`)
- ✅ All required fields (title, description, cost, delayDays, status, approval workflow)
- ✅ Status flow: draft → pending → approved/rejected
- ✅ Instance methods for checking edit/submit/approve permissions
- ✅ Indexes for efficient queries
- ✅ Virtual for formatted cost display

### 2. API Endpoints

#### `/api/v1/variations` (GET, POST)
- ✅ List variations with filters (siteId, status, siteManagerId)
- ✅ Create new variations
- ✅ Role-based access control

#### `/api/v1/variations/[id]` (GET, PUT, DELETE)
- ✅ Get single variation
- ✅ Update variation (only draft/rejected)
- ✅ Delete variation (only draft/rejected)

#### `/api/v1/variations/[id]/submit` (POST)
- ✅ Submit draft variation for approval
- ✅ Changes status from draft to pending

#### `/api/v1/variations/[id]/approve` (POST)
- ✅ Approve or reject variation
- ✅ CM approval workflow
- ✅ Commercial notes and rejection reason tracking

### 3. Site Manager Features

#### `/site-manager/variations` Page
- ✅ Create new variations
- ✅ Edit draft/rejected variations
- ✅ Submit variations for approval
- ✅ View all variations for assigned site
- ✅ Delete draft/rejected variations

#### Components
- ✅ `VariationForm.jsx` - Create/edit form component
- ✅ `VariationList.jsx` - List view with status badges

### 4. Contracts Manager Features

#### `/contracts-manager/variations` Page
- ✅ View all variations across all sites
- ✅ Filter by status
- ✅ Search by title, site, or manager
- ✅ Review and approve/reject variations
- ✅ Add commercial notes

#### Components
- ✅ `VariationApprovalList.jsx` - Approval list with filters
- ✅ `VariationApprovalModal.jsx` - Approval/rejection modal

### 5. Dashboard Integration

#### CM Multi-Site Dashboard
- ✅ Variation widgets showing:
  - Pending variations count
  - Approved variations count
  - Total variation cost
  - Total variation delay (days)

### 6. Alert Integration

#### Alert Engine
- ✅ **Pending Variations Alert**
  - Trigger: Variations pending approval
  - Severity: Warning (1-4), Critical (5+)
  - Auto-resolves when all variations are approved/rejected

- ✅ **High Cost Variation Alert**
  - Trigger: Variation cost ≥ £10,000 pending approval
  - Severity: Critical
  - Auto-resolves when variation is approved/rejected

---

## 📁 Files Created

### Models
- `lib/models/Variation.js`

### API Routes
- `app/api/v1/variations/route.js`
- `app/api/v1/variations/[id]/route.js`
- `app/api/v1/variations/[id]/submit/route.js`
- `app/api/v1/variations/[id]/approve/route.js`

### Pages
- `app/site-manager/variations/page.jsx`
- `app/contracts-manager/variations/page.jsx`

### Components
- `components/site-manager/VariationForm.jsx`
- `components/site-manager/VariationList.jsx`
- `components/contracts-manager/VariationApprovalList.jsx`
- `components/contracts-manager/VariationApprovalModal.jsx`

### Modified Files
- `app/api/v1/dashboard/multi-site/route.js` - Added variation widgets
- `lib/services/alertEngine.js` - Added variation alerts
- `lib/models/Alert.js` - Added variation alert types

---

## 🔧 Technical Details

### Status Flow
1. **draft** - Site Manager creates variation, can edit/delete
2. **pending** - Submitted for approval, cannot edit
3. **approved** - Approved by Contracts Manager
4. **rejected** - Rejected by Contracts Manager (can be edited and resubmitted)

### Access Control
- **Site Managers**: Can create/edit/delete their own draft/rejected variations for their assigned site
- **Contracts Managers**: Can view all variations and approve/reject pending ones
- **HR/Admin**: Can view all variations and approve/reject

### Cost & Delay Tracking
- Cost stored as number (GBP, 2 decimal places)
- Delay stored as number (days)
- Both displayed in dashboard widgets
- Used for project cost and timeline management

---

## 🚀 Usage

### For Site Managers
1. Navigate to `/site-manager/variations`
2. Click "Create Variation"
3. Fill in title, description, cost, and delay
4. Save as draft or submit for approval
5. Edit draft variations as needed
6. View status of submitted variations

### For Contracts Managers
1. Navigate to `/contracts-manager/variations`
2. View all pending variations
3. Click "Review" on a pending variation
4. Review details and approve/reject
5. Add commercial notes (for approval) or rejection reason
6. View approved/rejected variations

### Dashboard Integration
- CM dashboard shows variation counts and totals
- Alerts generated for pending and high-cost variations
- Variation data included in site widgets

---

## 🔮 Future Enhancements

1. **Budget Integration**
   - Link variations to project budgets
   - Track budget impact
   - Alert when budget exceeded

2. **Variation Templates**
   - Pre-defined variation types
   - Common variations library

3. **Approval Workflow**
   - Multi-level approvals
   - Approval chains
   - Escalation rules

4. **Cost Analysis**
   - Variation cost trends
   - Site comparison
   - Historical data

5. **Notifications**
   - Email notifications for pending variations
   - Notify CM when variation submitted
   - Notify SM when variation approved/rejected

---

## ✅ Testing Checklist

- [ ] Create variation as Site Manager
- [ ] Edit draft variation
- [ ] Submit variation for approval
- [ ] View variations list
- [ ] CM approves variation
- [ ] CM rejects variation
- [ ] SM edits rejected variation and resubmits
- [ ] Delete draft variation
- [ ] Filter variations by status
- [ ] Search variations
- [ ] Dashboard shows variation widgets
- [ ] Alerts generated for pending variations
- [ ] Alerts generated for high-cost variations

---

## 📊 Integration Points

### With CM Dashboard (CM-01)
- ✅ Variation widgets showing counts and totals
- ✅ Variation data in site widgets

### With Alert System (CM-03)
- ✅ Pending variations alerts
- ✅ High-cost variation alerts

### With Site Management
- ✅ Variations linked to sites
- ✅ Site Managers can only create for assigned site

---

## 🎯 Use Case Completion

### SM-06: Variation/Change Order Initiation ✅
- ✅ Create draft VO with cost & delay
- ✅ Send to CM for approval
- ✅ Edit draft variations
- ✅ Submit for approval

### CM-04: Variation/Change Order Approval ✅
- ✅ Approve/Reject VO from SM-06
- ✅ Add commercial notes
- ✅ Approval workflow
- ✅ Integration with SM-06

---

**Implementation Complete!** 🎉

