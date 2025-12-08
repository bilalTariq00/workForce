# Workforce Management System

A comprehensive workforce management platform for construction sites, built with Next.js and MongoDB.

## 📋 Overview

This system manages:
- **Labour/Tradesperson** activities (sign-in/out, leave requests, certifications)
- **Site Manager** operations (daily logs, attendance verification, material receipts)
- **Contracts Manager** oversight (multi-site dashboard, resource allocation, variations)
- **HR/Payroll** functions (onboarding, timesheets, payroll runs)
- **EHS** compliance (incident management, inspections, training)

## 🏗️ Architecture

- **Frontend:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Authentication:** NextAuth.js with RBAC
- **State Management:** Zustand + React Query
- **Validation:** Zod
- **Event System:** Redis Pub/Sub (or in-memory for Phase 1)

## 📚 Documentation

- **[Architecture Guide](./ARCHITECTURE_GUIDE.md)** - Detailed architecture and best practices
- **[Data Dictionary](./DATA_DICTIONARY.md)** - Complete database schema
- **[API Naming Conventions](./API_NAMING_CONVENTIONS.md)** - API standards and event bus
- **[Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)** - Sprint-by-sprint plan

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Redis (optional, for event bus)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd workforce

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations (if any)
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
workforce/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                  # Utilities and configurations
│   ├── db/              # MongoDB connection
│   ├── auth/            # NextAuth config
│   ├── api/             # API client
│   └── events/          # Event bus
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── schemas/             # Zod validation schemas
```

## 🎯 Phase 1 Use Cases (Priority: "Now")

### Labour/Tradesperson
- ✅ **LB-01:** Site Sign-In/Sign-Out (QR scan)
- ✅ **LB-03:** Leave/Absence Request
- ✅ **LB-06:** Certification Upload/Renewal

### Site Manager
- ✅ **SM-01:** Daily Site Log
- ✅ **SM-02:** Workforce Attendance Verification
- ✅ **SM-03:** Material Receipt & Docket Match
- ✅ **SM-06:** Variation/Change Order Initiation

### Contracts Manager
- ✅ **CM-01:** Multi-Site Dashboard
- ✅ **CM-02:** Resource Re-Allocation Request
- ✅ **CM-03:** Exception Alert Review
- ✅ **CM-04:** Variation/Change Order Approval

### HR Officer
- ✅ **HR-01:** Employee On-boarding
- ✅ **HR-02:** Profile Maintenance
- ✅ **HR-03:** Leave Balance Management
- ✅ **HR-04:** Timesheet Approval
- ✅ **HR-05:** Payroll Run & Export
- ✅ **HR-06:** Certification Tracking

### EHS Manager
- ✅ **EHS-01:** Incident Triage & Investigation
- ✅ **EHS-02:** Site Inspection & Checklist
- ✅ **EHS-03:** Training Register Oversight

## 🔐 Authentication & Roles

The system supports the following roles:
- `labour` - Site workers
- `site_manager` - Site managers
- `contracts_manager` - Contracts managers
- `hr_officer` - HR staff
- `ehs_officer` - EHS staff
- `admin` - System administrators

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## 📦 Deployment

### Vercel (Recommended for Frontend)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t workforce .
docker run -p 3000:3000 workforce
```

## 🔧 Environment Variables

See `.env.example` for required environment variables.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth secret key
- `REDIS_URL` - Redis connection (optional)
- `AWS_S3_BUCKET` - S3 bucket for file uploads (optional)

## 📝 API Documentation

API documentation is available at `/api/docs` (when implemented) or see [API Naming Conventions](./API_NAMING_CONVENTIONS.md).

Base URL: `http://localhost:3000/api/v1`

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues and questions, please open a GitHub issue or contact the development team.

---

**Status:** 🚧 In Development - Phase 1

# workForce












