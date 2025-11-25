# Workforce Management System - Architecture & Best Practices Guide

## Executive Summary

This document outlines the recommended architecture, patterns, and best practices for building the Workforce Management System using **Next.js (React)** frontend and **MongoDB** backend.

---

## 1. Architecture Overview

### 1.1 Recommended Architecture Pattern: **Microservices with Event-Driven Communication**

Given the complexity and distinct domains (HR, Site Management, EHS, Payroll), a **microservices architecture** is recommended:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Next.js  │  │ Mobile   │  │ Admin    │              │
│  │ Web App  │  │ App (RN) │  │ Portal   │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │   API Gateway / BFF       │
        │   (Next.js API Routes)    │
        └─────────────┬─────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
┌───▼────┐    ┌───────▼──────┐   ┌─────▼──────┐
│  HR    │    │ Site Mgmt    │   │   EHS      │
│Service │    │ Service      │   │  Service   │
└───┬────┘    └───────┬──────┘   └─────┬──────┘
    │                 │                 │
    └─────────────────┴─────────────────┘
                      │
            ┌─────────▼─────────┐
            │   Event Bus       │
            │  (Redis/RabbitMQ) │
            └─────────┬─────────┘
                      │
            ┌─────────▼─────────┐
            │   MongoDB         │
            │   (Per Service)   │
            └───────────────────┘
```

### 1.2 Alternative: **Modular Monolith** (Recommended for Phase 1)

For Phase 1, start with a **modular monolith** to reduce complexity:

- Single Next.js application with feature modules
- Single MongoDB database with logical collections
- Event-driven patterns within the monolith
- Easy migration to microservices later

**Benefits:**
- Faster development
- Easier debugging
- Single deployment
- Can split later when needed

---

## 2. Technology Stack Recommendations

### 2.1 Frontend (Next.js)

**Core:**
- **Next.js 14+** (App Router) - Server components, API routes
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** or **Radix UI** - Component library

**State Management:**
- **Zustand** or **Jotai** - Client state
- **React Query (TanStack Query)** - Server state, caching
- **Zod** - Schema validation

**Forms:**
- **React Hook Form** + **Zod** - Form validation

**Mobile:**
- **React Native** (separate app) OR
- **PWA** with mobile-optimized Next.js pages

### 2.2 Backend

**API Layer:**
- **Next.js API Routes** (for monolith) OR
- **Express.js/Fastify** (for microservices)

**Database:**
- **MongoDB** with **Mongoose** ODM
- **Redis** - Caching, session store, event bus

**Authentication:**
- **NextAuth.js** (Auth.js) - JWT + session management
- **Role-based access control (RBAC)**

**File Storage:**
- **AWS S3** / **Cloudinary** / **MongoDB GridFS** - For certifications, photos

**Background Jobs:**
- **BullMQ** (Redis-based) - Payroll runs, reminders
- **node-cron** - Scheduled tasks

**Event Bus (if microservices):**
- **Redis Pub/Sub** or **RabbitMQ**

### 2.3 DevOps & Infrastructure

- **Docker** - Containerization
- **MongoDB Atlas** - Managed database
- **Vercel** (frontend) / **Railway** / **AWS** (backend)
- **GitHub Actions** - CI/CD

---

## 3. Database Schema Design (MongoDB)

### 3.1 Core Collections

```javascript
// employees
{
  _id: ObjectId,
  employeeId: String, // Unique: "EMP001"
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  role: String, // "labour", "site_manager", "contracts_manager", "hr_officer", "ehs_officer"
  siteId: ObjectId, // Current assigned site
  payRate: Number,
  bankDetails: {
    accountNumber: String,
    sortCode: String
  },
  status: String, // "active", "inactive", "terminated"
  createdAt: Date,
  updatedAt: Date
}

// attendance
{
  _id: ObjectId,
  employeeId: ObjectId,
  siteId: ObjectId,
  signInTime: Date,
  signOutTime: Date,
  signInMethod: String, // "qr", "barcode", "manual"
  signOutMethod: String,
  hoursWorked: Number, // Calculated
  status: String, // "present", "absent", "late"
  createdAt: Date
}

// leave_requests
{
  _id: ObjectId,
  employeeId: ObjectId,
  type: String, // "annual", "sick", "unpaid"
  startDate: Date,
  endDate: Date,
  days: Number,
  reason: String,
  status: String, // "pending", "approved", "rejected"
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date
}

// certifications
{
  _id: ObjectId,
  employeeId: ObjectId,
  type: String, // "SafePass", "CSCS", "FirstAid"
  documentUrl: String, // S3/Cloudinary URL
  issueDate: Date,
  expiryDate: Date,
  status: String, // "valid", "expired", "pending_validation"
  validatedBy: ObjectId, // HR/EHS officer
  validatedAt: Date,
  createdAt: Date
}

// sites
{
  _id: ObjectId,
  siteCode: String, // "SITE001"
  name: String,
  address: String,
  qrCode: String, // Unique QR code for sign-in
  contractsManagerId: ObjectId,
  status: String, // "active", "completed"
  createdAt: Date
}

// daily_logs
{
  _id: ObjectId,
  siteId: ObjectId,
  siteManagerId: ObjectId,
  date: Date,
  weather: String,
  headcount: Number,
  deliveries: [{
    material: String,
    docketNumber: String,
    docketPhoto: String,
    poMatchStatus: String // "matched", "pending", "unmatched"
  }],
  issues: String,
  status: String, // "draft", "locked", "sent"
  lockedAt: Date,
  createdAt: Date
}

// variations
{
  _id: ObjectId,
  siteId: ObjectId,
  siteManagerId: ObjectId,
  title: String,
  description: String,
  cost: Number,
  delayDays: Number,
  status: String, // "draft", "pending", "approved", "rejected"
  approvedBy: ObjectId,
  approvedAt: Date,
  commercialNotes: String,
  createdAt: Date
}

// incidents
{
  _id: ObjectId,
  siteId: ObjectId,
  reportedBy: ObjectId,
  type: String, // "incident", "near_miss"
  severity: String, // "low", "medium", "high", "critical"
  description: String,
  photos: [String],
  status: String, // "reported", "under_investigation", "resolved"
  assignedTo: ObjectId, // EHS officer
  actions: [{
    description: String,
    assignedTo: ObjectId,
    dueDate: Date,
    status: String
  }],
  createdAt: Date
}

// timesheets
{
  _id: ObjectId,
  employeeId: ObjectId,
  weekStartDate: Date,
  weekEndDate: Date,
  hours: [{
    date: Date,
    hours: Number,
    attendanceId: ObjectId
  }],
  totalHours: Number,
  status: String, // "draft", "submitted", "approved", "locked"
  approvedBy: ObjectId,
  approvedAt: Date,
  createdAt: Date
}

// payroll_runs
{
  _id: ObjectId,
  periodStart: Date,
  periodEnd: Date,
  timesheets: [ObjectId],
  totalGross: Number,
  totalNet: Number,
  status: String, // "draft", "calculated", "exported", "paid"
  exportedToSage: Boolean,
  exportedAt: Date,
  createdAt: Date
}
```

### 3.2 Indexing Strategy

```javascript
// Critical indexes
db.attendance.createIndex({ employeeId: 1, createdAt: -1 });
db.attendance.createIndex({ siteId: 1, signInTime: -1 });
db.leave_requests.createIndex({ employeeId: 1, status: 1 });
db.certifications.createIndex({ employeeId: 1, expiryDate: 1 });
db.certifications.createIndex({ expiryDate: 1 }); // For expiry reminders
db.daily_logs.createIndex({ siteId: 1, date: -1 });
db.incidents.createIndex({ siteId: 1, severity: 1, createdAt: -1 });
```

---

## 4. API Design Patterns

### 4.1 RESTful API Structure

```
/api/v1/
  /auth
    POST   /login
    POST   /logout
    GET    /me
  /employees
    GET    /                    # List (with filters)
    POST   /                    # Create
    GET    /:id                 # Get one
    PUT    /:id                 # Update
    DELETE /:id                 # Delete
    GET    /:id/attendance      # Get attendance history
    GET    /:id/certifications  # Get certifications
  /attendance
    POST   /sign-in             # QR scan sign-in
    POST   /sign-out            # QR scan sign-out
    GET    /                    # List (with filters)
  /leave-requests
    GET    /
    POST   /
    PUT    /:id/approve
    PUT    /:id/reject
  /certifications
    POST   /upload
    GET    /
    PUT    /:id/validate
  /sites
    GET    /
    GET    /:id/dashboard       # Site-specific dashboard
  /daily-logs
    GET    /
    POST   /
    PUT    /:id
    POST   /:id/lock
  /variations
    GET    /
    POST   /
    PUT    /:id/approve
  /timesheets
    GET    /
    POST   /
    PUT    /:id/approve
  /payroll
    POST   /run
    GET    /runs
    POST   /runs/:id/export
  /incidents
    GET    /
    POST   /
    PUT    /:id
  /dashboard
    GET    /multi-site          # Contracts Manager dashboard
```

### 4.2 Event-Driven Patterns

```javascript
// Event types
const EVENTS = {
  ATTENDANCE_SIGNED_IN: 'attendance.signed_in',
  ATTENDANCE_SIGNED_OUT: 'attendance.signed_out',
  LEAVE_REQUEST_CREATED: 'leave.request_created',
  LEAVE_REQUEST_APPROVED: 'leave.request_approved',
  CERTIFICATION_EXPIRED: 'certification.expired',
  DAILY_LOG_LOCKED: 'daily_log.locked',
  INCIDENT_REPORTED: 'incident.reported',
  VARIATION_CREATED: 'variation.created',
  VARIATION_APPROVED: 'variation.approved',
  TIMESHEET_APPROVED: 'timesheet.approved',
  PAYROLL_RUN_COMPLETED: 'payroll.run_completed'
};

// Event handlers
eventBus.on(EVENTS.ATTENDANCE_SIGNED_IN, async (data) => {
  // Update daily log headcount
  // Send notification to Site Manager
  // Update dashboard cache
});
```

---

## 5. Frontend Architecture (Next.js)

### 5.1 Project Structure

```
workforce/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── sites/
│   │   └── layout.tsx
│   ├── api/                      # API Routes
│   │   ├── v1/
│   │   │   ├── auth/
│   │   │   ├── employees/
│   │   │   ├── attendance/
│   │   │   └── ...
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # shadcn components
│   ├── forms/
│   ├── charts/
│   └── features/
│       ├── attendance/
│       ├── employees/
│       └── ...
├── lib/
│   ├── db/                       # MongoDB connection
│   ├── auth/                     # NextAuth config
│   ├── api/                      # API client
│   ├── events/                   # Event bus
│   └── utils/
├── hooks/                        # Custom React hooks
├── stores/                       # Zustand stores
├── types/                        # TypeScript types
├── schemas/                      # Zod schemas
└── public/
    └── qr-codes/                 # Generated QR codes
```

### 5.2 Feature-Based Organization

Each feature module should be self-contained:

```
features/attendance/
├── components/
│   ├── SignInForm.tsx
│   ├── AttendanceList.tsx
│   └── QRScanner.tsx
├── hooks/
│   ├── useSignIn.ts
│   └── useAttendance.ts
├── api/
│   └── attendance.ts
└── types.ts
```

---

## 6. Authentication & Authorization

### 6.1 RBAC Implementation

```typescript
// lib/auth/roles.ts
export const ROLES = {
  LABOUR: 'labour',
  SITE_MANAGER: 'site_manager',
  CONTRACTS_MANAGER: 'contracts_manager',
  HR_OFFICER: 'hr_officer',
  EHS_OFFICER: 'ehs_officer',
  ADMIN: 'admin'
} as const;

export const PERMISSIONS = {
  ATTENDANCE_SIGN_IN: [ROLES.LABOUR],
  ATTENDANCE_VIEW_ALL: [ROLES.SITE_MANAGER, ROLES.CONTRACTS_MANAGER, ROLES.HR_OFFICER],
  LEAVE_APPROVE: [ROLES.SITE_MANAGER, ROLES.HR_OFFICER],
  PAYROLL_RUN: [ROLES.HR_OFFICER],
  VARIATION_APPROVE: [ROLES.CONTRACTS_MANAGER],
  // ... more permissions
};

// Middleware
export function requirePermission(permission: string) {
  return (req: NextRequest) => {
    const user = getSession(req);
    if (!hasPermission(user.role, permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  };
}
```

### 6.2 NextAuth Configuration

```typescript
// lib/auth/config.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Custom login logic
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.employeeId = user.employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      return session;
    }
  }
};
```

---

## 7. Mobile Considerations

### 7.1 Option 1: React Native App (Recommended)

- Separate codebase for mobile
- Native QR/barcode scanning
- Offline support
- Push notifications

### 7.2 Option 2: PWA with Next.js

- Single codebase
- Service workers for offline
- Camera API for QR scanning
- Installable on mobile

**Recommendation:** Start with PWA for Phase 1, migrate to React Native if needed.

---

## 8. Integration Patterns

### 8.1 Sage Payroll Export

```typescript
// lib/integrations/sage.ts
export async function exportToSage(payrollRun: PayrollRun) {
  // Transform MongoDB data to Sage format
  const sageData = transformPayrollData(payrollRun);
  
  // Export via API or CSV file
  await sageAPI.uploadPayroll(sageData);
  
  // Update payroll run status
  await updatePayrollRunStatus(payrollRun._id, 'exported');
}
```

### 8.2 QR Code Generation

```typescript
// lib/qr/generator.ts
import QRCode from 'qrcode';

export async function generateSiteQRCode(siteId: string) {
  const qrData = {
    type: 'site_signin',
    siteId,
    timestamp: Date.now()
  };
  
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
  // Store in MongoDB or S3
  return qrCode;
}
```

---

## 9. Development Workflow

### 9.1 Sprint Breakdown

**Sprint 1: Foundation**
- Core Platform (auth, RBAC)
- Employee model & basic CRUD
- QR code generation
- Basic sign-in/sign-out (LB-01)

**Sprint 2: Site Management**
- Daily Site Log (SM-01)
- Attendance verification (SM-02)
- Material receipt (SM-03)

**Sprint 3: HR & Payroll**
- Leave requests (LB-03, HR-03)
- Timesheet approval (HR-04)
- Payroll run & export (HR-05)

**Sprint 4: Dashboard & Alerts**
- Multi-site dashboard (CM-01)
- Exception alerts (CM-03)
- Resource re-allocation (CM-02)

### 9.2 Testing Strategy

- **Unit Tests:** Jest + React Testing Library
- **Integration Tests:** API route testing
- **E2E Tests:** Playwright or Cypress
- **Database Tests:** MongoDB in-memory or test database

---

## 10. Security Best Practices

1. **Input Validation:** Zod schemas on all inputs
2. **SQL Injection:** Use Mongoose (parameterized queries)
3. **XSS:** Sanitize user inputs, use React's built-in escaping
4. **File Uploads:** Validate file types, scan for malware
5. **Rate Limiting:** Implement on API routes
6. **HTTPS:** Enforce in production
7. **Environment Variables:** Never commit secrets

---

## 11. Performance Optimization

1. **Database:**
   - Proper indexing
   - Aggregation pipelines for complex queries
   - Connection pooling

2. **Frontend:**
   - Server components where possible
   - React Query caching
   - Image optimization (Next.js Image)

3. **Caching:**
   - Redis for frequently accessed data
   - CDN for static assets

---

## 12. Monitoring & Logging

- **Error Tracking:** Sentry
- **Analytics:** PostHog or Mixpanel
- **Logging:** Winston or Pino
- **Uptime:** UptimeRobot or Pingdom

---

## 13. Migration Path to Microservices

When ready to split:

1. Extract API routes to separate Express services
2. Use API Gateway pattern
3. Implement service-to-service communication
4. Database per service (or shared database with service ownership)

---

## Next Steps

1. Set up Next.js project with TypeScript
2. Configure MongoDB connection
3. Set up authentication (NextAuth)
4. Create base models and schemas
5. Implement first use case (LB-01: Site Sign-In)

Would you like me to generate the initial project structure and boilerplate code?









