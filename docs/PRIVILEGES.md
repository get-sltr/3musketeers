# SLTR Privilege System

**Clean, Scalable, Sustainable** user privilege management designed for 100,000+ concurrent users.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SLTR Privilege System                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React)           Backend (API)       Database     │
│  ├─ useHasFeature()        ├─ withPlus()      ├─ RLS        │
│  ├─ useIsPlusSubscriber()  ├─ withFeature()   ├─ Indexes    │
│  ├─ useDTFNLimit()         ├─ requireAuth()   └─ Functions  │
│  └─ UpgradeModal           └─ requireFeature()              │
│                                                              │
│  Caching Layer (Performance)                                 │
│  ├─ Memory Cache (0ms)    - 10,000 users                    │
│  ├─ Redis Cache (1-5ms)   - Unlimited                       │
│  └─ Rate Limiting         - 1000 req/min/user               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Free Tier
- Basic messaging (50/day)
- Profile views (100/day)
- Basic search & filters
- DTFN badge (4 activations lifetime)

### Plus Tier ($4.99/month)
- ✅ Video calls
- ✅ Create groups & channels
- ✅ Travel mode (worldwide)
- ✅ Unlimited DTFN
- ✅ See who viewed you
- ✅ Unlimited messaging
- ✅ Ad-free experience
- ✅ And 10+ more features

## Quick Start

### 1. Frontend - Check Privileges

```tsx
import { useHasFeature } from '@/hooks/usePrivileges'
import UpgradeModal from '@/components/UpgradeModal'

function VideoCallButton() {
  const { allowed, loading } = useHasFeature('video_calls')
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (loading) return <div>Loading...</div>

  if (!allowed) {
    return (
      <>
        <button onClick={() => setShowUpgrade(true)}>
          🔒 Video Call (Plus Only)
        </button>
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature="video_calls"
        />
      </>
    )
  }

  return <button onClick={startVideoCall}>📹 Start Video Call</button>
}
```

### 2. Backend - Protect API Routes

```ts
// src/app/api/video-call/route.ts
import { withFeature } from '@/lib/privileges'
import { NextRequest, NextResponse } from 'next/server'

export const POST = withFeature('video_calls', async (request, { userId }) => {
  // User has video_calls privilege - proceed
  const roomId = await createVideoRoom(userId)

  return NextResponse.json({ roomId })
})
```

### 3. Database - Migration

```bash
# Run the migration
supabase migration up
```

The migration adds:
- `subscription_tier` column
- `subscription_expires_at` column
- Performance indexes
- RLS policies
- Cached database functions

## Usage Examples

### Check if User is Plus

```tsx
import { useIsPlusSubscriber } from '@/hooks/usePrivileges'

function ProfileBadge() {
  const { isPlus } = useIsPlusSubscriber()

  if (isPlus) {
    return <span className="text-lime-400">SLTR Plus ∝</span>
  }

  return <span className="text-white/60">Free</span>
}
```

### DTFN Limit Check

```tsx
import { useDTFNLimit } from '@/hooks/usePrivileges'

function DTFNToggle() {
  const { limit, activateDTFN } = useDTFNLimit()

  const handleToggle = async () => {
    if (!limit?.canActivate) {
      // Show upgrade modal
      return
    }

    const success = await activateDTFN()
    if (success) {
      toast.success(`DTFN activated! ${limit.remaining - 1} remaining`)
    }
  }

  return (
    <div>
      <button onClick={handleToggle}>
        {limit?.canActivate ? 'Activate DTFN' : '🔒 Upgrade for Unlimited'}
      </button>
      {!limit?.canActivate && limit?.remaining !== -1 && (
        <p className="text-sm text-white/60">
          Used {limit?.activationsUsed}/4 activations
        </p>
      )}
    </div>
  )
}
```

### Multiple Middleware Options

```ts
// Option 1: Inline check
export async function POST(request: NextRequest) {
  const check = await requirePlus(request)
  if (check instanceof NextResponse) return check

  const { userId } = check
  // ... your code
}

// Option 2: Wrapper (cleaner)
export const POST = withPlus(async (request, { userId }) => {
  // User is Plus - proceed
  return NextResponse.json({ success: true })
})

// Option 3: Specific feature
export const POST = withFeature('travel_mode', async (request, { userId }) => {
  // User has travel_mode access
  return NextResponse.json({ success: true })
})
```

## Performance Optimization

### Multi-Tier Caching

```
User Request
     ↓
Memory Cache (0ms) ────────→ Hit? Return immediately
     ↓ Miss
Redis Cache (1-5ms) ───────→ Hit? Store in memory, return
     ↓ Miss
Database (10-50ms) ────────→ Store in Redis + memory, return
```

### Cache Invalidation

```ts
import { invalidateProfileCache } from '@/lib/privileges'

// After user upgrades
async function handleUpgrade(userId: string) {
  await upgradeUserToPlus(userId)

  // Clear cache so next request gets fresh data
  invalidateProfileCache(userId)
}
```

### Rate Limiting

Built-in rate limiting prevents abuse:
- **1000 requests/minute per user**
- Automatic cleanup of old entries
- No external dependencies

## Database Optimization

### Indexes Created

```sql
-- Subscription tier (partial index for Plus users only)
CREATE INDEX idx_profiles_subscription_tier
ON profiles(subscription_tier)
WHERE subscription_tier = 'plus';

-- Composite index for privilege checks
CREATE INDEX idx_profiles_id_subscription
ON profiles(id, subscription_tier, subscription_expires_at);

-- DTFN activations
CREATE INDEX idx_dtfn_user_active
ON dtfn_activations(user_id, activated_at)
WHERE deactivated_at IS NULL;
```

### Cached Functions

```sql
-- Check if subscription is active (STABLE = cacheable)
SELECT is_subscription_active('user-id-here');

-- Check DTFN limit
SELECT * FROM check_dtfn_limit('user-id-here');
```

## Monitoring & Stats

```ts
import { getCacheStats } from '@/lib/privileges'

// Get cache statistics
const stats = getCacheStats()
console.log(stats)
// {
//   memoryCacheSize: 8432,
//   maxMemoryCacheSize: 10000,
//   rateLimitCacheSize: 1203,
//   redisEnabled: true
// }
```

## Adding New Features

1. **Add to types** (`src/lib/privileges/types.ts`)

```ts
export type Feature =
  | 'existing_feature'
  | 'new_feature' // Add here
```

2. **Configure limits** (`src/lib/privileges/config.ts`)

```ts
export const FEATURE_LIMITS: Record<Feature, FeatureLimit> = {
  // ...
  new_feature: {
    feature: 'new_feature',
    tier: 'plus', // or 'free'
    limit: 100, // optional
    period: 'day', // optional
  },
}
```

3. **Use in components**

```tsx
const { allowed } = useHasFeature('new_feature')
```

4. **Protect API routes**

```ts
export const POST = withFeature('new_feature', async (request, { userId }) => {
  // Protected logic
})
```

## Environment Variables

```env
# Redis (optional but recommended for 100k+ users)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## Troubleshooting

### Cache not working?

Check if Redis env vars are set:
```ts
console.log(process.env.UPSTASH_REDIS_REST_URL) // Should not be undefined
```

### Slow queries?

Run `EXPLAIN ANALYZE` on your queries:
```sql
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE id = 'user-id'
AND subscription_tier = 'plus';
```

Should use index: `idx_profiles_id_subscription`

### Rate limit errors?

Increase limits in `cache.ts`:
```ts
checkRateLimit(userId, 2000, 60000) // 2000 req/min
```

## Best Practices

✅ **DO:**
- Use hooks in React components
- Use middleware in API routes
- Invalidate cache after subscription changes
- Check rate limits in high-traffic endpoints

❌ **DON'T:**
- Query database directly for privilege checks
- Skip caching for performance
- Hard-code privilege checks
- Bypass API middleware

## Security

- ✅ RLS policies enforce database-level security
- ✅ API middleware protects all routes
- ✅ Rate limiting prevents abuse
- ✅ Type-safe with full TypeScript
- ✅ Cached functions use SECURITY DEFINER

## License

MIT - Part of SLTR application
