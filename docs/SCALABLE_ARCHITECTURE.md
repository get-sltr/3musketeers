# SLTR Scalable Architecture

## Current State (50 users → Target: 50,000+)

### Problems We're Fixing:
1. ❌ Polling for online status (doesn't scale)
2. ❌ WebSocket connections failing (not properly configured)
3. ❌ Inconsistent data models
4. ❌ Quick patches instead of proper solutions

## Scalable Solutions

### 1. Online Status (CLEAN, SUSTAINABLE)

**BAD (current):**
```typescript
// Polling every 30s = 100 users × 2 queries/min = 200 DB calls/min
setInterval(() => updateOnline(), 30000)
```

**GOOD (scalable):**
```typescript
// Use Supabase Presence (built for scale)
// 1 connection per user, broadcast to all
const channel = supabase.channel('presence')
channel.on('presence', { event: 'sync' }, () => {
  const users = channel.presenceState()
  // All online users instantly, 0 extra DB calls
})
```

**Implementation:**
- Use Supabase Presence API (designed for 100k+ concurrent)
- Cache online status in Redis (sub-millisecond reads)
- Batch updates every 5 minutes to database
- No polling needed

### 2. Real-Time System (RELIABLE, SCALABLE)

**Fix WebSocket Issues:**
```typescript
// Enable proper realtime in Supabase dashboard:
// 1. Settings → API → Realtime enabled
// 2. Database → Replication → Enable for 'profiles' table
// 3. Check WebSocket limits (upgrade if needed)
```

**Connection Pool Management:**
```typescript
// Single global connection, multiple subscriptions
class RealtimeService {
  private static connection: RealtimeChannel
  
  static subscribe(table: string, callback: Function) {
    // Reuse connection, add subscription
    // Scales to 1000s of subscriptions on 1 connection
  }
}
```

### 3. Database Design (CLEAN, FUNCTIONAL)

**Standardize Column Names:**
```sql
-- ONE source of truth
ALTER TABLE profiles RENAME COLUMN online TO is_online;

-- All functions return is_online
-- All code uses is_online
-- No more confusion
```

**Indexes for Scale:**
```sql
-- Partial indexes (smaller, faster)
CREATE INDEX idx_profiles_online 
ON profiles(is_online) 
WHERE is_online = true;

-- Composite indexes for common queries
CREATE INDEX idx_profiles_location_online
ON profiles(latitude, longitude, is_online)
WHERE is_online = true;
```

### 4. API Design (SCALABLE)

**Batch Operations:**
```typescript
// BAD: N queries
users.forEach(u => checkOnline(u.id))

// GOOD: 1 query
const onlineUsers = await supabase
  .rpc('get_online_users_batch', { user_ids: [...] })
```

**Caching Layer:**
```typescript
// Redis cache for hot data
const CACHE_TTL = 60 // 1 minute
const online = await redis.get(`user:${id}:online`) 
  || await db.query(...)
```

### 5. Migration Management (SUSTAINABLE)

**Versioned Migrations:**
```bash
# All migrations tracked
supabase/migrations/
  ├── 20251119_v1_initial.sql
  ├── 20251119_v2_favorites.sql
  ├── 20251119_v3_subscriptions.sql
  └── 20251119_v4_standardize_columns.sql
```

**Rollback Support:**
```sql
-- Every migration has rollback
-- migrations/20251119_v4_standardize_columns.sql
BEGIN;
  ALTER TABLE profiles RENAME COLUMN online TO is_online;
COMMIT;

-- migrations/20251119_v4_rollback.sql
BEGIN;
  ALTER TABLE profiles RENAME COLUMN is_online TO online;
COMMIT;
```

## Performance Targets

| Metric | Current | Target (50k users) |
|--------|---------|-------------------|
| API Response | <200ms | <100ms |
| Online Status Update | 30s polling | Real-time (<1s) |
| DB Connections | Per user | Pooled (max 100) |
| Cache Hit Rate | 0% | >90% |

## Implementation Priority

### Phase 1: Fix Foundation (This Week)
1. ✅ Standardize column names (online → is_online)
2. ✅ Fix WebSocket configuration
3. ✅ Remove polling, use Presence API
4. ✅ Add proper indexes

### Phase 2: Optimize (Next Week)
1. Add Redis caching layer
2. Implement connection pooling
3. Batch API operations
4. Add monitoring (Sentry, metrics)

### Phase 3: Scale (Ongoing)
1. Database read replicas
2. CDN for static assets
3. Edge functions for hot paths
4. Horizontal scaling

## Code Standards (Moving Forward)

### Every PR Must Have:
- [ ] **Performance impact considered**
- [ ] **Scales to 10x current users**
- [ ] **Clean, documented code**
- [ ] **Proper error handling**
- [ ] **Migration + rollback scripts**
- [ ] **Tests for critical paths**

### Code Review Checklist:
- Does this scale to 50k users?
- Is there a more efficient approach?
- Are we adding tech debt?
- Can we cache this?
- Do we need an index?

## Monitoring & Alerts

```typescript
// Track everything
Sentry.metrics.gauge('users.online', onlineCount)
Sentry.metrics.timing('db.query.duration', duration)

// Alert on issues
if (dbConnections > 80) alert('Connection pool near limit')
if (responseTime > 500) alert('Slow API response')
```

## Next Steps

1. **Stop Quick Fixes** - No more polling, proper solutions only
2. **Fix WebSockets** - Configure Supabase Realtime properly
3. **Standardize Schema** - Consistent naming everywhere
4. **Add Monitoring** - Know when things break
5. **Document Everything** - Onboard new devs quickly

---

**SLTR is growing. Every line of code matters. Build for scale from day 1.** 🚀
