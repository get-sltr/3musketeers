# SLTR Privilege Implementation Guide

## Your Requested Features

1. ✅ Video calls - Plus only
2. ✅ Groups & channels - Plus only
3. ✅ Travel mode - Plus only
4. ✅ DTFN badge - 4 times for free, unlimited for Plus

---

## Step-by-Step Implementation

### 1. Run Database Migration

```bash
cd /Users/lastud/Desktop/3musketeers
supabase migration up
```

This creates:
- `subscription_tier` column on profiles
- `dtfn_activations` table
- Optimized indexes for 100k+ users
- Cached database functions
- RLS policies

---

### 2. Video Calls - Plus Only

**File:** `src/components/VideoCallLocalhost.tsx`

```tsx
import { useHasFeature } from '@/hooks/usePrivileges'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function VideoCallLocalhost({ conversationId, otherUserId, otherUserName, onEndCall }: VideoCallProps) {
  const { allowed, loading } = useHasFeature('video_calls')
  const [showUpgrade, setShowUpgrade] = useState(false)

  // PRIVILEGE CHECK BEFORE INITIALIZING CALL
  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (!allowed) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-white text-xl mb-2">Video Calls</h3>
          <p className="text-white/60 mb-4">Available with SLTR Plus</p>
          <button
            onClick={() => setShowUpgrade(true)}
            className="px-6 py-3 bg-lime-400 text-black rounded-full font-bold"
          >
            Upgrade to SLTR Plus
          </button>
          <UpgradeModal
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
            feature="video_calls"
          />
        </div>
      </div>
    )
  }

  // ✅ User has video_calls privilege - show original component
  // ... rest of your existing code
}
```

**Backend Protection:**

Create `src/app/api/video-call/create/route.ts`:

```ts
import { withFeature } from '@/lib/privileges'
import { NextResponse } from 'next/server'

export const POST = withFeature('video_calls', async (request, { userId }) => {
  // User has video_calls access
  const { otherUserId } = await request.json()

  // Create video room using LiveKit
  const roomId = `call-${userId}-${otherUserId}`

  return NextResponse.json({ roomId })
})
```

---

### 3. Groups & Channels - Plus Only

**File:** `src/app/groups/page.tsx` (line 54)

```tsx
import { useHasFeature } from '@/hooks/usePrivileges'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function GroupsPage() {
  const { allowed: canCreateGroups } = useHasFeature('create_groups')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()

    // ⚠️ PRIVILEGE CHECK
    if (!canCreateGroups) {
      setShowUpgrade(true)
      return
    }

    // ✅ User has create_groups privilege
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('groups')
        .insert({
          title: groupTitle.trim(),
          description: groupDescription.trim() || null,
          created_by: user.id,
        })

      if (error) {
        console.error('Error creating group:', error)
        return
      }

      await loadGroups()
      setShowCreateModal(false)
    } finally {
      setCreating(false)
    }
  }

  return (
    <MobileLayout>
      {/* ... */}

      {/* Create Group Button */}
      <button
        onClick={() => {
          if (!canCreateGroups) {
            setShowUpgrade(true)
          } else {
            setShowCreateModal(true)
          }
        }}
        className="px-6 py-3 bg-lime-400 text-black rounded-full font-bold"
      >
        {canCreateGroups ? 'Create Group' : '🔒 Create Group (Plus)'}
      </button>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="create_groups"
      />
    </MobileLayout>
  )
}
```

**Same for Channels:** `src/app/groups/channels/page.tsx`

---

### 4. Travel Mode - Plus Only

**File:** `src/app/components/MapSessionMenu.tsx` (line 106)

```tsx
import { useHasFeature } from '@/hooks/usePrivileges'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function MapSessionMenu({ travelMode, onToggleTravelMode, ...props }: MapSessionMenuProps) {
  const { allowed: canUseTravelMode } = useHasFeature('travel_mode')
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <div className="fixed top-20 left-4 z-20">
      {/* ... */}

      {/* Travel Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <div>
            <span className="text-sm text-white font-semibold block">Travel Mode</span>
            <span className="text-xs text-white/60">
              {canUseTravelMode ? 'See friends worldwide' : 'Plus only'}
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            // ⚠️ PRIVILEGE CHECK
            if (!canUseTravelMode) {
              setShowUpgrade(true)
              return
            }

            // ✅ User has travel_mode privilege
            onToggleTravelMode(!travelMode)
          }}
          className={`px-3 py-2 rounded-xl text-sm border transition ${
            travelMode
              ? 'bg-amber-500/20 border-amber-400 text-amber-200'
              : canUseTravelMode
              ? 'bg-white/5 border-white/10 text-white/80'
              : 'bg-white/5 border-white/10 text-white/40'
          }`}
          disabled={!canUseTravelMode && !travelMode}
        >
          {canUseTravelMode ? (travelMode ? 'ON' : 'OFF') : '🔒 Plus'}
        </button>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="travel_mode"
      />
    </div>
  )
}
```

---

### 5. DTFN Badge - 4 Times Free, Unlimited Plus

**File:** `src/app/profile/page.tsx` (or wherever DTFN toggle is)

```tsx
import { useDTFNLimit } from '@/hooks/usePrivileges'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

export default function ProfilePage() {
  const { limit, activateDTFN, loading } = useDTFNLimit()
  const [dtfnActive, setDtfnActive] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const handleDTFNToggle = async (newValue: boolean) => {
    if (!newValue) {
      // Turning OFF - always allowed
      setDtfnActive(false)
      await updateDTFN(false)
      return
    }

    // Turning ON - check limit
    if (!limit?.canActivate) {
      // ⚠️ BLOCKED - Show upgrade modal
      setShowUpgrade(true)
      return
    }

    // ✅ Allowed - activate DTFN
    const success = await activateDTFN()
    if (success) {
      setDtfnActive(true)
      await updateDTFN(true)

      // Show remaining uses for free users
      if (limit.remaining !== -1) {
        toast.success(`DTFN activated! ${limit.remaining - 1} uses remaining`)
      }
    }
  }

  return (
    <div>
      {/* DTFN Toggle */}
      <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl">
        <div>
          <h3 className="text-white font-bold">DTFN Badge</h3>
          {limit && limit.remaining !== -1 && (
            <p className="text-xs text-white/60">
              {limit.remaining} activations remaining
            </p>
          )}
          {limit && limit.remaining === -1 && (
            <p className="text-xs text-lime-400">Unlimited (Plus)</p>
          )}
        </div>

        <button
          onClick={() => handleDTFNToggle(!dtfnActive)}
          className={`px-4 py-2 rounded-full ${
            dtfnActive
              ? 'bg-lime-400 text-black'
              : limit?.canActivate
              ? 'bg-white/10 text-white'
              : 'bg-white/5 text-white/40'
          }`}
          disabled={!dtfnActive && !limit?.canActivate}
        >
          {dtfnActive ? 'ON' : limit?.canActivate ? 'OFF' : '🔒 Upgrade'}
        </button>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="dtfn_unlimited"
        title="Unlimited DTFN"
        message="Free users get 4 DTFN activations. Upgrade to SLTR Plus for unlimited DTFN!"
      />
    </div>
  )
}
```

---

## System Architecture Summary

### Performance (100k+ Concurrent Users)

```
┌──────────────────────────────────────────────────────┐
│  User makes request                                  │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  Memory Cache (0ms)                                  │
│  └─ 10,000 most active users cached                  │
└──────────────────────────────────────────────────────┘
                    ↓ (if not found)
┌──────────────────────────────────────────────────────┐
│  Redis Cache (1-5ms)                                 │
│  └─ All active users cached (5min TTL)               │
└──────────────────────────────────────────────────────┘
                    ↓ (if not found)
┌──────────────────────────────────────────────────────┐
│  PostgreSQL Database (10-50ms)                       │
│  └─ Optimized indexes on subscription_tier           │
└──────────────────────────────────────────────────────┘
```

### Three-Layer Protection

```
Frontend          API             Database
   ↓              ↓               ↓
useHasFeature → withFeature → RLS Policy
   ↓              ↓               ↓
UI blocking    API blocking    Data blocking
```

---

## Testing Checklist

- [ ] Free user sees "🔒 Upgrade" on video call button
- [ ] Free user blocked from creating groups (shows modal)
- [ ] Free user blocked from travel mode (shows modal)
- [ ] Free user can activate DTFN 4 times, then blocked
- [ ] Plus user has all features unlocked
- [ ] API returns 403 for unauthorized feature access
- [ ] Cache works (check with `getCacheStats()`)
- [ ] Rate limiting prevents spam (1000 req/min)

---

## Next Steps

1. **Run migration:**
   ```bash
   supabase migration up
   ```

2. **Install dependencies:**
   ```bash
   npm install @upstash/redis
   ```

3. **Add env vars:**
   ```env
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

4. **Test locally:**
   - Create a free user
   - Try accessing Plus features (should block)
   - Upgrade to Plus in database:
     ```sql
     UPDATE profiles SET subscription_tier = 'plus' WHERE id = 'user-id';
     ```
   - Try again (should work)

5. **Deploy:**
   ```bash
   npm run build
   git add .
   git commit -m "Add privilege system"
   git push
   ```

---

## Support

For questions, see:
- **Full docs:** `/docs/PRIVILEGES.md`
- **Code examples:** `/src/lib/privileges/`
- **Migration:** `/supabase/migrations/20251119_add_subscription_privileges.sql`
