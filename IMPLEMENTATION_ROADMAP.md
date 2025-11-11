# Implementation Roadmap - Workforce Management System

## Phase 1: Foundation (Sprint 1)

### Week 1: Project Setup

**Day 1-2: Initial Setup**
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up ESLint and Prettier
- [ ] Initialize Git repository
- [ ] Set up environment variables structure

**Day 3-4: Database & Authentication**
- [ ] Set up MongoDB connection (Mongoose)
- [ ] Create base models (Employee, Site, User)
- [ ] Configure NextAuth.js
- [ ] Implement RBAC middleware
- [ ] Create authentication pages (login, logout)

**Day 5: Core Infrastructure**
- [ ] Set up API route structure
- [ ] Create error handling utilities
- [ ] Set up event bus (Redis Pub/Sub or in-memory for Phase 1)
- [ ] Create validation schemas (Zod)
- [ ] Set up logging (Winston/Pino)

### Week 2: Employee Management (HR-01)

**Day 1-2: Employee CRUD**
- [ ] Create Employee model and schema
- [ ] Implement employee creation API
- [ ] Build employee list page
- [ ] Build employee detail page
- [ ] Build employee creation form

**Day 3-4: Profile Management (HR-02)**
- [ ] Implement employee update API
- [ ] Build profile edit form
- [ ] Add file upload for profile photos
- [ ] Implement soft delete functionality

**Day 5: Testing & Refinement**
- [ ] Write unit tests for employee APIs
- [ ] Test authentication flows
- [ ] Fix bugs and refine UI

### Week 3: Site Sign-In/Sign-Out (LB-01)

**Day 1-2: QR Code System**
- [ ] Install QR code generation library
- [ ] Create Site model with QR code field
- [ ] Implement QR code generation API
- [ ] Build QR code display page for sites

**Day 3-4: Attendance System**
- [ ] Create Attendance model
- [ ] Implement sign-in API endpoint
- [ ] Implement sign-out API endpoint
- [ ] Build mobile-friendly sign-in page
- [ ] Add QR code scanner component (camera API)

**Day 5: Integration & Events**
- [ ] Emit attendance events
- [ ] Create event handlers for dashboard updates
- [ ] Test end-to-end flow
- [ ] Add validation (certification checks)

---

## Phase 2: Site Management (Sprint 2)

### Week 4: Daily Site Log (SM-01)

**Day 1-2: Daily Log Model & API**
- [ ] Create DailyLog model
- [ ] Implement CRUD APIs
- [ ] Add validation for one log per site per day

**Day 3-4: Daily Log Form**
- [ ] Build daily log form component
- [ ] Add weather input
- [ ] Add headcount input
- [ ] Add delivery tracking section
- [ ] Add photo upload for dockets

**Day 5: Lock & Send Functionality**
- [ ] Implement lock API
- [ ] Add send to CM functionality
- [ ] Create event for locked logs
- [ ] Test workflow

### Week 5: Attendance Verification (SM-02)

**Day 1-2: Headcount Comparison**
- [ ] Create API to compare planned vs actual
- [ ] Build comparison dashboard
- [ ] Add flagging for missing workers

**Day 3-4: Material Receipt (SM-03)**
- [ ] Extend daily log with material receipts
- [ ] Add docket photo upload
- [ ] Create PO matching logic (basic)
- [ ] Build material receipt form

**Day 5: Integration Testing**
- [ ] Test complete daily log workflow
- [ ] Test attendance verification
- [ ] Fix issues

---

## Phase 3: HR & Payroll (Sprint 3)

### Week 6: Leave Management (LB-03, HR-03)

**Day 1-2: Leave Request Model**
- [ ] Create LeaveRequest model
- [ ] Implement leave request creation API
- [ ] Add validation (no overlaps, future dates)

**Day 3-4: Approval Workflow**
- [ ] Build leave request form
- [ ] Create approval API endpoints
- [ ] Build approval UI for supervisors
- [ ] Implement leave balance auto-update

**Day 5: Notifications & Testing**
- [ ] Add email notifications (optional)
- [ ] Test complete leave workflow
- [ ] Fix bugs

### Week 7: Timesheet & Payroll (HR-04, HR-05)

**Day 1-2: Timesheet Generation**
- [ ] Create Timesheet model
- [ ] Implement auto-generation from attendance
- [ ] Build timesheet list page
- [ ] Add manual adjustment capability

**Day 3-4: Timesheet Approval**
- [ ] Implement approval API
- [ ] Build approval UI
- [ ] Add lock functionality
- [ ] Test workflow

**Day 5: Payroll Run**
- [ ] Create PayrollRun model
- [ ] Implement payroll calculation
- [ ] Build payroll run UI
- [ ] Create Sage export format (CSV/JSON)
- [ ] Test export functionality

---

## Phase 4: Dashboard & Alerts (Sprint 4)

### Week 8: Multi-Site Dashboard (CM-01)

**Day 1-2: Dashboard Data Aggregation**
- [ ] Create dashboard API endpoints
- [ ] Aggregate headcount data
- [ ] Calculate progress percentages
- [ ] Aggregate incident counts

**Day 3-4: Dashboard UI**
- [ ] Build dashboard layout
- [ ] Create widget components
- [ ] Add real-time updates (via events)
- [ ] Add filtering by site

**Day 5: Performance Optimization**
- [ ] Add caching for dashboard data
- [ ] Optimize queries
- [ ] Test with large datasets

### Week 9: Exception Alerts (CM-03)

**Day 1-2: Alert Engine**
- [ ] Create Alert model
- [ ] Implement alert rules
- [ ] Create alert generation logic

**Day 3-4: Alert UI**
- [ ] Build alert dashboard
- [ ] Add alert filtering
- [ ] Add alert actions
- [ ] Add alert notifications

**Day 5: Resource Re-Allocation (CM-02)**
- [ ] Build resource re-allocation form
- [ ] Implement re-allocation API
- [ ] Add notifications to Site Managers
- [ ] Test workflow

---

## Phase 5: EHS Module (Sprint 5)

### Week 10: Incident Management (EHS-01)

**Day 1-2: Incident Model & API**
- [ ] Create Incident model
- [ ] Implement incident creation API
- [ ] Add photo upload capability

**Day 3-4: Incident Workflow**
- [ ] Build incident report form
- [ ] Create triage UI
- [ ] Implement assignment logic
- [ ] Add investigation notes

**Day 5: Site Inspection (EHS-02)**
- [ ] Create Inspection model
- [ ] Build inspection checklist
- [ ] Implement inspection API
- [ ] Test workflow

---

## Technical Milestones

### Infrastructure
- [x] Project structure defined
- [ ] CI/CD pipeline set up
- [ ] Staging environment configured
- [ ] Production environment configured
- [ ] Monitoring and logging set up

### Security
- [ ] Authentication implemented
- [ ] Authorization (RBAC) implemented
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] Security audit completed

### Performance
- [ ] Database indexes created
- [ ] Caching strategy implemented
- [ ] API response times optimized
- [ ] Frontend bundle optimized

### Testing
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E tests for critical flows
- [ ] Load testing completed

---

## Dependencies to Install

### Frontend
```bash
npm install next@latest react@latest react-dom@latest
npm install typescript @types/react @types/node
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-* # UI components
npm install zod react-hook-form @hookform/resolvers
npm install @tanstack/react-query zustand
npm install next-auth
npm install date-fns
npm install qrcode @types/qrcode
npm install react-qr-reader # For QR scanning
```

### Backend
```bash
npm install mongoose
npm install bcryptjs jsonwebtoken
npm install redis ioredis # For event bus
npm install multer # For file uploads
npm install winston # For logging
npm install node-cron # For scheduled tasks
npm install bullmq # For job queues
```

### Development
```bash
npm install -D eslint @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier
npm install -D @testing-library/react jest
npm install -D @playwright/test # E2E testing
```

---

## Environment Variables

Create `.env.local`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/workforce
# or
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/workforce

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Redis (for event bus)
REDIS_URL=redis://localhost:6379

# File Storage (S3 or Cloudinary)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=workforce-uploads
# or
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password

# Sage Integration (if applicable)
SAGE_API_KEY=your-sage-key
SAGE_API_URL=https://api.sage.com
```

---

## Key Decisions Made

1. **Start with Modular Monolith** - Easier to develop, can split later
2. **Next.js App Router** - Modern React patterns, server components
3. **MongoDB** - Flexible schema, good for rapid development
4. **Event-Driven Architecture** - Even in monolith, prepare for microservices
5. **PWA First** - Mobile app can be React Native later if needed
6. **TypeScript** - Type safety from day one
7. **Zod for Validation** - Type-safe schemas, works with TypeScript

---

## Risk Mitigation

### Technical Risks
- **Database Performance:** Use proper indexing, consider read replicas
- **File Storage Costs:** Implement cleanup policies, compress images
- **Mobile QR Scanning:** Test on various devices, have fallback (manual entry)

### Business Risks
- **Scope Creep:** Stick to Phase 1 priorities, document future features
- **Integration Issues:** Start with mock Sage export, real integration later
- **User Adoption:** Focus on UX, provide training materials

---

## Success Metrics

- **Sprint 1:** Authentication working, employees can be created
- **Sprint 2:** Workers can sign in/out, site managers can create logs
- **Sprint 3:** Leave requests flow working, timesheets generated
- **Sprint 4:** Dashboard shows real data, alerts working
- **Phase 1 Complete:** All "Now" priority use cases functional

---

## Next Steps After Phase 1

1. **User Feedback:** Gather feedback from pilot users
2. **Performance Tuning:** Optimize based on real usage
3. **Mobile App:** Consider React Native if PWA insufficient
4. **Microservices:** Split if needed for scale
5. **Advanced Features:** AI PPE detection, advanced analytics

