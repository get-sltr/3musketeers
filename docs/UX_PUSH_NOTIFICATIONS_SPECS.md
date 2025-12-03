# Push Notification UX - Design Specifications

**Version:** 1.0
**Author:** UX Engineer
**Date:** 2025-12-03
**Status:** Design Ready for Development
**Priority:** MEDIUM

---

## Executive Summary

Redesign the push notification permission flow to increase opt-in rates, add granular notification preferences, and create an in-app notification center. Current implementation has basic functionality but lacks UX optimization for permission conversion and user control.

---

## 1. Current State Analysis

### 1.1 Existing Implementation
- **NotificationPrompt.tsx**: Bottom floating prompt on first visit
- **useNotifications.ts**: Hook for permission + service worker
- **Issues identified**:
  - Prompt appears immediately (poor timing)
  - No explanation of notification types
  - Binary choice (enable/dismiss) with no middle ground
  - No settings page for notification preferences
  - No in-app notification history

### 1.2 Key Metrics to Improve
- Permission request acceptance rate
- Time to first notification opt-in
- Notification engagement rate
- User control satisfaction

---

## 2. Permission Request Flow

### 2.1 Optimized Flow Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                 PERMISSION REQUEST TIMING                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Journey Trigger Points (in order of effectiveness):           │
│                                                                      │
│  1. ⭐ BEST: After first received message                           │
│     "Someone messaged you! Enable notifications to never miss a    │
│      message from your matches."                                    │
│                                                                      │
│  2. After first tap/match                                           │
│     "You matched with @username! Enable notifications to know      │
│      when they message you."                                        │
│                                                                      │
│  3. When user views messages (empty inbox)                          │
│     "Get notified when someone reaches out to you."                │
│                                                                      │
│  4. FALLBACK: After 5 minutes on platform + 3 interactions          │
│     "Stay connected - enable notifications for messages & taps"     │
│                                                                      │
│  ❌ AVOID: Immediate prompt on first visit (current behavior)       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Contextual Permission Prompt

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │   💬 New message from @marcus_j                                │ │
│  │                                                                │ │
│  │   ─────────────────────────────────────────────────────────── │ │
│  │                                                                │ │
│  │   Never miss a connection!                                     │ │
│  │                                                                │ │
│  │   Get notified when you receive:                               │ │
│  │   • 💬 New messages                                            │ │
│  │   • ❤️ Taps & matches                                          │ │
│  │   • 🤖 EROS AI match suggestions                               │ │
│  │                                                                │ │
│  │   ┌────────────────────────────────────────────────────────┐  │ │
│  │   │            ✅ Enable Notifications                      │  │ │
│  │   └────────────────────────────────────────────────────────┘  │ │
│  │                                                                │ │
│  │   ┌─────────────────────┐  ┌─────────────────────────────┐   │ │
│  │   │   Maybe Later       │  │   Customize Settings →      │   │ │
│  │   └─────────────────────┘  └─────────────────────────────┘   │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Permission States UI

#### State: Not Asked
```
[Location: In-app prompt at contextual moment]
Primary CTA: "Enable Notifications"
Secondary: "Maybe Later" (dismisses for 24h)
Tertiary: "Customize Settings" (opens preferences)
```

#### State: Denied (Browser Level)
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                                                                │ │
│  │   🔕 Notifications Blocked                                     │ │
│  │                                                                │ │
│  │   You've blocked notifications in your browser.                │ │
│  │   To enable them:                                              │ │
│  │                                                                │ │
│  │   1. Click the 🔒 icon in your address bar                     │ │
│  │   2. Find "Notifications"                                      │ │
│  │   3. Change to "Allow"                                         │ │
│  │   4. Refresh this page                                         │ │
│  │                                                                │ │
│  │   [Show Me How (opens help article)]                           │ │
│  │                                                                │ │
│  │   [Dismiss]                                                    │ │
│  │                                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### State: Granted
```
Brief toast: "🔔 Notifications enabled! You'll never miss a message."
No persistent UI needed.
```

---

## 3. Notification Preferences Settings

### 3.1 Settings Page Location

```
/settings → Notification Preferences
```

### 3.2 Preferences Interface

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Settings                                                            │
│                                                                         │
│  🔔 Notification Preferences                                            │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  PUSH NOTIFICATIONS                              [████████████] ON     │
│  Receive notifications even when app is closed                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  MESSAGE NOTIFICATIONS                                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  💬 New Messages                                           [ON]  │  │
│  │  Get notified when someone sends you a message                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ✍️ Typing Indicators                                     [OFF]  │  │
│  │  Get notified when someone is typing to you                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  SOCIAL NOTIFICATIONS                                                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ❤️ Taps & Matches                                         [ON]  │  │
│  │  Know when someone taps or matches with you                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  👀 Profile Views                                         [OFF]  │  │
│  │  Know when someone views your profile                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ⭐ New Favorites                                          [ON]  │  │
│  │  Know when someone favorites you                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  AI & DISCOVERY                                                         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🤖 EROS AI Suggestions                                    [ON]  │  │
│  │  Daily match recommendations from our AI                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📍 Nearby Alerts                                         [OFF]  │  │
│  │  When a match is near your location                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  QUIET HOURS                                                            │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🌙 Do Not Disturb                                        [OFF]  │  │
│  │  Silence notifications during set hours                          │  │
│  │                                                                  │  │
│  │  From: [10:00 PM ▼]  To: [7:00 AM ▼]                             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  SOUND & VIBRATION                                                      │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  🔊 Notification Sound                                     [ON]  │  │
│  │  [SLTR Ping ▼] ← (custom sound dropdown)                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  📳 Vibration                                              [ON]  │  │
│  │  Haptic feedback for notifications                               │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. In-App Notification Center

### 4.1 Access Point

```
Location: Header icon (bell) with unread badge
Route: /notifications (or slide-out panel)
```

### 4.2 Notification Center UI

```
┌────────────────────────────────────────────────────────────────────────┐
│  ← Back                    Notifications              [Mark All Read]  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  TODAY                                                                  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ● 💬 @marcus_j sent you a message                    2 min ago  │  │
│  │     "Hey! Saw you're into hiking too..."                         │  │
│  │                                                     [View Chat →] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ● ❤️ @alex_k tapped you!                            15 min ago  │  │
│  │     They're 0.3 miles away                                       │  │
│  │                                              [View Profile →]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ○ 🤖 EROS found 3 matches for you                      1h ago   │  │
│  │     Based on your preferences and activity                       │  │
│  │                                               [View Matches →]   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  YESTERDAY                                                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ○ 👀 3 people viewed your profile                     Yesterday │  │
│  │     @user1, @user2, and 1 other                                  │  │
│  │                                                  [See Who →]     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  ○ ⭐ @jamie_r added you to favorites               Yesterday    │  │
│  │                                              [View Profile →]    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  [Load More]                                                            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Notification Types

| Type | Icon | Priority | Grouped? |
|------|------|----------|----------|
| New Message | 💬 | High | No (show each) |
| Tap/Match | ❤️ | High | Yes (X people tapped) |
| Profile View | 👀 | Low | Yes (X viewed) |
| Favorite | ⭐ | Medium | No |
| EROS Match | 🤖 | Medium | Yes (X matches) |
| Video Call | 📹 | Critical | No |
| System | ⚙️ | Low | No |

---

## 5. Component Specifications

### 5.1 NotificationPrompt (Redesigned)

```typescript
interface NotificationPromptProps {
  trigger: 'message' | 'tap' | 'empty_inbox' | 'timed' | 'manual'
  contextData?: {
    senderUsername?: string
    matchUsername?: string
  }
  onEnable: () => void
  onDismiss: () => void
  onCustomize: () => void
}

// Timing logic
const PROMPT_DELAY_HOURS = 24 // After dismiss
const MIN_INTERACTIONS = 3   // Before timed prompt
const MIN_TIME_ON_PLATFORM = 5 * 60 * 1000 // 5 minutes
```

### 5.2 NotificationSettings Component

```typescript
interface NotificationPreferences {
  // Push
  pushEnabled: boolean

  // Message
  newMessages: boolean
  typingIndicators: boolean

  // Social
  tapsAndMatches: boolean
  profileViews: boolean
  newFavorites: boolean

  // Discovery
  erosSuggestions: boolean
  nearbyAlerts: boolean

  // Quiet Hours
  quietHoursEnabled: boolean
  quietHoursStart: string // "22:00"
  quietHoursEnd: string   // "07:00"

  // Sound & Vibration
  soundEnabled: boolean
  soundType: 'sltr_ping' | 'subtle' | 'classic' | 'none'
  vibrationEnabled: boolean
}
```

### 5.3 NotificationCenter Component

```typescript
interface NotificationItem {
  id: string
  type: 'message' | 'tap' | 'view' | 'favorite' | 'eros' | 'video' | 'system'
  title: string
  body: string
  isRead: boolean
  createdAt: Date
  data: {
    userId?: string
    conversationId?: string
    matchIds?: string[]
    actionUrl: string
  }
}

interface NotificationCenterProps {
  notifications: NotificationItem[]
  unreadCount: number
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onNotificationClick: (item: NotificationItem) => void
  onLoadMore: () => void
  hasMore: boolean
}
```

### 5.4 NotificationBadge Component

```typescript
interface NotificationBadgeProps {
  count: number
  maxDisplay?: number // Default 99, shows "99+"
  variant?: 'dot' | 'count'
  position?: 'top-right' | 'top-left'
}
```

---

## 6. Database Schema

```sql
-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push
  push_enabled BOOLEAN DEFAULT true,

  -- Messages
  new_messages BOOLEAN DEFAULT true,
  typing_indicators BOOLEAN DEFAULT false,

  -- Social
  taps_and_matches BOOLEAN DEFAULT true,
  profile_views BOOLEAN DEFAULT false,
  new_favorites BOOLEAN DEFAULT true,

  -- Discovery
  eros_suggestions BOOLEAN DEFAULT true,
  nearby_alerts BOOLEAN DEFAULT false,

  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',

  -- Sound & Vibration
  sound_enabled BOOLEAN DEFAULT true,
  sound_type TEXT DEFAULT 'sltr_ping',
  vibration_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id)
);

-- In-app notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'tap', 'view', 'favorite', 'eros', 'video', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

---

## 7. API Endpoints

```typescript
// GET /api/notifications/preferences
// Returns user's notification preferences

// PUT /api/notifications/preferences
// Body: Partial<NotificationPreferences>
// Updates preferences

// GET /api/notifications?page=1&limit=20
// Returns paginated notification list

// PUT /api/notifications/:id/read
// Mark single notification as read

// PUT /api/notifications/read-all
// Mark all as read

// DELETE /api/notifications/:id
// Delete notification

// GET /api/notifications/unread-count
// Returns { count: number }
```

---

## 8. User Flow Diagrams

### 8.1 Permission Request Trigger Logic

```
User Opens App
     │
     ▼
Check localStorage: promptDismissed?
     │
     ├── Yes (< 24h ago) ──► Skip prompt
     │
     └── No
         │
         ▼
     Check Notification.permission
         │
         ├── 'granted' ──► Done (already enabled)
         │
         ├── 'denied' ──► Show "blocked" help UI
         │
         └── 'default'
              │
              ▼
         Wait for trigger event:
              │
              ├── Received first message ──► Show contextual prompt
              │
              ├── Got first tap/match ──► Show match prompt
              │
              ├── Viewed empty inbox ──► Show discovery prompt
              │
              └── 5 min + 3 interactions ──► Show general prompt
```

### 8.2 Notification Delivery Flow

```
Event Occurs (new message, tap, etc.)
     │
     ▼
Check user preferences
     │
     ├── Type disabled? ──► Skip
     │
     ├── Quiet hours active? ──► Queue for later
     │
     └── Allowed
         │
         ▼
     User in app?
         │
         ├── Yes ──► In-app notification (toast + center)
         │
         └── No ──► Push notification
                    │
                    ▼
               Save to notifications table
               (for notification center)
```

---

## 9. Accessibility

### 9.1 Requirements
- Toggle controls must have proper ARIA labels
- Notification items must be keyboard navigable
- Badge must announce count to screen readers
- Toast notifications must use aria-live="polite"

### 9.2 Example ARIA
```html
<button
  aria-label="Notifications, 5 unread"
  aria-haspopup="true"
  aria-expanded="false"
>
  <span aria-hidden="true">🔔</span>
  <span class="badge" aria-label="5 unread notifications">5</span>
</button>

<div role="switch" aria-checked="true" aria-label="New message notifications">
  <span>New Messages</span>
</div>
```

---

## 10. Implementation Checklist

### Phase 1: Permission Flow Optimization
- [ ] Refactor NotificationPrompt with trigger-based logic
- [ ] Add contextual variants (message, tap, inbox)
- [ ] Implement 24-hour dismiss cooldown
- [ ] Add "blocked" state recovery UI

### Phase 2: Notification Preferences
- [ ] Create notification_preferences table
- [ ] Build NotificationSettings component
- [ ] Add settings to /settings page
- [ ] Implement preference-based delivery filtering

### Phase 3: Notification Center
- [ ] Create notifications table
- [ ] Build NotificationCenter component
- [ ] Add header bell icon with badge
- [ ] Implement real-time updates (Supabase Realtime)
- [ ] Add grouping logic for views/taps

### Phase 4: Polish
- [ ] Custom sounds implementation
- [ ] Quiet hours scheduling
- [ ] Nearby alerts integration
- [ ] Analytics for opt-in rates

---

## 11. Handoff Notes

### Files to Create/Modify
```
src/components/
├── NotificationPrompt.tsx    # Redesign existing
├── NotificationSettings.tsx  # New
├── NotificationCenter.tsx    # New
├── NotificationBadge.tsx     # New
└── NotificationItem.tsx      # New

src/hooks/
├── useNotifications.ts       # Modify existing
└── useNotificationPrefs.ts   # New

src/app/settings/
└── notifications/
    └── page.tsx              # New settings page
```

### Key Behaviors
1. **Contextual prompts**: Trigger on meaningful events, not immediately
2. **Granular control**: Let users choose exactly what they want
3. **Non-intrusive**: Respect quiet hours, allow full disable
4. **History**: Keep notification center for missed items

---

**Design Status:** Ready for Frontend Development
**Estimated Dev Time:** 2-3 days
**Review Required:** Product Manager
