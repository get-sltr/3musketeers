# SLTR Project Execution Plan

**Document Version:** 1.0
**Created:** December 3, 2025
**Prepared By:** Project Manager
**Status:** URGENT - Production Live Since Nov 11, 2025
**Reference:** BA_COMPREHENSIVE_ASSESSMENT.md

---

## Executive Summary

**CRITICAL CONTEXT: SLTR IS LIVE IN PRODUCTION** (launched November 11, 2025)

This is NOT a pre-launch plan. Users are actively on the platform. The 6 XSS vulnerabilities identified by the BA represent **active security risks to real users RIGHT NOW**.

This Project Execution Plan prioritizes **immediate security remediation** followed by rapid stabilization. All timelines are in **HOURS and DAYS**, not weeks.

### Key Decisions Required from Stakeholders

| # | Decision | Options | PM Recommendation | Deadline |
|---|----------|---------|-------------------|----------|
| D1 | Authoritative Backend | backend/ vs sltr-backend/ vs beckend/ | `backend/` (archive others) | **TODAY** |
| D2 | XSS Hotfix Deployment | Immediate vs Scheduled | **Deploy within 24 hours** | **TODAY** |
| D3 | AI Provider Communication | Groq (docs) vs Anthropic (code) | Update docs to reflect Anthropic | 48 hours |
| D4 | Groups Feature | Enable vs Keep Disabled | Keep disabled until stable | 48 hours |
| D5 | Test Coverage Target | Minimal vs Comprehensive | Critical paths only (auth, payments) | 72 hours |

### Project Success Criteria (Production Stabilization)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Security Vulnerabilities | 0 critical/high within 24h | Security scan results |
| Production Incidents | 0 security breaches | Sentry + logs |
| Core Feature Stability | 99.5% uptime maintained | Sentry monitoring |
| User Complaints | <5 critical issues/day | Support channels |
| Hotfix Deployment | All XSS fixed in 24h | Vercel deployment |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Stakeholder & Team Structure](#2-stakeholder--team-structure)
3. [Work Breakdown Structure](#3-work-breakdown-structure)
4. [Phase Definitions & Milestones](#4-phase-definitions--milestones)
5. [Resource Allocation](#5-resource-allocation)
6. [Risk Management Framework](#6-risk-management-framework)
7. [Quality Gates](#7-quality-gates)
8. [Communication Plan](#8-communication-plan)
9. [Specialist Handoff Briefs](#9-specialist-handoff-briefs)
10. [Appendices](#10-appendices)

---

## 1. Project Overview

### 1.1 Project Scope

**In Scope (v1 Launch):**
- Security vulnerability remediation (6 XSS fixes)
- Backend architecture consolidation
- Test coverage establishment for critical paths
- Core feature stabilization (Auth, Messaging, Grid/Map, Video, EROS)
- Push notification completion
- Admin moderation capabilities (minimal viable)
- Documentation alignment
- Phased launch execution

**Out of Scope (Deferred to v2):**
- Groups & Channels feature (60% complete - too risky)
- Black Card full verification flow (partial admin workflow acceptable)
- Framework upgrades (React 19, Next.js 16, Tailwind v4)
- Microservices architecture (beckend/)
- Photo verification feature
- Travel mode

### 1.2 Project Constraints

| Constraint Type | Details |
|----------------|---------|
| **Scope** | Must fix security issues before any public exposure |
| **Quality** | Minimum 60% test coverage on critical paths |
| **Risk** | No changes to locked files without explicit approval |
| **Dependency** | Backend decision blocks all feature work |
| **Technical** | Node.js 22.x, Next.js 14.x (no upgrades) |

### 1.3 Assumptions

1. Stakeholders will make required decisions within specified deadlines
2. `backend/` directory is the production target (pending confirmation)
3. Team has capacity for full-time engagement during critical phases
4. Supabase infrastructure is stable and adequate for launch scale
5. Vercel and Railway deployments are configured correctly

### 1.4 Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY CHAIN                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [D1: Backend Decision]                                         │
│         │                                                       │
│         ├──► [Security Sprint] ──► [Test Baseline]             │
│         │           │                    │                      │
│         │           ▼                    ▼                      │
│         └──► [Documentation] ──► [Phase 1 Launch]              │
│                     │                    │                      │
│                     ▼                    ▼                      │
│              [UX Improvements] ──► [Phase 2 Beta]              │
│                                          │                      │
│                                          ▼                      │
│                                   [Phase 3 Public]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Stakeholder & Team Structure

### 2.1 RACI Matrix

| Activity | PM | Tech Lead | UX Engineer | Backend Dev | Frontend Dev | QA |
|----------|:--:|:---------:|:-----------:|:-----------:|:------------:|:--:|
| Backend Decision | C | A | I | R | I | I |
| Security Sprint | A | R | I | R | R | C |
| Test Baseline | A | C | I | R | R | R |
| UX Improvements | C | I | R | I | A | C |
| Admin Dashboard | A | C | I | R | R | C |
| Push Notifications | A | C | I | R | C | C |
| Documentation | A | R | C | C | C | I |
| Launch Execution | R | C | C | C | C | A |

**Legend:** R=Responsible, A=Accountable, C=Consulted, I=Informed

### 2.2 Specialist Role Assignments

| Role | Primary Focus | Secondary Focus |
|------|--------------|-----------------|
| **Project Manager** | Orchestration, stakeholder communication | Risk management |
| **Tech Lead** | Architecture decisions, code review | Security remediation |
| **UX Engineer** | Admin dashboard, notification UX | Mobile optimization |
| **Backend Developer** | API stability, push notifications | EROS improvements |
| **Frontend Developer** | XSS fixes, component stability | Test coverage |
| **QA Lead** | Test baseline, launch validation | Regression testing |

### 2.3 Decision Authority

| Decision Type | Authority | Escalation Path |
|--------------|-----------|-----------------|
| Architecture changes | Tech Lead | PM → Stakeholders |
| UX/UI changes | UX Engineer | PM → Stakeholders |
| Scope changes | PM | Stakeholders |
| Security exceptions | Tech Lead + PM | Stakeholders |
| Launch go/no-go | PM + QA Lead | Stakeholders |

---

## 3. Work Breakdown Structure

### 3.1 WBS Overview

```
SLTR v1 Launch
├── 1.0 Pre-Launch Foundation
│   ├── 1.1 Architecture Decision
│   │   ├── 1.1.1 Evaluate backend options
│   │   ├── 1.1.2 Document decision rationale
│   │   └── 1.1.3 Archive deprecated backends
│   ├── 1.2 Security Sprint
│   │   ├── 1.2.1 Fix MapViewSimple.tsx XSS (3 instances)
│   │   ├── 1.2.2 Fix coming-soon XSS
│   │   ├── 1.2.3 Fix AlbumsManager.tsx XSS
│   │   ├── 1.2.4 Security review pass
│   │   └── 1.2.5 Deploy security patches
│   └── 1.3 Test Baseline
│       ├── 1.3.1 Auth flow tests
│       ├── 1.3.2 Payment flow tests
│       ├── 1.3.3 Safety feature tests
│       ├── 1.3.4 Core API tests
│       └── 1.3.5 Component snapshot tests
│
├── 2.0 Feature Completion
│   ├── 2.1 Push Notifications
│   │   ├── 2.1.1 Implement service worker
│   │   ├── 2.1.2 Backend push sending
│   │   ├── 2.1.3 Notification triggers
│   │   └── 2.1.4 Mobile PWA testing
│   ├── 2.2 Admin Dashboard (MVP)
│   │   ├── 2.2.1 Report review interface
│   │   ├── 2.2.2 User moderation actions
│   │   ├── 2.2.3 Moderation logging
│   │   └── 2.2.4 Basic analytics
│   └── 2.3 Documentation Alignment
│       ├── 2.3.1 Update AI provider docs
│       ├── 2.3.2 Consolidate EROS docs
│       ├── 2.3.3 Update CURRENT_WORKING_STATE
│       └── 2.3.4 Create API reference
│
├── 3.0 Launch Phases
│   ├── 3.1 Phase 1: Friends & Family
│   │   ├── 3.1.1 Invite system setup
│   │   ├── 3.1.2 Feature flags configuration
│   │   ├── 3.1.3 Monitoring setup
│   │   └── 3.1.4 Feedback collection
│   ├── 3.2 Phase 2: Beta
│   │   ├── 3.2.1 Expand user capacity
│   │   ├── 3.2.2 Enable payments
│   │   ├── 3.2.3 Performance tuning
│   │   └── 3.2.4 Bug fix sprint
│   └── 3.3 Phase 3: Public
│       ├── 3.3.1 Open registration
│       ├── 3.3.2 Marketing support
│       └── 3.3.3 Scale monitoring
│
└── 4.0 Post-Launch (v2 Planning)
    ├── 4.1 Groups & Channels
    ├── 4.2 Photo Verification
    └── 4.3 Framework Upgrades
```

### 3.2 Work Package Details

#### WP 1.2: Security Sprint

| Task ID | Task | Effort | Owner | Dependencies |
|---------|------|--------|-------|--------------|
| 1.2.1 | Fix MapViewSimple.tsx XSS | 4h | Frontend Dev | 1.1.3 |
| 1.2.2 | Fix coming-soon XSS | 2h | Frontend Dev | None |
| 1.2.3 | Fix AlbumsManager.tsx XSS | 2h | Frontend Dev | None |
| 1.2.4 | Security review pass | 4h | Tech Lead | 1.2.1-1.2.3 |
| 1.2.5 | Deploy security patches | 2h | Tech Lead | 1.2.4 |

**Total Effort:** 14 hours (~2 days)

#### WP 1.3: Test Baseline

| Task ID | Task | Effort | Owner | Dependencies |
|---------|------|--------|-------|--------------|
| 1.3.1 | Auth flow tests | 8h | QA Lead | 1.2.5 |
| 1.3.2 | Payment flow tests | 8h | QA Lead | 1.2.5 |
| 1.3.3 | Safety feature tests | 6h | QA Lead | 1.2.5 |
| 1.3.4 | Core API tests | 12h | Backend Dev | 1.2.5 |
| 1.3.5 | Component snapshot tests | 8h | Frontend Dev | 1.2.5 |

**Total Effort:** 42 hours (~1 week)

#### WP 2.1: Push Notifications

| Task ID | Task | Effort | Owner | Dependencies |
|---------|------|--------|-------|--------------|
| 2.1.1 | Implement service worker | 8h | Frontend Dev | 1.1.3 |
| 2.1.2 | Backend push sending | 8h | Backend Dev | 1.1.3 |
| 2.1.3 | Notification triggers | 6h | Backend Dev | 2.1.2 |
| 2.1.4 | Mobile PWA testing | 4h | QA Lead | 2.1.1-2.1.3 |

**Total Effort:** 26 hours (~3-4 days)

#### WP 2.2: Admin Dashboard (MVP)

| Task ID | Task | Effort | Owner | Dependencies |
|---------|------|--------|-------|--------------|
| 2.2.1 | Report review interface | 12h | UX + Frontend | 1.2.5 |
| 2.2.2 | User moderation actions | 8h | Backend Dev | 2.2.1 |
| 2.2.3 | Moderation logging | 4h | Backend Dev | 2.2.2 |
| 2.2.4 | Basic analytics | 8h | Full Stack | 2.2.3 |

**Total Effort:** 32 hours (~1 week)

---

## 4. Phase Definitions & Milestones

### 4.1 Phase Timeline (PRODUCTION STABILIZATION)

**SLTR IS LIVE - Launched November 11, 2025**

```
NOW             24 HOURS        48 HOURS        72 HOURS        1 WEEK
├───────────────┼───────────────┼───────────────┼───────────────┼─────────►
│ EMERGENCY     │ SECURITY      │ STABILITY     │ QUALITY       │ ENHANCE
│ HOTFIX        │ VERIFIED      │ CONFIRMED     │ BASELINE      │ FEATURES
├───────────────┼───────────────┼───────────────┼───────────────┼─────────►
│ ▲M1           │     ▲M2       │     ▲M3       │      ▲M4      │    ▲M5
│ ASAP          │    +24h       │    +48h       │     +72h      │   +7days
```

### 4.2 Milestone Definitions (URGENT)

| Milestone | Name | Exit Criteria | Deadline |
|-----------|------|---------------|----------|
| **M1** | Emergency Hotfix | All 6 XSS vulnerabilities patched & deployed | **24 HOURS** |
| **M2** | Security Verified | Security review confirms fixes, no new issues | **48 HOURS** |
| **M3** | Stability Confirmed | 24h with zero security incidents | **72 HOURS** |
| **M4** | Quality Baseline | Critical path tests for auth + payments | **1 WEEK** |
| **M5** | Feature Enhancement | Push notifications, Admin MVP | **2 WEEKS** |

### 4.3 Phase Details (PRODUCTION EMERGENCY)

#### Phase 1: EMERGENCY HOTFIX (0-24 Hours) 🚨

**Objective:** Eliminate active security vulnerabilities exposing live users

**Deliverables:**
- [ ] Fix MapViewSimple.tsx XSS (3 instances) - **4 hours**
- [ ] Fix coming-soon/page.tsx XSS - **1 hour**
- [ ] Fix AlbumsManager.tsx XSS - **1 hour**
- [ ] Deploy hotfix to Vercel - **1 hour**
- [ ] Verify fixes in production - **1 hour**

**Owner:** Frontend Dev + Tech Lead
**Exit Criteria:** All 6 XSS vectors eliminated, production verified

#### Phase 2: SECURITY VERIFICATION (24-48 Hours)

**Objective:** Confirm security posture is stable

**Deliverables:**
- [ ] Security review of all fixes
- [ ] Scan for additional vulnerabilities
- [ ] Monitor Sentry for exploitation attempts
- [ ] Backend decision documented

**Owner:** Tech Lead
**Exit Criteria:** No new security issues found, backend clarified

#### Phase 3: STABILITY CONFIRMATION (48-72 Hours)

**Objective:** Ensure platform is stable post-hotfix

**Deliverables:**
- [ ] 24 hours with zero security incidents
- [ ] Core features verified (auth, messaging, grid, map)
- [ ] Payment flows verified working
- [ ] Error rate within acceptable bounds

**Owner:** QA Lead + PM
**Exit Criteria:** Platform stable, no user-reported security issues

#### Phase 4: QUALITY BASELINE (72 Hours - 1 Week)

**Objective:** Establish minimum test coverage for critical paths

**Deliverables:**
- [ ] Auth flow tests (signup, login, logout)
- [ ] Payment flow tests (checkout, subscription)
- [ ] Safety feature tests (block, report)

**Owner:** QA Lead
**Exit Criteria:** Critical paths have automated tests

#### Phase 5: FEATURE ENHANCEMENT (Week 2+)

**Objective:** Complete missing production features

**Deliverables:**
- [ ] Push notifications functional
- [ ] Admin moderation MVP
- [ ] Documentation updates

**Owner:** Full team
**Exit Criteria:** Feature gaps addressed

---

## 5. Resource Allocation

### 5.1 Effort Distribution by Phase

| Phase | PM | Tech Lead | UX Engineer | Backend Dev | Frontend Dev | QA |
|-------|:--:|:---------:|:-----------:|:-----------:|:------------:|:--:|
| Foundation | 20% | 30% | 10% | 20% | 30% | 30% |
| Phase 1 | 30% | 20% | 30% | 30% | 20% | 40% |
| Phase 2 | 25% | 15% | 20% | 25% | 25% | 30% |
| Phase 3 | 30% | 10% | 15% | 20% | 15% | 20% |

### 5.2 Critical Path Resources

**Bottleneck Identification:**

1. **Tech Lead** - Security review is blocking
2. **QA Lead** - Test baseline creation is time-intensive
3. **Backend Dev** - Push notifications + Admin actions

**Mitigation:**
- Parallelize Frontend Dev security fixes while Tech Lead reviews
- QA starts with auth tests while security sprint completes
- Backend Dev focuses solely on push + admin (no new features)

### 5.3 Specialist Availability Assumptions

| Role | Availability | Notes |
|------|--------------|-------|
| PM | Full-time | Orchestration priority |
| Tech Lead | Full-time | May have competing priorities |
| UX Engineer | Part-time (50%) | Joining after M2 |
| Backend Dev | Full-time | Critical path resource |
| Frontend Dev | Full-time | Security sprint priority |
| QA Lead | Full-time | Testing intensive |

---

## 6. Risk Management Framework

### 6.1 Risk Register (PRODUCTION LIVE - URGENT)

| ID | Risk | Prob. | Impact | Score | Owner | Mitigation |
|----|------|-------|--------|-------|-------|------------|
| R1 | **XSS ACTIVELY EXPLOITABLE** | High | Critical | **🚨 CRITICAL** | Tech Lead | **FIX WITHIN 24 HOURS** |
| R2 | User data breach via XSS | Med | Critical | **🚨 CRITICAL** | Tech Lead | Hotfix + monitoring |
| R3 | Backend confusion causes outage | Med | High | **HIGH** | PM | Decide backend TODAY |
| R4 | Hotfix introduces regression | Med | High | **HIGH** | QA Lead | Test before deploy |
| R5 | Payment flow failures | Low | High | MED | Backend Dev | Monitor Stripe dashboard |
| R6 | Push notifications missing | High | Med | MED | Backend Dev | Deprioritize - email works |
| R7 | Admin can't moderate | High | Med | MED | PM | Manual moderation via Supabase |
| R8 | Test coverage insufficient | High | Med | MED | QA Lead | Focus on critical paths only |
| R9 | Team capacity issues | Med | Med | MED | PM | Focus only on security first |
| R10 | Supabase rate limits | Low | High | MED | Tech Lead | Monitor usage |

### 6.2 Risk Response Strategies

**R1: XSS ACTIVELY EXPLOITABLE (🚨 CRITICAL)**
```
STATUS: USERS ARE AT RISK RIGHT NOW
Response Plan:
1. IMMEDIATE: Begin hotfix development (Frontend Dev)
2. 4 HOURS: Complete MapViewSimple.tsx fixes
3. 6 HOURS: Complete all 6 XSS fixes
4. 8 HOURS: Deploy to Vercel production
5. 12 HOURS: Verify fixes in production
6. 24 HOURS: Security review complete
Owner: Tech Lead + Frontend Dev
ESCALATION: If not fixed in 24h, consider taking affected pages offline
```

**R2: User Data Breach (🚨 CRITICAL)**
```
Trigger: Any sign of XSS exploitation in logs/Sentry
Response Plan:
1. IMMEDIATE: Take affected component offline
2. 1 HOUR: Notify stakeholders
3. 4 HOURS: Deploy hotfix
4. 24 HOURS: User notification if breach confirmed
Owner: Tech Lead + PM
```

**R3: Backend Confusion (HIGH)**
```
Trigger: Any confusion about which backend to modify
Response Plan:
1. TODAY: PM declares backend/ as authoritative
2. 24 HOURS: Mark sltr-backend/ and beckend/ as deprecated
3. 48 HOURS: Update documentation
Owner: PM
```

### 6.3 Contingency Plans (PRODUCTION)

| Scenario | Trigger | Contingency |
|----------|---------|-------------|
| XSS fix takes >24h | Hotfix delayed | Take MapViewSimple offline temporarily |
| Hotfix causes regression | New bugs in prod | Immediate rollback, fix forward |
| Exploitation detected | Sentry alerts | Incident response, user notification |
| Payment failures spike | >2% failure rate | Contact Stripe, pause new signups |
| User complaints spike | >10 critical/day | All hands on deck, triage |

---

## 7. Quality Gates (PRODUCTION HOTFIX)

### 7.1 Gate Definitions

| Gate | Checkpoint | Required Artifacts | Approver | Deadline |
|------|------------|-------------------|----------|----------|
| G1 | Hotfix Ready | All 6 XSS fixes tested locally | Tech Lead | **12 HOURS** |
| G2 | Deploy Approved | Staging verification, no regressions | Tech Lead | **18 HOURS** |
| G3 | Production Verified | Fixes confirmed in production | QA Lead | **24 HOURS** |
| G4 | Security Signed Off | Security review complete | Tech Lead | **48 HOURS** |
| G5 | Stability Confirmed | 24h no incidents | PM | **72 HOURS** |

### 7.2 Quality Criteria

**Code Quality:**
- No critical/high security vulnerabilities
- All PRs reviewed by Tech Lead
- No TypeScript errors (`npx tsc --noEmit`)
- Build passes (`npm run build`)

**Test Quality:**
- 60%+ coverage on critical paths
- All critical tests passing
- No flaky tests in CI

**Feature Quality:**
- Acceptance criteria met per user story
- Mobile responsive verified
- Error boundaries in place

### 7.3 Production Stability Checklist

**24 HOUR CHECKPOINT (M1):**
- [ ] All 6 XSS vulnerabilities patched
- [ ] Hotfix deployed to Vercel production
- [ ] Fixes verified in production environment
- [ ] Sentry showing no new security errors
- [ ] Core features still working (auth, messaging, grid)

**48 HOUR CHECKPOINT (M2):**
- [ ] Security review complete
- [ ] No exploitation attempts detected
- [ ] Backend decision documented
- [ ] Payment flows verified working

**72 HOUR CHECKPOINT (M3):**
- [ ] 24 hours with zero security incidents
- [ ] User complaints at baseline level
- [ ] Error rate within acceptable bounds
- [ ] Team can shift focus to enhancements

**1 WEEK CHECKPOINT (M4):**
- [ ] Critical path tests written (auth, payments)
- [ ] Documentation updated (AI provider corrected)
- [ ] Push notifications plan in place
- [ ] Admin moderation plan in place

---

## 8. Communication Plan

### 8.1 Communication Matrix

| Audience | Frequency | Channel | Content | Owner |
|----------|-----------|---------|---------|-------|
| Stakeholders | Weekly | Email + Meeting | Progress report, decisions needed | PM |
| Dev Team | Daily | Standup (async or sync) | Blockers, progress, priorities | PM |
| QA | Daily | Slack/Direct | Test results, bug triage | QA Lead |
| UX Engineer | As needed | Brief handoff docs | Requirements, constraints | PM |
| All Hands | Milestone | Email | Launch status, celebration | PM |

### 8.2 Reporting Templates

**Daily Standup Format:**
```
Date: [Date]
Phase: [Current Phase]

YESTERDAY:
- [What was completed]

TODAY:
- [What's planned]

BLOCKERS:
- [Any blockers requiring escalation]

METRICS:
- Open bugs: [count by severity]
- Test coverage: [%]
- Days to next milestone: [N]
```

**Weekly Status Report:**
```
SLTR Weekly Status - Week [N]
================================

OVERALL STATUS: [Green/Yellow/Red]

MILESTONES:
- [Next milestone]: [Status] - [Days remaining]

KEY ACCOMPLISHMENTS:
1. [Achievement 1]
2. [Achievement 2]
3. [Achievement 3]

RISKS & ISSUES:
| Risk | Status | Mitigation |
|------|--------|------------|

DECISIONS NEEDED:
1. [Decision 1] - Deadline: [Date]

NEXT WEEK PRIORITIES:
1. [Priority 1]
2. [Priority 2]
```

### 8.3 Escalation Paths

```
Issue Type       Level 1          Level 2          Level 3
──────────────────────────────────────────────────────────
Technical        Tech Lead        PM               Stakeholders
Quality          QA Lead          PM               Tech Lead + PM
Schedule         PM               Stakeholders     -
Scope            PM               Stakeholders     -
Security         Tech Lead        PM + Stakeholders immediately
```

---

## 9. Specialist Handoff Briefs

### 9.1 UX Engineer Brief

**Handoff Date:** After M2 (Security Sprint Complete)

**Context:**
SLTR is a location-based social/dating app targeting the LGBTQ+ community. The platform is 75% feature complete with core functionality (Grid, Map, Messaging, Video, EROS AI) production-ready. You're being brought in to design the Admin Dashboard MVP and improve notification UX.

**Priority Assignments:**

1. **Admin Moderation Dashboard (HIGH)**
   - Design report review interface
   - User action workflow (warn, suspend, ban)
   - Moderation activity logging
   - Reference: See BA assessment Section 4.2 for requirements

2. **Push Notification UX (MEDIUM)**
   - Permission request flow optimization
   - Notification preference settings
   - In-app notification center design

3. **Mobile Optimization (LOW - if time permits)**
   - Review mobile grid/map views
   - Identify UX friction points

**Constraints:**
- Work within existing Tailwind CSS system
- Follow existing component patterns in `src/components/`
- Mobile-first responsive design required
- No framework upgrades allowed

**Key Files to Review:**
- `src/app/admin/black-cards/` - Existing admin pattern
- `src/components/ui/` - UI primitives
- `src/components/GridCard.tsx` - Component pattern example
- `docs/SAFETY_SYSTEM_GUIDE.md` - Safety feature context

**Deliverables:**
- Figma/design specs for Admin Dashboard MVP
- UX flow documentation
- Component specifications for Frontend Dev

**Timeline:** Design complete by Day 8, handoff to Frontend Dev by Day 9

---

### 9.2 Tech Lead Brief

**Priority Decisions Required:**

1. **Backend Architecture Decision (IMMEDIATE)**
   - Evaluate: `backend/`, `sltr-backend/`, `beckend/`
   - Current evidence: `backend/` appears primary (Railway deployment)
   - Recommendation: Confirm `backend/` as authoritative, archive others
   - Deliverable: Decision document by Day 2

2. **Security Sprint Oversight (Days 2-5)**
   - Review XSS fixes in:
     - `src/components/MapViewSimple.tsx` (lines 24, 54, 84)
     - `src/app/coming-soon/page.tsx`
     - `src/components/AlbumsManager.tsx`
   - Approve security patches before merge
   - Sign off on security review

3. **Architecture Guidance**
   - Provide guidance on service worker implementation
   - Review push notification architecture
   - Oversee test baseline quality

**Key Files to Review:**
- `backend/server.js` - Primary backend
- `sltr-backend/` - Secondary backend (TypeScript + Anthropic)
- `beckend/` - Microservices (status unclear)
- `docs/BA_COMPREHENSIVE_ASSESSMENT.md` - Full assessment

---

### 9.3 Backend Developer Brief

**Priority Assignments:**

1. **Push Notification Backend (HIGH)**
   - Implement push sending service
   - Create notification triggers for:
     - New message
     - New tap
     - Mutual match
   - Integrate with existing VAPID setup
   - Reference: `backend/env.example` for VAPID keys

2. **Admin Moderation Actions (HIGH)**
   - Create API endpoints for:
     - GET /api/admin/reports (list pending reports)
     - PATCH /api/admin/reports/:id (update report status)
     - POST /api/admin/users/:id/action (warn/suspend/ban)
   - Log all moderation actions with admin notes
   - Integrate with existing safety system

3. **API Tests (MEDIUM)**
   - Write tests for core API routes
   - Focus: auth, payments, safety endpoints
   - Target: 70% coverage on API layer

**Key Files:**
- `backend/server.js` - Main backend
- `src/app/api/` - API routes
- `src/lib/__tests__/` - Test directory

**Constraints:**
- No changes to `backend/server.js` core structure without Tech Lead approval
- Follow existing error handling patterns
- All endpoints require authentication

---

### 9.4 Frontend Developer Brief

**Priority Assignments:**

1. **XSS Security Fixes (CRITICAL - Day 1-2)**
   - Fix `src/components/MapViewSimple.tsx`:
     - Line 24: Replace innerHTML with DOM manipulation
     - Line 54: Sanitize user data
     - Line 84: Remove direct HTML injection
   - Fix `src/app/coming-soon/page.tsx`:
     - Remove/sandbox dangerouslySetInnerHTML
   - Fix `src/components/AlbumsManager.tsx`:
     - Replace innerHTML usage

   **Pattern to Follow:**
   ```typescript
   // BEFORE (Vulnerable)
   el.innerHTML = `<img src="${user.profile_photo_url}" ...`

   // AFTER (Safe)
   const img = document.createElement('img');
   img.src = user.profile_photo_url || '/default-avatar.png';
   img.alt = user.display_name || 'User';
   img.className = 'marker-image';
   el.appendChild(img);
   ```

2. **Service Worker Implementation (HIGH - Days 3-5)**
   - Create/fix service worker for push notifications
   - Handle notification display
   - Handle notification clicks (navigate to relevant screen)
   - Reference: `src/app/api/` for notification handling

3. **Component Tests (MEDIUM)**
   - Write snapshot tests for core components
   - Focus: GridCard, MapViewSimple, Messaging components
   - Target: 60% coverage on component layer

**Key Files:**
- `src/components/MapViewSimple.tsx` - Priority 1
- `src/components/AlbumsManager.tsx` - Priority 1
- `src/app/coming-soon/page.tsx` - Priority 1
- `public/sw.js` or `src/app/sw.js` - Service worker

**Constraints:**
- Do not modify locked files without explicit approval
- Run `npm run build` after changes
- All PRs require Tech Lead review for security fixes

---

### 9.5 QA Lead Brief

**Priority Assignments:**

1. **Test Baseline Establishment (Days 3-7)**
   - Create test suites for critical paths:
     - Authentication (signup, login, logout, password reset)
     - Payment (checkout, subscription activation)
     - Safety (blocking, reporting)
   - Target: 60% coverage on critical paths

2. **Security Validation (Day 5)**
   - Verify all XSS fixes are effective
   - Attempt to reproduce original vulnerabilities
   - Sign off on security sprint completion

3. **Phase 1 Validation (Days 10-15)**
   - Smoke test all core features
   - Mobile PWA testing
   - Push notification testing
   - Regression testing

**Test Priorities:**

| Priority | Area | Coverage Target |
|----------|------|-----------------|
| P0 | Authentication | 80% |
| P0 | Payments | 90% |
| P0 | Safety (block/report) | 80% |
| P1 | Core API | 70% |
| P1 | Messaging | 60% |
| P2 | Components | 50% |

**Tools:**
- Jest for unit/integration tests
- React Testing Library for components
- Existing test file pattern: `src/lib/__tests__/csrf-server.test.ts`

**Deliverables:**
- Coverage report by Day 7
- Security validation report by Day 5
- Launch readiness report by Day 15

---

## 10. Appendices

### Appendix A: Decision Log

| # | Decision | Date | Made By | Rationale |
|---|----------|------|---------|-----------|
| D1 | [Backend choice] | TBD | Tech Lead | [Pending] |
| D2 | [AI provider docs] | TBD | PM | [Pending] |
| D3 | [Launch strategy] | TBD | Stakeholders | [Pending] |
| D4 | [Groups deferral] | TBD | PM | [Pending] |
| D5 | [Test coverage target] | TBD | QA Lead | [Pending] |

### Appendix B: Sprint Backlog (Foundation Phase)

| Story | Points | Owner | Status |
|-------|--------|-------|--------|
| As a Tech Lead, I need to decide authoritative backend | 2 | Tech Lead | To Do |
| As a user, I need protection from XSS attacks | 5 | Frontend Dev | To Do |
| As QA, I need auth flow tests | 5 | QA Lead | To Do |
| As QA, I need payment flow tests | 5 | QA Lead | To Do |
| As a user, I need push notifications | 8 | Backend + Frontend | To Do |
| As an admin, I need to review reports | 8 | Full Stack | To Do |

### Appendix C: Key Document References

| Document | Location | Purpose |
|----------|----------|---------|
| BA Assessment | docs/BA_COMPREHENSIVE_ASSESSMENT.md | Requirements baseline |
| CLAUDE.md | /CLAUDE.md | Development guidelines |
| Current Status | docs/CURRENT_STATUS.md | Feature status |
| Safety Guide | docs/SAFETY_SYSTEM_GUIDE.md | Safety features |
| Testing Guide | docs/TESTING_GUIDE.md | Test patterns |

### Appendix D: Environment Configuration

**Development:**
- Frontend: `npm run dev` (port 3000)
- Backend: `cd backend && npm start` (port 3001)

**Production:**
- Frontend: Vercel
- Backend: Railway
- Database: Supabase

**Required Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
NEXT_PUBLIC_VAPID_KEY
VAPID_PRIVATE_KEY
STRIPE_SECRET_KEY
```

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | [PM] | [Pending] | |
| Tech Lead | [TL] | [Pending] | |
| Stakeholder | [SH] | [Pending] | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-03 | Project Manager | Initial project execution plan |

---

*End of Project Execution Plan*
