# EROS Scaling Strategy: Prevent System Overload

## Philosophy
EROS is designed to **never overload the system**, even at massive scale. The architecture grows gracefully with user base, not exponentially.

## Current State (Few Users)
- Phase 1 (10-30 min idle): 5% CPU → ~15 users at a time
- Phase 2 (30-60 min idle): 15% CPU → ~75 users at a time
- Phase 3 (60+ min idle): 80-100% CPU → ~250 users at a time
- **Total system impact: Minimal, background only**

## Growth Phases

### Phase A: 1K - 10K Users
- User base grows, idle users grow
- Phase 1 jobs: 15 users → still 5% CPU (no change)
- Phase 2 jobs: 75 users → still 15% CPU (no change)
- Phase 3 jobs: 250 users → still 80-100% CPU (no change)
- **CPU usage: CONSTANT**, not proportional to user count
- Scaling: Add worker processes (horizontal scaling)
- Cost: Linear, not exponential

### Phase B: 10K - 100K Users
- Need: Multiple worker instances (load balanced)
- Each worker pool processes independently
- CPU allocation per instance: Still fixed percentages
- **System load: Predictable and capped**
- Infrastructure: Multi-server deployment
- Cost: Linear, predictable

### Phase C: 100K - 1M Users
- Database becomes bottleneck, not CPU
- Solution: Database read replicas, caching layer expansion
- EROS workers: Same CPU allocation (independent)
- Recommendation: Distribute across regions
- Cost: Database scaling, not EROS workers

### Phase D: 1M+ Users
- Distributed architecture:
  - Region 1: Workers + Activity Tracker + Caching
  - Region 2: Workers + Activity Tracker + Caching
  - Region N: Same setup
- Central database with replication
- Each region operates independently
- **EROS never overloads any single system**

## Key Guarantees

### CPU Never Exceeds
- Active phase: 0% (no background work)
- Phase 1: 5% per batch
- Phase 2: 15% per batch
- Phase 3: 100% (intentional, users are asleep)
- Multiple batches run sequentially, not parallel
- **Hard cap: Always leaves 5% headroom**

### Memory Never Explodes
- Activity tracker: O(n) = ~1KB per active user
  - 1M users = ~1GB memory (linear)
  - Stale cleanup every 5 minutes
- Worker jobs: Batch processing, not batch storage
- Redis cache: Pre-computed results (24h TTL)
  - Automatic eviction when memory limits hit
  - Size: Independent of user count (same matches per user)

### Database Never Chokes
- Writes: Only when user idle 10+ min (sparse, not frequent)
- Reads: Query for pending jobs (indexed, fast)
- Design: Job queue with status filtering
- Optimization: Batch processing, not individual queries
- Cost: Reads/writes scale linearly with idle users, not total users

## Scaling Checklist

### 1K Users
- [ ] Monitor CPU usage on phase 3 jobs
- [ ] Verify halt response time (should be < 500ms)
- [ ] Check memory usage of activity tracker
- [ ] Test database query performance

### 10K Users
- [ ] Add 2nd worker process (load balance)
- [ ] Implement Redis caching layer
- [ ] Set up database monitoring/alerts
- [ ] Test graceful failover

### 100K Users
- [ ] Shard database (by region or user ID range)
- [ ] Implement read replicas
- [ ] Deploy to multiple servers
- [ ] Add observability/metrics

### 1M Users
- [ ] Multi-region deployment
- [ ] Database replication across regions
- [ ] Distribute worker pools
- [ ] Independent activity trackers per region
- [ ] Central monitoring/dashboards

## No "Noisy Neighbor" Problem

With traditional batch processing:
- All 100K users analyzed daily = **constant CPU load** ❌
- Creates predictable spikes, strains infrastructure ❌

With EROS inactivity-based approach:
- Only idle users processed = **dynamic load** ✅
- Scales with inactivity, not user count ✅
- Peak matching load at night (when servers idle) ✅
- System never overloaded during peak hours ✅

## Resource Prediction Formula

```
CPU Usage = (Phase1Count * 5%) + (Phase2Count * 15%) + (Phase3Count * 100%)

Where:
  Phase1Count = Users idle 10-30 min
  Phase2Count = Users idle 30-60 min
  Phase3Count = Users idle 60+ min

Example: 100K users, all sleeping (phase 3)
  = 100K * 100% = 100K CPU units? NO.
  = Worker batches of 250 users × 100% = CONSTANT 100% CPU

Workers are POOLS, not individual processes per user.
```

## Memory Prediction Formula

```
Memory = (ActiveUsers * 1KB) + (CachedMatches * 50KB)

Where:
  ActiveUsers = Tracked by activity tracker
  CachedMatches = Pre-computed, fixed size per user

Example: 1M users
  = (10K active * 1KB) + (1M matches * 50KB) = ~50GB
  Not linear to 1M, but to "active" and "cached"
```

## The Golden Rule

**EROS processing load is determined by USER INACTIVITY, not USER COUNT.**

- If all users active 24/7 = 0% CPU used
- If all users sleep 6 hours = Background processing during sleep
- If users have normal patterns = Balanced load, never peak

This makes EROS **infinitely scalable** without system harm.
