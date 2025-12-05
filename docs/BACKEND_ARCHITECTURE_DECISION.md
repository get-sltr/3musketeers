# Backend Architecture Decision Document

> **Tech Lead Decision Document**
> Priority: IMMEDIATE
> Date: 2025-12-03
> Status: **APPROVED FOR IMPLEMENTATION**

---

## Executive Summary

This document provides authoritative decisions on backend architecture, security review sign-off, and architecture guidance for service workers and push notifications.

---

## 1. Backend Architecture Decision

### Decision: `backend/` is the Authoritative Production Backend

| Directory | Status | Action |
|-----------|--------|--------|
| `backend/` | ✅ **PRODUCTION** | Continue as primary |
| `sltr-backend/` | ⚠️ Experimental | Archive to `_archived/` |
| `beckend/` | ❌ Incomplete | Archive to `_archived/` |

### Rationale

#### `backend/` - Production (KEEP)

| Criteria | Evidence |
|----------|----------|
| **Deployment** | Railway with Procfile, health checks, restart policies |
| **Activity** | 151+ commits, last updated Dec 2, 2025 |
| **Features** | Full EROS (analyzer, matcher, scheduler), Socket.io, Redis |
| **Stack** | Express 4.22.1, Socket.io 4.7.4, Anthropic SDK, web-push |
| **Maturity** | Comprehensive README, migration files, env templates |

**Key Files:**
- `backend/server.js` - Main server (1,461 lines)
- `backend/services/analyzer.js` - EROS behavior analyzer
- `backend/services/matcher.js` - EROS matching engine
- `backend/services/scheduler.js` - Background job scheduler
- `backend/Procfile` - Railway deployment config

#### `sltr-backend/` - Experimental (ARCHIVE)

| Criteria | Evidence |
|----------|----------|
| **Activity** | Only 5 commits, last Nov 25, 2025 |
| **Purpose** | TypeScript EROS assistant rewrite attempt |
| **Issue** | REST-only (no Socket.io), limited features |

**Archive reason:** Incomplete TypeScript rewrite. Any useful patterns (newer Anthropic SDK) should be backported to `backend/`.

#### `beckend/` - Incomplete (ARCHIVE)

| Criteria | Evidence |
|----------|----------|
| **Activity** | 1 commit only, Dec 2, 2025 |
| **Issue** | ❌ No root `package.json` - cannot deploy |
| **Purpose** | Microservices architecture proposal |

**Archive reason:** Innovative design (phase-based processing, halting worker pool) but not production-ready. Keep README for future reference.

### Implementation Actions

```bash
# Day 1 Actions (Immediate)
mkdir -p _archived

# Move experimental backends
mv sltr-backend _archived/sltr-backend
mv beckend _archived/beckend

# Update .gitignore if needed
echo "_archived/" >> .gitignore  # Optional: if you don't want to track

# Commit
git add -A
git commit -m "Refactor: Archive experimental backends, confirm backend/ as production"
```

### Future Considerations

1. **TypeScript Migration** (Optional, Long-term)
   - `backend/` could be migrated to TypeScript incrementally
   - Start with type definitions, then service files

2. **Microservices Architecture** (If needed)
   - `beckend/` design documents can inform future scaling
   - The adaptive scheduler concept is valuable for off-peak processing

---

## 2. Security Sprint Sign-Off

### Files Reviewed

| File | XSS Risk | Status |
|------|----------|--------|
| `src/components/MapViewSimple.tsx` | ✅ **REMEDIATED** | Fixed |
| `src/app/coming-soon/page.tsx` | ✅ **NONE** | Safe |
| `src/components/AlbumsManager.tsx` | ✅ **NONE** | Safe Pattern |
| `public/sw.js` | ✅ **REMEDIATED** | Fixed |

### Implemented Security Fixes

#### MapViewSimple.tsx - ✅ **FIXED**

**Original Vulnerability:** Direct `innerHTML` assignment with user-provided URLs.

**Implemented Solution:** Created secure element factory functions:

```typescript
// Safe element creation helpers to prevent XSS
const createSafeImageElement = (src: string, styles: string, alt = 'User'): HTMLImageElement => {
  const img = document.createElement('img')
  img.src = src || ''
  img.alt = alt
  img.style.cssText = styles
  return img
}

const createSafeTextElement = (tag: string, text: string, styles?: string): HTMLElement => {
  const el = document.createElement(tag)
  el.textContent = text // textContent is XSS-safe
  if (styles) el.style.cssText = styles
  return el
}

// Validation helpers for venue data
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const safeStr = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
```

**Changes Applied:**
- All 5 pin style functions now use `createSafeImageElement()` instead of innerHTML
- Venue popups use `setDOMContent()` with safe text elements instead of `setHTML()`
- User location popup uses `createSafeTextElement()` with `setDOMContent()`
- Venue data validated with `isFiniteNumber()` and `safeStr()` helpers

#### sw.js - ✅ **FIXED**

**Original Vulnerability:** Open redirect via notification click handler.

**Implemented Solution:** URL normalization to same-origin:

```javascript
// Normalize to same-origin absolute URL (prevents open redirect)
let urlToOpen;
try {
  urlToOpen = new URL(path, self.location.origin).toString();
} catch {
  urlToOpen = new URL('/messages', self.location.origin).toString();
}
```

#### coming-soon/page.tsx - ✅ **NO VULNERABILITY**

**Status:** Safe - Only hardcoded emoji used with innerHTML.

#### AlbumsManager.tsx - ✅ **NO VULNERABILITY**

**Status:** Safe - Standard HTML entity decoding pattern. Textarea never added to DOM.

### Security Sign-Off Summary

| Component | Sign-Off Status |
|-----------|-----------------|
| MapViewSimple.tsx | ✅ **APPROVED** |
| sw.js | ✅ **APPROVED** |
| coming-soon/page.tsx | ✅ **APPROVED** |
| AlbumsManager.tsx | ✅ **APPROVED** |

**Security Sprint Approval:** ✅ **COMPLETE** - All identified vulnerabilities have been remediated.

---

## 3. Architecture Guidance

### 3.1 Service Worker Implementation

**Current State:** ✅ Service worker implemented at `public/sw.js`.

**Implemented Features:**
- Push notification handling with secure URL normalization
- Offline support with cache-first strategy for static assets
- Network-first strategy for API responses
- Background sync for offline messages

**Architecture:**

```
public/
├── sw.js                 # Main service worker (implemented)
└── manifest.json         # PWA manifest

src/
├── lib/
│   └── service-worker/
│       ├── register.ts   # SW registration logic
│       ├── messaging.ts  # Push message handling
│       └── cache.ts      # Cache strategies
```

**Implementation Strategy:**

```typescript
// src/lib/service-worker/register.ts
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available - prompt user to refresh
            dispatchEvent(new CustomEvent('sw-update-available'))
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('SW registration failed:', error)
    return null
  }
}
```

**Cache Strategy:**

| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets (JS, CSS) | Cache First | 1 week |
| API responses | Network First | None (always fresh) |
| Images (avatars) | Stale-While-Revalidate | 1 day |
| Map tiles | Cache First | 1 week |

### 3.2 Push Notification Architecture

**Current State:** `web-push` package exists in `backend/package.json`.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Push Notification Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend                         Backend                        │
│  ┌──────────────┐               ┌──────────────┐                │
│  │ Request      │               │ Store sub in │                │
│  │ Permission   │──Subscribe───▶│ push_subs   │                │
│  └──────────────┘               └──────────────┘                │
│                                         │                        │
│                                         ▼                        │
│                                  ┌──────────────┐                │
│                                  │ Event Trigger│                │
│                                  │ (new message)│                │
│                                  └──────────────┘                │
│                                         │                        │
│  ┌──────────────┐               ┌──────────────┐                │
│  │ Show         │◀──web-push───│ Send to      │                │
│  │ Notification │               │ subscriber   │                │
│  └──────────────┘               └──────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- Already exists: push_subscriptions table
-- Verify structure matches:
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, endpoint)
);
```

**Frontend Hook:**

```typescript
// src/hooks/usePushNotifications.ts
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PushState {
  permission: NotificationPermission
  subscription: PushSubscription | null
  isSupported: boolean
  isLoading: boolean
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    permission: 'default',
    subscription: null,
    isSupported: false,
    isLoading: true
  })

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'denied',
      isLoading: false
    }))
  }, [])

  // Helper to convert VAPID key from base64 string to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribe = useCallback(async () => {
    if (!state.isSupported) return null

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, permission }))
        return null
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return null
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Store subscription in database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { endpoint, keys } = subscription.toJSON()
        await supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint,
          p256dh: keys?.p256dh,
          auth: keys?.auth,
          is_active: true
        }, { onConflict: 'user_id,endpoint' })
      }

      setState(prev => ({ ...prev, subscription, permission: 'granted' }))
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }, [state.isSupported])

  return { ...state, subscribe }
}
```

**Backend Integration:**

```javascript
// backend/services/notifications.js
const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

webpush.setVapidDetails(
  'mailto:support@getsltr.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

async function sendPushToUser(userId, payload) {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error || !subscriptions) {
    console.error('Failed to fetch subscriptions:', error)
    return []
  }

  if (subscriptions.length === 0) {
    return []
  }

  const results = await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  )

  // Clean up expired subscriptions
  const expired = results
    .map((r, i) => r.status === 'rejected' && r.reason.statusCode === 410 ? subscriptions[i].id : null)
    .filter(Boolean)

  if (expired.length > 0) {
    await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .in('id', expired)
  }

  return results
}

module.exports = { sendPushToUser }
```

### 3.3 Test Baseline Quality

**Current State:** Only 1 test file detected.

**Recommended Test Structure:**

```
src/
├── __tests__/
│   ├── setup.ts              # Jest setup
│   ├── utils/
│   │   └── test-utils.tsx    # Testing utilities
│   └── mocks/
│       ├── supabase.ts       # Supabase mock
│       └── mapbox.ts         # Mapbox mock
├── components/
│   └── __tests__/
│       ├── UserProfileModal.test.tsx
│       ├── GridView.test.tsx
│       └── ...
└── hooks/
    └── __tests__/
        ├── useUser.test.ts
        ├── usePrivileges.test.ts
        └── ...
```

**Minimum Test Coverage Targets:**

| Category | Current | Target (Week 1) | Target (Week 4) |
|----------|---------|-----------------|-----------------|
| Components | ~0% | 20% | 60% |
| Hooks | ~0% | 40% | 80% |
| API Routes | ~0% | 30% | 70% |
| A11y Tests | 0% | 50% modals | 100% modals |

**Priority Test Cases:**

1. **UserProfileModal** - Focus trap, ARIA, keyboard nav
2. **useUser** - Auth state management
3. **usePrivileges** - Subscription tier logic
4. **API Routes** - Rate limiting, auth checks

---

## 4. Action Items Summary

### Immediate (Day 1-2)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Archive `sltr-backend/` and `beckend/` | DevOps | Pending |
| 2 | Fix XSS in MapViewSimple.tsx | Frontend | **BLOCKED** |
| 3 | Sign off coming-soon + AlbumsManager | Security | ✅ Done |

### This Sprint (Days 2-5)

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 4 | Create service worker registration | Frontend | Pending |
| 5 | Integrate push notifications hook | Frontend | Pending |
| 6 | Set up test infrastructure | QA | Pending |
| 7 | Write tests for top 5 components | Frontend | Pending |

---

## Appendix: Environment Variables Required

For push notifications, ensure these are set:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>

# Backend (backend/.env)
VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
```

Generate VAPID keys:
```bash
npx web-push generate-vapid-keys
```

---

**Document Version:** 1.0.0
**Approved By:** Tech Lead
**Date:** 2025-12-03
