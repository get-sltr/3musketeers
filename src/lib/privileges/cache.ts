/**
 * SLTR Privilege System - High-Performance Caching Layer
 * Designed for 100,000+ concurrent users
 *
 * Strategy:
 * - Redis cache for hot data (subscription status)
 * - In-memory cache for ultra-fast lookups
 * - Database only as fallback
 * - Automatic cache invalidation on subscription changes
 */

import { Redis } from '@upstash/redis'
import { Profile } from './types'

// ==================== MULTI-TIER CACHE ====================

// Tier 1: In-memory cache (fastest, 0ms latency)
// Stores last 10,000 active users
const MAX_MEMORY_CACHE_SIZE = 10000
const MEMORY_CACHE_TTL = 60 * 1000 // 1 minute

interface MemoryCacheEntry {
  data: Profile
  timestamp: number
}

class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number

  constructor(maxSize: number) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  delete(key: K): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }
}

const memoryCache = new LRUCache<string, MemoryCacheEntry>(MAX_MEMORY_CACHE_SIZE)

// Tier 2: Redis cache (fast, ~1-5ms latency)
// Upstash Redis for serverless
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    })
  : null

const REDIS_TTL = 300 // 5 minutes
const REDIS_PREFIX = 'sltr:profile:'

// ==================== CACHE OPERATIONS ====================

/**
 * Get profile from cache (memory → Redis → database)
 * Ultra-fast for 100k+ concurrent users
 */
export async function getCachedProfile(
  userId: string,
  fetchFn: () => Promise<Profile | null>
): Promise<Profile | null> {
  // Tier 1: Check memory cache (0ms)
  const memoryCached = memoryCache.get(userId)
  if (memoryCached) {
    const age = Date.now() - memoryCached.timestamp
    if (age < MEMORY_CACHE_TTL) {
      return memoryCached.data
    }
    memoryCache.delete(userId)
  }

  // Tier 2: Check Redis cache (~1-5ms)
  if (redis) {
    try {
      const redisCached = await redis.get<Profile>(`${REDIS_PREFIX}${userId}`)
      if (redisCached) {
        // Store in memory cache for next time
        memoryCache.set(userId, {
          data: redisCached,
          timestamp: Date.now(),
        })
        return redisCached
      }
    } catch (err) {
      console.error('Redis cache error:', err)
      // Continue to database if Redis fails
    }
  }

  // Tier 3: Fetch from database (~10-50ms)
  const profile = await fetchFn()
  if (profile) {
    // Store in both caches
    setCachedProfile(userId, profile)
  }

  return profile
}

/**
 * Store profile in all cache tiers
 */
export function setCachedProfile(userId: string, profile: Profile): void {
  // Memory cache
  memoryCache.set(userId, {
    data: profile,
    timestamp: Date.now(),
  })

  // Redis cache (async, non-blocking)
  if (redis) {
    redis
      .setex(`${REDIS_PREFIX}${userId}`, REDIS_TTL, JSON.stringify(profile))
      .catch((err) => console.error('Redis set error:', err))
  }
}

/**
 * Invalidate cache when subscription changes
 * Call this after user upgrades/downgrades
 */
export function invalidateProfileCache(userId: string): void {
  memoryCache.delete(userId)

  if (redis) {
    redis
      .del(`${REDIS_PREFIX}${userId}`)
      .catch((err) => console.error('Redis delete error:', err))
  }
}

/**
 * Batch invalidate multiple users (e.g., expired subscriptions)
 */
export async function batchInvalidateCache(userIds: string[]): Promise<void> {
  // Clear memory cache
  userIds.forEach((id) => memoryCache.delete(id))

  // Clear Redis cache in batch
  if (redis && userIds.length > 0) {
    try {
      const keys = userIds.map((id) => `${REDIS_PREFIX}${id}`)
      await redis.del(...keys)
    } catch (err) {
      console.error('Redis batch delete error:', err)
    }
  }
}

// ==================== RATE LIMITING CACHE ====================
// Prevent abuse during high traffic

const rateLimitCache = new Map<string, number[]>()

/**
 * Check if user is rate limited
 * Returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const userRequests = rateLimitCache.get(userId) || []

  // Remove old requests outside the window
  const recentRequests = userRequests.filter((timestamp) => now - timestamp < windowMs)

  if (recentRequests.length >= maxRequests) {
    return false // Rate limited
  }

  // Add current request
  recentRequests.push(now)
  rateLimitCache.set(userId, recentRequests)

  return true // Allowed
}

/**
 * Clear rate limit cache periodically
 * Call this every 5 minutes to prevent memory leaks
 */
export function clearOldRateLimits(): void {
  const now = Date.now()
  const fiveMinutesAgo = now - 5 * 60 * 1000

  for (const [userId, timestamps] of rateLimitCache.entries()) {
    const recentRequests = timestamps.filter((ts) => now - ts < 60000)
    const lastRequest = recentRequests[recentRequests.length - 1]
    if (recentRequests.length === 0 || (lastRequest && lastRequest < fiveMinutesAgo)) {
      rateLimitCache.delete(userId)
    } else {
      rateLimitCache.set(userId, recentRequests)
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(clearOldRateLimits, 5 * 60 * 1000)
}

// ==================== STATS & MONITORING ====================

export function getCacheStats() {
  return {
    memoryCacheSize: memoryCache['cache'].size,
    maxMemoryCacheSize: MAX_MEMORY_CACHE_SIZE,
    rateLimitCacheSize: rateLimitCache.size,
    redisEnabled: redis !== null,
  }
}
