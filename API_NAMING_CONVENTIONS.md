# API Naming Conventions & Event Bus Standards

## 1. RESTful API Endpoints

### 1.1 Base URL Structure

```
Production:  https://api.workforce.com/v1
Development: http://localhost:3000/api/v1
```

### 1.2 Resource Naming

**Rules:**
- Use **plural nouns** for collections
- Use **kebab-case** for multi-word resources
- Use **nested resources** for related entities
- Use **query parameters** for filtering, sorting, pagination

**Examples:**
```
✅ /api/v1/employees
✅ /api/v1/leave-requests
✅ /api/v1/daily-logs
✅ /api/v1/sites/:id/attendance
✅ /api/v1/employees/:id/certifications

❌ /api/v1/employee
❌ /api/v1/leaveRequests
❌ /api/v1/daily_logs
```

### 1.3 HTTP Methods

| Method | Usage | Example |
|--------|-------|---------|
| `GET` | Retrieve resource(s) | `GET /api/v1/employees` |
| `POST` | Create new resource | `POST /api/v1/employees` |
| `PUT` | Full update (replace) | `PUT /api/v1/employees/:id` |
| `PATCH` | Partial update | `PATCH /api/v1/employees/:id` |
| `DELETE` | Delete resource | `DELETE /api/v1/employees/:id` |

### 1.4 Action Endpoints

For non-CRUD operations, use **verb-based endpoints**:

```
POST   /api/v1/attendance/sign-in
POST   /api/v1/attendance/sign-out
POST   /api/v1/leave-requests/:id/approve
POST   /api/v1/leave-requests/:id/reject
POST   /api/v1/certifications/:id/validate
POST   /api/v1/certifications/:id/reject
POST   /api/v1/daily-logs/:id/lock
POST   /api/v1/timesheets/:id/approve
POST   /api/v1/timesheets/:id/lock
POST   /api/v1/payroll/runs
POST   /api/v1/payroll/runs/:id/export
POST   /api/v1/variations/:id/approve
POST   /api/v1/variations/:id/reject
```

### 1.5 Query Parameters

**Filtering:**
```
GET /api/v1/employees?role=labour&status=active
GET /api/v1/attendance?siteId=123&startDate=2024-01-01&endDate=2024-01-31
GET /api/v1/incidents?severity=high&status=reported
```

**Sorting:**
```
GET /api/v1/employees?sort=lastName&order=asc
GET /api/v1/attendance?sort=signInTime&order=desc
```

**Pagination:**
```
GET /api/v1/employees?page=1&limit=20
GET /api/v1/attendance?offset=0&limit=50
```

**Combined:**
```
GET /api/v1/employees?role=labour&status=active&sort=lastName&order=asc&page=1&limit=20
```

### 1.6 Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

**List Response:**
```json
{
  "success": true,
  "data": [
    { ... },
    { ... }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasMore": true
  }
}
```

### 1.7 Status Codes

| Code | Usage |
|------|-------|
| `200` | Success (GET, PUT, PATCH) |
| `201` | Created (POST) |
| `204` | No Content (DELETE) |
| `400` | Bad Request (validation errors) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (duplicate resource) |
| `422` | Unprocessable Entity (business rule violation) |
| `500` | Internal Server Error |

---

## 2. Event Bus Naming Convention

### 2.1 Event Name Format

```
{domain}.{entity}.{action}
```

**Examples:**
```
attendance.signed_in
attendance.signed_out
leave.request_created
leave.request_approved
leave.request_rejected
certification.uploaded
certification.validated
certification.expired
daily_log.locked
daily_log.sent
incident.reported
incident.assigned
variation.created
variation.approved
timesheet.approved
timesheet.locked
payroll.run_completed
payroll.exported
```

### 2.2 Event Payload Structure

```typescript
interface EventPayload {
  eventId: string;           // Unique event ID (UUID)
  eventType: string;         // Event name (e.g., "attendance.signed_in")
  timestamp: Date;           // Event timestamp
  source: string;            // Service/component that emitted
  userId?: string;           // User who triggered (if applicable)
  data: {                    // Event-specific data
    [key: string]: any;
  };
  metadata?: {               // Optional metadata
    correlationId?: string;
    causationId?: string;
    [key: string]: any;
  };
}
```

### 2.3 Event Examples

**Attendance Sign-In:**
```json
{
  "eventId": "evt_1234567890",
  "eventType": "attendance.signed_in",
  "timestamp": "2024-01-15T08:30:00Z",
  "source": "attendance-service",
  "userId": "emp_001",
  "data": {
    "employeeId": "emp_001",
    "siteId": "site_001",
    "signInTime": "2024-01-15T08:30:00Z",
    "signInMethod": "qr"
  },
  "metadata": {
    "correlationId": "req_abc123"
  }
}
```

**Leave Request Approved:**
```json
{
  "eventId": "evt_1234567891",
  "eventType": "leave.request_approved",
  "timestamp": "2024-01-15T10:00:00Z",
  "source": "hr-service",
  "userId": "hr_001",
  "data": {
    "leaveRequestId": "lr_001",
    "employeeId": "emp_001",
    "type": "annual",
    "startDate": "2024-02-01",
    "endDate": "2024-02-05",
    "days": 5,
    "approvedBy": "hr_001"
  }
}
```

**Certification Expired:**
```json
{
  "eventId": "evt_1234567892",
  "eventType": "certification.expired",
  "timestamp": "2024-01-15T00:00:00Z",
  "source": "certification-service",
  "data": {
    "certificationId": "cert_001",
    "employeeId": "emp_001",
    "type": "SafePass",
    "expiryDate": "2024-01-14"
  }
}
```

### 2.4 Event Subscriptions

**Service Event Handlers:**

```typescript
// HR Service
eventBus.subscribe('attendance.signed_in', async (event) => {
  // Update timesheet hours
});

eventBus.subscribe('leave.request_approved', async (event) => {
  // Update leave balance
});

// Site Management Service
eventBus.subscribe('attendance.signed_in', async (event) => {
  // Update daily log headcount
});

eventBus.subscribe('daily_log.locked', async (event) => {
  // Send to Contracts Manager
});

// Dashboard Service
eventBus.subscribe('attendance.signed_in', async (event) => {
  // Update dashboard cache
});

eventBus.subscribe('incident.reported', async (event) => {
  // Update alert count
});
```

---

## 3. API Route Structure (Next.js)

### 3.1 File Organization

```
app/api/v1/
├── auth/
│   ├── route.ts              # POST /api/v1/auth/login
│   └── me/
│       └── route.ts          # GET /api/v1/auth/me
├── employees/
│   ├── route.ts              # GET, POST /api/v1/employees
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE /api/v1/employees/:id
│       ├── attendance/
│       │   └── route.ts      # GET /api/v1/employees/:id/attendance
│       └── certifications/
│           └── route.ts      # GET /api/v1/employees/:id/certifications
├── attendance/
│   ├── route.ts              # GET /api/v1/attendance
│   ├── sign-in/
│   │   └── route.ts          # POST /api/v1/attendance/sign-in
│   └── sign-out/
│       └── route.ts          # POST /api/v1/attendance/sign-out
├── leave-requests/
│   ├── route.ts              # GET, POST /api/v1/leave-requests
│   └── [id]/
│       ├── route.ts          # GET, PUT /api/v1/leave-requests/:id
│       ├── approve/
│       │   └── route.ts      # POST /api/v1/leave-requests/:id/approve
│       └── reject/
│           └── route.ts      # POST /api/v1/leave-requests/:id/reject
└── ...
```

### 3.2 Route Handler Example

```typescript
// app/api/v1/attendance/sign-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requirePermission } from '@/lib/auth/middleware';
import { signInAttendance } from '@/lib/services/attendance';
import { emitEvent } from '@/lib/events';

const signInSchema = z.object({
  siteId: z.string(),
  qrCode: z.string(),
  signInMethod: z.enum(['qr', 'barcode', 'manual']).default('qr')
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    requirePermission(session.user.role, 'ATTENDANCE_SIGN_IN');

    const body = await req.json();
    const data = signInSchema.parse(body);

    const attendance = await signInAttendance({
      employeeId: session.user.employeeId,
      ...data
    });

    // Emit event
    await emitEvent('attendance.signed_in', {
      employeeId: attendance.employeeId,
      siteId: attendance.siteId,
      signInTime: attendance.signInTime,
      signInMethod: data.signInMethod
    });

    return NextResponse.json({
      success: true,
      data: attendance
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred'
      }
    }, { status: 500 });
  }
}
```

---

## 4. API Versioning

### 4.1 Version Strategy

- **URL-based versioning:** `/api/v1/`, `/api/v2/`
- **Major versions** for breaking changes
- **Minor changes** can be backward compatible

### 4.2 Deprecation Policy

1. Announce deprecation 3 months in advance
2. Keep deprecated endpoints for 6 months
3. Return `Deprecation` header: `Deprecation: true`
4. Include `Sunset` header: `Sunset: <date>`

---

## 5. Error Codes

### 5.1 Standard Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing credentials |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `BUSINESS_RULE_VIOLATION` | Violates business logic |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

### 5.2 Domain-Specific Error Codes

| Code | Description |
|------|-------------|
| `CERTIFICATION_EXPIRED` | Certification has expired |
| `LEAVE_OVERLAP` | Leave request overlaps with existing leave |
| `TIMESHEET_LOCKED` | Timesheet cannot be modified |
| `INVALID_QR_CODE` | QR code is invalid or expired |
| `SITE_ACCESS_DENIED` | Employee not authorized for site |

---

## 6. Rate Limiting

**Rules:**
- **Public endpoints:** 100 requests/hour
- **Authenticated endpoints:** 1000 requests/hour
- **File uploads:** 10 requests/hour
- **Payroll operations:** 5 requests/hour

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## 7. Webhooks (Future)

**Webhook URL Format:**
```
POST https://client-domain.com/webhooks/workforce/{eventType}
```

**Webhook Payload:**
```json
{
  "event": "attendance.signed_in",
  "timestamp": "2024-01-15T08:30:00Z",
  "data": { ... },
  "signature": "sha256=..."
}
```

---

## 8. API Documentation

**Tools:**
- **OpenAPI/Swagger** specification
- **Postman Collection** for testing
- **API Reference** in documentation site

**Example OpenAPI:**
```yaml
paths:
  /api/v1/attendance/sign-in:
    post:
      summary: Sign in to site
      tags:
        - Attendance
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SignInRequest'
      responses:
        '201':
          description: Successfully signed in
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Attendance'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
```

