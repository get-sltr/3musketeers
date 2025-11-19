# User Experience - Privilege System

## Visual Flow: Free User Tries Video Call

### Step 1: User Sees Button
```
┌────────────────────────────────────┐
│  Conversation with @JohnDoe       │
├────────────────────────────────────┤
│  Messages here...                  │
│                                    │
│  [🔒 Video Call (Plus)]  [Send]   │
│      ↑                             │
│      Locked icon shows it's Plus   │
└────────────────────────────────────┘
```

### Step 2: User Clicks Button
```
┌────────────────────────────────────┐
│         🔒 MODAL APPEARS           │
├────────────────────────────────────┤
│                                    │
│              📹                    │
│                                    │
│      Upgrade to SLTR Plus          │
│                                    │
│  Video Calls is available          │
│  exclusively for SLTR Plus members │
│                                    │
│  SLTR Plus includes:               │
│  ✓ Unlimited Profile Views         │
│  ✓ Video Calls                     │
│  ✓ Groups & Channels               │
│  ✓ Travel Mode                     │
│  ✓ Unlimited DTFN                  │
│  ✓ Ad-Free Experience              │
│                                    │
│         $4.99                      │
│        per month                   │
│                                    │
│   [  Upgrade Now  ]                │
│   [  Maybe Later  ]                │
│                                    │
└────────────────────────────────────┘
```

### Step 3A: User Clicks "Upgrade Now"
```
Redirects to: /sltr-plus

┌────────────────────────────────────┐
│          sltr∝                     │
├────────────────────────────────────┤
│                                    │
│           $4.99                    │
│          per month                 │
│                                    │
│  Simple. Transparent. Cancel       │
│  anytime.                          │
│                                    │
│  Here's everything you'll get...   │
│                                    │
│  🔓 Unlimited Profile Views        │
│  👁️ See Who Viewed Your Profile    │
│  💬 Unlimited Messaging            │
│  🚫 Ad-Free Experience             │
│  ⚡ Priority DTFN Badge            │
│  ... (all 15 features)             │
│                                    │
│  [      Continue →      ]          │
│                                    │
└────────────────────────────────────┘
```

### Step 3B: User Clicks "Maybe Later"
```
Modal closes, stays on conversation screen
No video call initiated
```

---

## Detailed Messages by Feature

### 1. Video Calls

**Button Text (Free):**
```
🔒 Video Call (Plus)
```

**Modal Title:**
```
Upgrade to SLTR Plus
```

**Modal Message:**
```
Video Calls is available exclusively for SLTR Plus members.
```

**API Response (if bypassed):**
```json
{
  "error": "Plus subscription required",
  "message": "This feature requires SLTR Plus",
  "feature": "video_calls",
  "upgrade_url": "/sltr-plus"
}
```

---

### 2. Create Groups

**Button Text (Free):**
```
🔒 Create Group (Plus)
```

**Modal Title:**
```
Upgrade to SLTR Plus
```

**Modal Message:**
```
Create Groups is available exclusively for SLTR Plus members.
```

**What Happens:**
- User clicks "Create Group" button
- Modal pops up (doesn't open create form)
- Shows upgrade options

---

### 3. Travel Mode

**Toggle Label (Free):**
```
✈️ Travel Mode
   Plus only          [🔒 Plus]
```

**Modal Title:**
```
Upgrade to SLTR Plus
```

**Modal Message:**
```
Travel Mode is available exclusively for SLTR Plus members.
```

**What Happens:**
- Toggle button shows 🔒 and is slightly grayed out
- Clicking it shows upgrade modal
- Toggle doesn't actually change state

---

### 4. DTFN Badge (4 Times Limit)

**Before First Use:**
```
DTFN Badge                [OFF]
4 activations remaining
```

**After 1st Activation:**
```
DTFN Badge                [ON]
3 activations remaining

✅ DTFN activated! 3 uses remaining
```

**After 4th Activation (Last One):**
```
DTFN Badge                [ON]
0 activations remaining

✅ DTFN activated! This was your last free activation
```

**Trying to Activate 5th Time:**

Modal appears:
```
┌────────────────────────────────────┐
│      Unlimited DTFN                │
├────────────────────────────────────┤
│                                    │
│ Free users get 4 DTFN activations. │
│ Upgrade to SLTR Plus for unlimited │
│ DTFN!                              │
│                                    │
│ You've used: 4/4 activations       │
│                                    │
│         $4.99                      │
│        per month                   │
│                                    │
│   [  Upgrade Now  ]                │
│   [  Maybe Later  ]                │
│                                    │
└────────────────────────────────────┘
```

---

## Color Scheme (Matching SLTR Design)

```tsx
// All modals use SLTR colors:

Background:        bg-black
Border:           border-lime-400/20
Title:            text-white
Message:          text-white/60
Features list:    text-lime-400 (checkmarks)
Price:            text-lime-400 (large)
Upgrade button:   bg-lime-400 text-black (glowing)
Maybe Later:      bg-white/5 text-white/60
```

**Button Glow Effect:**
```css
box-shadow: 0 0 30px rgba(204, 255, 0, 0.3)
```

---

## Toast Notifications

### Success Messages

```tsx
// After upgrading
toast.success('Welcome to SLTR Plus! All features unlocked 🎉')

// After activating DTFN (free user)
toast.success('DTFN activated! 2 activations remaining')

// After activating DTFN (Plus user)
toast.success('DTFN activated! Unlimited with Plus ∝')
```

### Error Messages

```tsx
// Rate limit exceeded
toast.error('Slow down! Too many requests')

// Subscription expired
toast.error('Your SLTR Plus subscription has expired')

// API error
toast.error('Failed to activate feature. Please try again')
```

---

## How Users Know They're Plus

### 1. Profile Badge
```tsx
<span className="inline-flex items-center gap-1 text-lime-400">
  SLTR Plus
  <span style={{ verticalAlign: 'super', fontSize: '0.7em' }}>∝</span>
</span>
```

### 2. Feature Buttons (No Lock Icons)
```
📹 Video Call    (instead of 🔒 Video Call (Plus))
```

### 3. DTFN Status
```
DTFN Badge                [ON]
Unlimited (Plus)
```

### 4. Settings Screen
```
┌────────────────────────────────────┐
│  Account Settings                  │
├────────────────────────────────────┤
│                                    │
│  Subscription: SLTR Plus ∝         │
│  Status: Active                    │
│  Renews: Dec 19, 2025              │
│                                    │
│  [ Manage Subscription ]           │
│                                    │
└────────────────────────────────────┘
```

---

## Complete User Journey

### Free User → Plus User

```
1. Sees locked feature (🔒 icon)
   ↓
2. Clicks on locked feature
   ↓
3. Modal appears with:
   - Feature name
   - "Plus only" message
   - List of Plus benefits
   - $4.99/month price
   ↓
4. Clicks "Upgrade Now"
   ↓
5. Redirected to /sltr-plus
   ↓
6. Reviews all features
   ↓
7. Clicks "Continue"
   ↓
8. Payment screen (Stripe)
   ↓
9. Completes payment
   ↓
10. ✅ Subscription activated
   ↓
11. Cache invalidated
   ↓
12. Returns to app
   ↓
13. All features unlocked!
```

---

## Backend Messages (API Responses)

### 401 Unauthorized (Not Logged In)
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden (Plus Required)
```json
{
  "error": "Plus subscription required",
  "message": "This feature requires SLTR Plus",
  "feature": "video_calls",
  "upgrade_url": "/sltr-plus"
}
```

### 429 Rate Limited
```json
{
  "error": "Daily limit reached for basic_messaging",
  "feature": "basic_messaging",
  "remaining": 0,
  "limit": 50,
  "upgrade_url": "/sltr-plus"
}
```

### 200 Success (Plus User)
```json
{
  "success": true,
  "roomId": "call-user1-user2",
  "message": "Video call room created"
}
```

---

## Accessibility

All modals include:
- ✅ Proper ARIA labels
- ✅ Keyboard navigation (ESC to close)
- ✅ Focus trap (can't tab out of modal)
- ✅ Screen reader announcements
- ✅ High contrast mode support

```tsx
<div
  role="dialog"
  aria-labelledby="upgrade-title"
  aria-describedby="upgrade-description"
  aria-modal="true"
>
  <h2 id="upgrade-title">Upgrade to SLTR Plus</h2>
  <p id="upgrade-description">
    Video Calls is available exclusively for SLTR Plus members.
  </p>
</div>
```

---

## Summary

**Free users see:**
- 🔒 Lock icons on Plus features
- Clear "(Plus)" labels
- Beautiful upgrade modals
- Countdown of remaining uses (DTFN)
- Smooth, non-frustrating experience

**Plus users see:**
- No lock icons
- All features unlocked
- "SLTR Plus ∝" badge
- "Unlimited" status
- Premium experience

**Everyone gets:**
- Clear, honest messaging
- No dark patterns
- Easy upgrade path
- Consistent design
- Fast performance (100k+ users)
