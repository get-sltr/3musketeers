# Admin Moderation Dashboard - UX Design Specifications

**Version:** 1.0
**Author:** UX Engineer
**Date:** 2025-12-03
**Status:** Design Ready for Development
**Priority:** HIGH

---

## Executive Summary

Design specifications for the SLTR Admin Moderation Dashboard MVP, enabling moderators to efficiently review user reports, take action on violations, and maintain platform safety. Design follows existing admin patterns from `/admin/black-cards/` with safety-focused enhancements.

---

## 1. Information Architecture

### 1.1 Route Structure
```
/admin/moderation           → Dashboard Overview
/admin/moderation/reports   → Report Queue (default view)
/admin/moderation/users     → User Management (future)
/admin/moderation/logs      → Activity Logs
```

### 1.2 Navigation Hierarchy
```
Admin Dashboard
├── Overview (stats + quick actions)
├── Report Queue
│   ├── Pending (default)
│   ├── Under Review
│   └── Resolved/Dismissed
├── User Actions (future)
└── Activity Log
```

---

## 2. User Flows

### 2.1 Primary Flow: Review & Action on Report

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REPORT REVIEW FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐      │
│  │  View    │───►│  Review  │───►│  Take    │───►│  Log &   │      │
│  │  Queue   │    │  Details │    │  Action  │    │  Close   │      │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘      │
│       │               │               │               │             │
│       ▼               ▼               ▼               ▼             │
│  • Filter by     • Reporter      • Warn User    • Auto-log        │
│    status/type     profile       • Suspend        action          │
│  • Sort by       • Reported      • Ban          • Email           │
│    urgency         profile       • Dismiss        notification    │
│  • Search        • Evidence      • Escalate     • Update          │
│                  • History                        stats           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Action Decision Tree

```
Report Received
     │
     ├── Harassment ──────────► Severe? ─── Yes ──► Immediate Ban
     │                              │
     │                              No
     │                              │
     │                              ▼
     │                         First Offense? ─── Yes ──► Warning
     │                              │
     │                              No
     │                              ▼
     │                         7-day Suspension
     │
     ├── Fake Profile ────────► Verified Fake? ─── Yes ──► Ban + Delete
     │                              │
     │                              No ──► Dismiss + Note
     │
     ├── Inappropriate ───────► Against Guidelines? ─── Yes ──► Content Removal + Warning
     │                              │
     │                              No ──► Dismiss
     │
     ├── Spam ────────────────► Bot Pattern? ─── Yes ──► Immediate Ban
     │                              │
     │                              No ──► Warning
     │
     └── Other ───────────────► Review + Custom Action
```

---

## 3. Wireframes

### 3.1 Dashboard Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│  ⚡ SLTR Admin                                     [Avatar] Admin Name  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🛡️ Moderation Dashboard                          [Last updated: 2m ago]│
│  Keep the community safe                                                │
│                                                                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────┐│
│  │  🔴 PENDING     │ │  🟡 REVIEWING   │ │  ✅ RESOLVED    │ │ TODAY  ││
│  │      12        │ │       3        │ │      47        │ │   8    ││
│  │  Reports       │ │  In Progress   │ │  This Week     │ │ Actions││
│  │  [+3 urgent]   │ │                │ │                │ │        ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────┘│
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  URGENT REPORTS (Harassment)                    [View All Queue]  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  🔴 @user123 reported @baduser • Harassment • 5 min ago          │  │
│  │     "Threatening messages after rejecting advances"    [Review →]│  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │  🔴 @profile456 reported @spammer • Spam • 12 min ago            │  │
│  │     "Sending same message to everyone"            [Review →]     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │  REPORTS BY CATEGORY       │  │  RECENT ACTIONS                 │   │
│  │  (Last 7 Days)             │  │                                 │   │
│  │                            │  │  🟡 Warned @user789 • 1h ago    │   │
│  │  ████████░░ Harassment 45% │  │  🔴 Banned @fakeacc • 2h ago    │   │
│  │  ███░░░░░░░ Fake 18%       │  │  🟢 Dismissed report • 3h ago   │   │
│  │  ██░░░░░░░░ Inappropriate  │  │  🟡 Suspended @spam • 4h ago    │   │
│  │  █░░░░░░░░░ Spam 8%        │  │                                 │   │
│  │  █░░░░░░░░░ Other 5%       │  │  [View Full Log →]              │   │
│  └────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Report Queue View

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                                    │
│                                                                         │
│  Report Queue                                           12 pending     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ [🔍 Search reports...]  [Status ▼]  [Category ▼]  [Sort: Newest]  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ ○ │ REPORTER      │ REPORTED     │ CATEGORY    │ TIME    │ ACTION│  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ● │ @sarah_j      │ @toxic_user  │ 🔴 Harass.  │ 5m      │ [→]  │  │
│  │   │ "Threatening messages..."                                    │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ○ │ @mike_r       │ @fake2024    │ 🟠 Fake     │ 23m     │ [→]  │  │
│  │   │ "Using stolen photos..."                                     │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ○ │ @jen_k        │ @spam_bot    │ 🟡 Spam     │ 1h      │ [→]  │  │
│  │   │ "Sending same message to everyone..."                        │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ ○ │ @alex_m       │ @bad_content │ 🟣 Inappro. │ 2h      │ [→]  │  │
│  │   │ "Explicit content in profile..."                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [◀ Prev]  Page 1 of 3  [Next ▶]                                       │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Report Detail View (Slide-out Panel)

```
┌────────────────────────────────────────────────────────────────────────┐
│                                          ┌────────────────────────────┐│
│  Report Queue                            │ REPORT DETAILS        [✕] ││
│  ...                                     │                            ││
│                                          │ 🔴 HARASSMENT              ││
│                                          │ Reported 5 minutes ago     ││
│                                          │                            ││
│                                          │ ─────────────────────────  ││
│                                          │                            ││
│                                          │ REPORTER                   ││
│                                          │ ┌────┐                     ││
│                                          │ │ 📷 │ @sarah_j            ││
│                                          │ └────┘ Member since 2024   ││
│                                          │        [View Profile]      ││
│                                          │                            ││
│                                          │ ─────────────────────────  ││
│                                          │                            ││
│                                          │ REPORTED USER              ││
│                                          │ ┌────┐                     ││
│                                          │ │ 📷 │ @toxic_user         ││
│                                          │ └────┘ 🔴 2 prior reports  ││
│                                          │        [View Profile]      ││
│                                          │                            ││
│                                          │ ─────────────────────────  ││
│                                          │                            ││
│                                          │ REASON PROVIDED            ││
│                                          │ "Sent threatening messages ││
│                                          │ after I rejected their     ││
│                                          │ advances. Said they would  ││
│                                          │ find where I live."        ││
│                                          │                            ││
│                                          │ ─────────────────────────  ││
│                                          │                            ││
│                                          │ ADMIN NOTES                ││
│                                          │ [Add internal notes...]    ││
│                                          │                            ││
│                                          │ ─────────────────────────  ││
│                                          │                            ││
│                                          │ TAKE ACTION                ││
│                                          │                            ││
│                                          │ [⚠️ Warn User]             ││
│                                          │ [⏸️ Suspend (7 days)]      ││
│                                          │ [🚫 Ban User]              ││
│                                          │ [✓ Dismiss Report]         ││
│                                          │                            ││
│                                          └────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Action Confirmation Modal

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    ┌────────────────────────────────┐                   │
│                    │                                │                   │
│                    │  🚫 BAN USER                   │                   │
│                    │                                │                   │
│                    │  You are about to ban:         │                   │
│                    │  @toxic_user                   │                   │
│                    │                                │                   │
│                    │  This will:                    │                   │
│                    │  • Remove all their content    │                   │
│                    │  • Prevent future logins       │                   │
│                    │  • Notify user via email       │                   │
│                    │                                │                   │
│                    │  Reason (required):            │                   │
│                    │  ┌──────────────────────────┐  │                   │
│                    │  │ Threatening behavior     │  │                   │
│                    │  │ after rejection          │  │                   │
│                    │  └──────────────────────────┘  │                   │
│                    │                                │                   │
│                    │  ┌──────────┐  ┌────────────┐  │                   │
│                    │  │  Cancel  │  │  Confirm   │  │                   │
│                    │  │          │  │  Ban 🚫    │  │                   │
│                    │  └──────────┘  └────────────┘  │                   │
│                    │                                │                   │
│                    └────────────────────────────────┘                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 Stats Card Component

```typescript
interface StatsCardProps {
  icon: string           // Emoji or icon
  label: string          // "Pending", "Resolved", etc.
  value: number          // Count
  subtext?: string       // "+3 urgent"
  variant: 'danger' | 'warning' | 'success' | 'neutral'
  onClick?: () => void
}

// Styling (follows existing admin pattern)
const variantStyles = {
  danger:  'border-red-900 text-red-500',
  warning: 'border-yellow-900 text-yellow-500',
  success: 'border-green-900 text-green-500',
  neutral: 'border-zinc-800 text-white'
}

// Base: bg-zinc-900 rounded-xl p-6 border
```

### 4.2 Report Row Component

```typescript
interface ReportRowProps {
  id: string
  reporter: {
    id: string
    username: string
    avatar?: string
  }
  reported: {
    id: string
    username: string
    avatar?: string
    priorReports: number
  }
  category: 'harassment' | 'fake' | 'inappropriate' | 'spam' | 'other'
  reason: string           // Truncated preview
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  createdAt: Date
  isUrgent: boolean
  onSelect: () => void
}

// Category colors
const categoryColors = {
  harassment:    { bg: 'bg-red-900/30',    text: 'text-red-500' },
  fake:          { bg: 'bg-orange-900/30', text: 'text-orange-500' },
  inappropriate: { bg: 'bg-purple-900/30', text: 'text-purple-500' },
  spam:          { bg: 'bg-yellow-900/30', text: 'text-yellow-500' },
  other:         { bg: 'bg-zinc-800',      text: 'text-zinc-400' }
}
```

### 4.3 Report Detail Panel Component

```typescript
interface ReportDetailPanelProps {
  report: Report
  isOpen: boolean
  onClose: () => void
  onAction: (action: ModerationAction) => void
}

interface ModerationAction {
  type: 'warn' | 'suspend' | 'ban' | 'dismiss'
  reason: string
  duration?: number  // For suspend (days)
  notifyUser: boolean
}
```

### 4.4 Action Button Component

```typescript
interface ActionButtonProps {
  variant: 'warn' | 'suspend' | 'ban' | 'dismiss'
  onClick: () => void
  disabled?: boolean
}

const buttonStyles = {
  warn:    'bg-yellow-600 hover:bg-yellow-500 text-black',
  suspend: 'bg-orange-600 hover:bg-orange-500 text-white',
  ban:     'bg-red-600 hover:bg-red-500 text-white',
  dismiss: 'bg-zinc-700 hover:bg-zinc-600 text-white'
}
```

### 4.5 Activity Log Entry Component

```typescript
interface ActivityLogEntryProps {
  action: 'warned' | 'suspended' | 'banned' | 'dismissed' | 'escalated'
  targetUser: string
  adminUser: string
  reason: string
  timestamp: Date
  reportId: string
}
```

---

## 5. State Management

### 5.1 Moderation Store (Zustand)

```typescript
interface ModerationStore {
  // Report queue
  reports: Report[]
  selectedReport: Report | null
  filter: ReportFilter

  // Stats
  stats: {
    pending: number
    reviewing: number
    resolvedToday: number
    resolvedWeek: number
  }

  // Actions
  fetchReports: () => Promise<void>
  selectReport: (id: string) => void
  takeAction: (action: ModerationAction) => Promise<void>
  updateFilter: (filter: ReportFilter) => void
  refreshStats: () => Promise<void>
}

interface ReportFilter {
  status: 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  category: 'all' | 'harassment' | 'fake' | 'inappropriate' | 'spam' | 'other'
  sortBy: 'newest' | 'oldest' | 'urgent'
  searchTerm: string
}
```

---

## 6. API Requirements

### 6.1 Endpoints Needed

```typescript
// GET /api/admin/reports
// Query: status, category, page, limit, search
// Returns: { reports: Report[], total: number, page: number }

// GET /api/admin/reports/:id
// Returns: Full report with reporter/reported profiles

// PUT /api/admin/reports/:id/action
// Body: { action: 'warn' | 'suspend' | 'ban' | 'dismiss', reason: string, duration?: number }
// Returns: { success: boolean, log: ActivityLog }

// GET /api/admin/stats
// Returns: { pending, reviewing, resolvedToday, resolvedWeek, byCategory }

// GET /api/admin/logs
// Query: page, limit, action_type
// Returns: { logs: ActivityLog[], total: number }

// GET /api/admin/users/:id/history
// Returns: { reports: Report[], actions: ActivityLog[], warnings: number }
```

### 6.2 Database Schema Additions

```sql
-- Moderation logs table
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  report_id UUID REFERENCES reports(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('warn', 'suspend', 'ban', 'dismiss', 'escalate')),
  reason TEXT NOT NULL,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User suspension status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  suspension_status TEXT DEFAULT 'active'
  CHECK (suspension_status IN ('active', 'warned', 'suspended', 'banned'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  suspension_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  warning_count INTEGER DEFAULT 0;
```

---

## 7. Accessibility Requirements

### 7.1 Keyboard Navigation
- Tab through all interactive elements
- Arrow keys navigate report list
- Enter opens report detail
- Escape closes panels/modals
- Keyboard shortcuts: `N` next report, `P` previous, `W` warn, `D` dismiss

### 7.2 ARIA Labels
```html
<button aria-label="View report details from @username">
<div role="dialog" aria-labelledby="report-detail-title">
<table role="grid" aria-label="Report queue">
<tr role="row" aria-selected="true">
```

### 7.3 Focus Management
- Focus moves to detail panel when opened
- Focus returns to row when panel closes
- Focus trap within confirmation modals

---

## 8. Responsive Behavior

### 8.1 Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1024px) | Full dashboard with side-by-side panels |
| Tablet (768-1023px) | Stacked stats, full-width table, slide-out detail |
| Mobile (≤767px) | Single column, card-based reports, bottom sheet detail |

### 8.2 Mobile Adaptations
- Stats become horizontal scroll cards
- Report table becomes card list
- Detail panel becomes bottom sheet
- Action buttons become full-width

---

## 9. Error States

### 9.1 Empty States
```
┌─────────────────────────────────────┐
│              🎉                      │
│                                     │
│    No pending reports!              │
│    The community is behaving.       │
│                                     │
│    [Refresh Queue]                  │
└─────────────────────────────────────┘
```

### 9.2 Error States
```
┌─────────────────────────────────────┐
│              ⚠️                      │
│                                     │
│    Failed to load reports           │
│    Please check your connection     │
│                                     │
│    [Retry]  [Contact Support]       │
└─────────────────────────────────────┘
```

---

## 10. Security Considerations

### 10.1 Access Control
- Admin check middleware on all `/admin/*` routes
- Role verification from profiles table or separate admin_users table
- Audit log for all moderation actions
- Rate limiting on action endpoints

### 10.2 Data Protection
- PII masking in logs (show @username, not full profile)
- Reason text sanitized before display
- Admin actions cannot be undone without super-admin

---

## 11. Implementation Checklist

### Phase 1: Core Dashboard (MVP)
- [ ] Create `/admin/moderation/page.tsx` route
- [ ] Build StatsCard component
- [ ] Build ReportRow component
- [ ] Build ReportDetailPanel component
- [ ] Implement report fetching from Supabase
- [ ] Add filter and search functionality
- [ ] Implement action buttons (warn/suspend/ban/dismiss)
- [ ] Create moderation_logs table and API

### Phase 2: Polish
- [ ] Add Activity Log view
- [ ] Implement keyboard navigation
- [ ] Add responsive mobile view
- [ ] Add export functionality
- [ ] Implement real-time updates (Supabase Realtime)

### Phase 3: Advanced
- [ ] User history view
- [ ] Bulk actions on multiple reports
- [ ] Email notifications to users
- [ ] Admin role management

---

## 12. Handoff Notes for Frontend Dev

### Files to Create
```
src/app/admin/moderation/
├── page.tsx              # Main dashboard
├── reports/
│   └── page.tsx          # Full report queue
├── logs/
│   └── page.tsx          # Activity log
└── components/
    ├── StatsCard.tsx
    ├── ReportRow.tsx
    ├── ReportDetailPanel.tsx
    ├── ActionButton.tsx
    ├── ActivityLogEntry.tsx
    └── ConfirmActionModal.tsx
```

### Style Guidelines
- Follow Black Cards Admin pattern (zinc-900 base, zinc-800 borders)
- Use red for danger/harassment, yellow for warning, green for success
- Gold (#ffd700) for primary CTAs (matches existing admin)
- Use existing glass-bubble class for modals

### Dependencies
- Existing: `@supabase/supabase-js`, Tailwind CSS
- Add: None (use native components)

---

**Design Status:** Ready for Frontend Development
**Estimated Dev Time:** 3-4 days for MVP
**Review Required:** Product Manager, Tech Lead
