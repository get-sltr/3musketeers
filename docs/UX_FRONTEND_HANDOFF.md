# UX Engineering Handoff Document

**From:** UX Engineer
**To:** Frontend Development Team
**Date:** 2025-12-03
**Handoff Target:** Day 9

---

## Overview

This document consolidates all UX design deliverables for the current sprint. Three main areas were addressed:

1. **Admin Moderation Dashboard MVP** (HIGH Priority)
2. **Push Notification UX** (MEDIUM Priority)
3. **Mobile Optimization Review** (LOW Priority)

---

## Design Deliverables

| Document | Location | Status |
|----------|----------|--------|
| Admin Dashboard Specs | `docs/UX_ADMIN_DASHBOARD_SPECS.md` | Complete |
| Push Notification UX | `docs/UX_PUSH_NOTIFICATIONS_SPECS.md` | Complete |
| Mobile Friction Review | `docs/UX_MOBILE_FRICTION_REVIEW.md` | Complete |

---

## 1. Admin Moderation Dashboard (Priority: HIGH)

### Summary
A moderation dashboard for reviewing user reports and taking action (warn, suspend, ban, dismiss).

### Key Components to Build

| Component | Description | Priority |
|-----------|-------------|----------|
| `StatsCard` | Dashboard stats display | High |
| `ReportRow` | Table row for report queue | High |
| `ReportDetailPanel` | Slide-out report details | High |
| `ActionButton` | Warn/suspend/ban/dismiss | High |
| `ConfirmActionModal` | Action confirmation | High |
| `ActivityLogEntry` | Log entry display | Medium |

### File Structure
```
src/app/admin/moderation/
├── page.tsx              # Dashboard
├── reports/page.tsx      # Report queue
├── logs/page.tsx         # Activity log
└── components/
    ├── StatsCard.tsx
    ├── ReportRow.tsx
    ├── ReportDetailPanel.tsx
    ├── ActionButton.tsx
    ├── ConfirmActionModal.tsx
    └── ActivityLogEntry.tsx
```

### Design Pattern Reference
Follow existing `src/app/admin/black-cards/page.tsx` patterns:
- Dark zinc-900 background
- Gold (#ffd700) primary accent
- Table with hover states
- Stats cards at top

### Database Requirements
New table needed: `moderation_logs`
Profile fields: `suspension_status`, `suspension_until`, `warning_count`

See full specs: `docs/UX_ADMIN_DASHBOARD_SPECS.md`

---

## 2. Push Notification UX (Priority: MEDIUM)

### Summary
Optimize notification permission flow, add granular preferences, and create in-app notification center.

### Key Components to Build

| Component | Description | Priority |
|-----------|-------------|----------|
| `NotificationPrompt` | Redesign existing | High |
| `NotificationSettings` | Preferences page | Medium |
| `NotificationCenter` | Bell icon + list | Medium |
| `NotificationBadge` | Unread count badge | Medium |
| `NotificationItem` | Individual notification | Medium |

### File Structure
```
src/components/
├── NotificationPrompt.tsx     # Modify existing
├── NotificationSettings.tsx   # New
├── NotificationCenter.tsx     # New
├── NotificationBadge.tsx      # New
└── NotificationItem.tsx       # New

src/app/settings/notifications/
└── page.tsx                   # New settings page
```

### Key Changes
1. **Contextual prompts** - Trigger on events (message, tap), not immediately
2. **Granular control** - Let users toggle notification types
3. **Notification center** - In-app history accessible via bell icon
4. **Quiet hours** - Do not disturb scheduling

### Database Requirements
New tables: `notification_preferences`, `notifications`

See full specs: `docs/UX_PUSH_NOTIFICATIONS_SPECS.md`

---

## 3. Mobile Quick Wins (Priority: LOW)

### Summary
17 friction points identified, 5 quick wins recommended.

### Quick Wins (< 1 hour each)

| Fix | File | Change |
|-----|------|--------|
| Touch targets | `mobile-optimization.css` | Add `min-height: 44px` |
| Nav label size | `BottomNav.tsx` | Change `text-[9px]` → `text-[11px]` |
| Infinite animation | `MobileLayout.tsx` | Hide after 5s, localStorage flag |
| GPU acceleration | `MobileLayout.tsx` | Remove `will-change` from container |
| Scroll lock | New hook | Create `useScrollLock.ts` |

### High Priority Mobile Issues
- Scroll position lost on modal close
- Map pin tap accuracy
- Background scroll in modals

See full review: `docs/UX_MOBILE_FRICTION_REVIEW.md`

---

## Component Style Guide

### Color Usage

```typescript
// Admin Dashboard
const colors = {
  background: 'bg-zinc-900',
  border: 'border-zinc-800',
  primary: '#ffd700',           // Gold for admin
  danger: 'text-red-500',
  warning: 'text-yellow-500',
  success: 'text-green-500',
}

// Notification Center
const colors = {
  background: 'bg-black/95',
  border: 'border-white/10',
  primary: 'lime-400',          // App primary
  unread: 'bg-red-500',
}
```

### Status Badge Patterns

```tsx
// Report category badges
const categoryStyles = {
  harassment:    'bg-red-900/30 text-red-500',
  fake:          'bg-orange-900/30 text-orange-500',
  inappropriate: 'bg-purple-900/30 text-purple-500',
  spam:          'bg-yellow-900/30 text-yellow-500',
  other:         'bg-zinc-800 text-zinc-400',
}

// Notification type badges
const notificationStyles = {
  message: '💬',
  tap:     '❤️',
  view:    '👀',
  eros:    '🤖',
  system:  '⚙️',
}
```

### Button Patterns

```tsx
// Primary action (gold for admin)
<button className="px-6 py-3 bg-[#ffd700] text-black font-semibold rounded-lg hover:opacity-90">
  Export CSV
</button>

// Danger action
<button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500">
  Ban User
</button>

// Secondary action
<button className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700">
  Cancel
</button>
```

### Modal Pattern

```tsx
// Slide-out panel (right side)
<div className="fixed inset-y-0 right-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50">
  {/* Header */}
  <div className="flex items-center justify-between p-4 border-b border-zinc-800">
    <h2 className="text-xl font-bold">Report Details</h2>
    <button onClick={onClose} aria-label="Close">✕</button>
  </div>

  {/* Content */}
  <div className="p-4 overflow-y-auto">
    {children}
  </div>
</div>

// Backdrop
<div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
```

---

## API Contracts

### Admin Moderation APIs

```typescript
// GET /api/admin/reports?status=pending&category=all&page=1
interface ReportListResponse {
  reports: Report[]
  total: number
  page: number
}

// PUT /api/admin/reports/:id/action
interface ActionRequest {
  action: 'warn' | 'suspend' | 'ban' | 'dismiss'
  reason: string
  duration?: number
}

// GET /api/admin/stats
interface StatsResponse {
  pending: number
  reviewing: number
  resolvedToday: number
  resolvedWeek: number
  byCategory: Record<string, number>
}
```

### Notification APIs

```typescript
// GET /api/notifications/preferences
interface NotificationPreferences {
  pushEnabled: boolean
  newMessages: boolean
  tapsAndMatches: boolean
  // ... see full spec
}

// GET /api/notifications?page=1&limit=20
interface NotificationListResponse {
  notifications: NotificationItem[]
  total: number
  unreadCount: number
}

// PUT /api/notifications/read-all
// Response: { success: true }
```

---

## Accessibility Checklist

### Admin Dashboard
- [ ] All buttons have aria-labels
- [ ] Table has proper roles (grid, row, cell)
- [ ] Focus trap in confirmation modals
- [ ] Keyboard navigation (N/P for next/prev)
- [ ] High contrast maintained

### Notification Center
- [ ] Bell button announces unread count
- [ ] Notifications are keyboard navigable
- [ ] Toast uses aria-live="polite"
- [ ] Toggle switches have proper roles

### Mobile
- [ ] 44px minimum touch targets
- [ ] Focus visible for keyboard users
- [ ] Screen reader compatible

---

## Testing Requirements

### Admin Dashboard
1. Report filtering (status, category, search)
2. Action flow (warn → confirm → success)
3. Real-time updates (new reports appear)
4. Admin role verification
5. Audit log accuracy

### Notifications
1. Permission flow timing
2. Preference persistence
3. In-app vs push delivery
4. Quiet hours respect
5. Notification grouping

### Mobile
1. Touch target sizes
2. Scroll position persistence
3. Keyboard layout adaptation
4. Safe area rendering

---

## Estimated Development Time

| Feature | Effort | Priority |
|---------|--------|----------|
| Admin Dashboard MVP | 3-4 days | HIGH |
| Push Notification Flow | 2-3 days | MEDIUM |
| Mobile Quick Wins | 0.5 day | LOW |
| Mobile Full Fixes | 2-3 days | LOW |

**Total Recommended Sprint:** 5-7 days

---

## Questions for Tech Lead

1. **Admin Role System**: How is admin status determined? Need `is_admin` profile field or separate table?

2. **Real-time Updates**: Should reports use Supabase Realtime or polling for new reports?

3. **Email Notifications**: Should warn/suspend/ban actions trigger user emails? Separate endpoint or integrated?

4. **Notification Storage**: How long to retain notifications? 30 days? Infinite?

5. **Mobile PWA**: Are we targeting app store submission or PWA-only?

---

## Sign-off

**UX Engineering Complete:** 2025-12-03
**Ready for Development:** Yes
**Design Review:** Pending Product Manager

---

### Next Steps

1. **Tech Lead Review**: Validate API contracts and database schema
2. **Product Review**: Confirm feature scope and priorities
3. **Sprint Planning**: Allocate development tasks
4. **Development Start**: Day 9

---

**Contact:** UX Engineer available for clarification during implementation.
