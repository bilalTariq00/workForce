# Next Priorities According to Use Case Document

## 📋 Document Analysis

According to the use case document:

**Sprint-1**: ✅ COMPLETE
- LB-01, HR-01 basics, Core Platform skeleton

**Sprint-2**: ✅ COMPLETE  
- SM-01, SM-02, HR-04 integration

**Sprint-3**: 🚧 PARTIALLY COMPLETE
- ✅ LB-03 leave flow - COMPLETE
- ✅ HR-05 payroll export - COMPLETE
- ❌ CM-01 dashboard & alert engine - NOT STARTED

---

## 🎯 Next Priorities (According to Document)

### **IMMEDIATE: Complete Sprint-3**

#### 1. **CM-01: Multi-Site Dashboard** (HIGH PRIORITY)
**Status**: Not Started  
**Priority**: NOW (Sprint-3)  
**Why**: Contracts Managers need visibility across all sites

**What's Needed:**
- Live widgets showing:
  - Headcount (current vs planned)
  - Progress % (from daily logs)
  - Incidents count
  - Spend (from variations/payroll)
- Real-time updates from events
- Multi-site view
- Exception alerts integration

**Estimated Time**: 7-10 days

---

#### 2. **CM-03: Exception Alert Review** (HIGH PRIORITY)
**Status**: Not Started  
**Priority**: NOW (Sprint-3 - "alert engine")  
**Why**: Critical for Contracts Managers to see red-flag events

**What's Needed:**
- Alert model
- Alert engine with rules:
  - Cost variance alerts
  - Missed daily log alerts
  - High incident rate alerts
  - Attendance discrepancy alerts
- Alert dashboard
- Alert filtering and actions
- Integration with CM-01 dashboard

**Estimated Time**: 7-10 days

---

### **NEXT: Remaining "Now" Priority Items**

#### 3. **LB-06 & HR-06: Certification Upload & Tracking** (HIGH PRIORITY)
**Status**: Not Started  
**Priority**: NOW  
**Why**: Safety compliance requirement

**What's Needed:**
- Certification model (SafePass, CSCS, etc.)
- File upload functionality
- HR/EHS validation workflow
- Expiry reminders (30 days before)
- Gate access blocking for expired certs
- Certification tracking dashboard

**Estimated Time**: 7-10 days

---

#### 4. **SM-06 & CM-04: Variation/Change Order** (HIGH PRIORITY)
**Status**: Not Started  
**Priority**: NOW  
**Why**: Critical for project cost management

**What's Needed:**
- Variation model
- SM creates draft VO with cost & delay
- Send to CM for approval
- CM approval/rejection workflow
- Commercial notes
- Integration with CM dashboard

**Estimated Time**: 5-7 days

---

#### 5. **CM-02: Resource Re-Allocation Request** (MEDIUM PRIORITY)
**Status**: Not Started  
**Priority**: NOW  
**Why**: Allows shifting crew/plant between sites

**What's Needed:**
- Resource re-allocation model
- Request form (shift crew/plant)
- Notify Site Managers
- Approval workflow
- Integration with CM dashboard

**Estimated Time**: 5-7 days

---

#### 6. **EHS-01, EHS-02, EHS-03: EHS Module** (MEDIUM PRIORITY)
**Status**: Not Started  
**Priority**: NOW  
**Why**: Safety and compliance

**What's Needed:**
- EHS-01: Incident Triage & Investigation
- EHS-02: Site Inspection & Checklist
- EHS-03: Training Register Oversight

**Estimated Time**: 10-15 days (all three)

---

## 📊 Current Status Summary

### ✅ Completed (9/20 - 45%)
1. LB-01: Site Sign-In/Sign-Out
2. SM-01: Daily Site Log
3. SM-02: Workforce Attendance Verification
4. SM-03: Material Receipt & PO Auto-Matching
5. HR-01: Employee On-boarding
6. HR-02: Profile Maintenance
7. HR-04: Timesheet Approval
8. LB-03: Leave Request
9. HR-05: Payroll Run & Export

### ❌ Not Started (11/20 - 55%)
1. LB-06: Certification Upload/Renewal
2. SM-06: Variation/Change Order Initiation
3. CM-01: Multi-Site Dashboard ⚠️ **SPRINT-3 PRIORITY**
4. CM-02: Resource Re-Allocation Request
5. CM-03: Exception Alert Review ⚠️ **SPRINT-3 PRIORITY**
6. CM-04: Variation/Change Order Approval
7. HR-03: Leave Balance Mgmt (passive - mostly done, may need enhancement)
8. HR-06: Certification Tracking
9. EHS-01: Incident Triage & Investigation
10. EHS-02: Site Inspection & Checklist
11. EHS-03: Training Register Oversight

---

## 🚀 Recommended Implementation Order

### **Phase 1: Complete Sprint-3 (Next 2-3 Weeks)**

**Week 1-2: CM-01 Multi-Site Dashboard**
- Dashboard aggregation API
- Widget components
- Real-time data updates
- Multi-site view

**Week 2-3: CM-03 Exception Alert Review**
- Alert model
- Alert engine
- Alert dashboard
- Integration with CM-01

### **Phase 2: Critical Features (After Sprint-3)**

**Week 4: LB-06 & HR-06 Certification**
- Certification model
- File upload
- Validation workflow
- Expiry reminders

**Week 5: SM-06 & CM-04 Variation/Change Order**
- Variation model
- SM creation workflow
- CM approval workflow

**Week 6: CM-02 Resource Re-Allocation**
- Resource model
- Request workflow
- Notification system

### **Phase 3: EHS Module (After Critical Features)**

**Week 7-9: EHS Features**
- EHS-01: Incident Management
- EHS-02: Site Inspection
- EHS-03: Training Register

---

## 🎯 Immediate Next Step

**According to the document's Sprint-3 focus:**

### **Start with CM-01: Multi-Site Dashboard**

This is explicitly mentioned in Sprint-3 and is critical for Contracts Managers to have visibility across all sites.

**Why CM-01 First:**
1. Explicitly mentioned in Sprint-3
2. Foundation for other CM features
3. High visibility feature
4. Enables exception alerts (CM-03) to be displayed

**What to Build:**
1. Dashboard aggregation API
2. Widget components (headcount, progress, incidents, spend)
3. Multi-site layout
4. Real-time data fetching
5. Contracts Manager layout (if not exists)

---

## 📝 Notes

- HR-03 (Leave Balance Mgmt) is mostly complete - it auto-updates on approval
- All "Now" priority items should be completed before moving to "Future" items
- CM-01 and CM-03 are explicitly Sprint-3 priorities according to the document

