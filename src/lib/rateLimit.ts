import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Rate limiter using Upstash Redis
 * @param identifier - User ID or IP address
 * @param limit - Maximum requests allowed
 * @param window - Time window in seconds
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 60
): Promise<RateLimitResult> {
  // Fallback to in-memory if Redis not configured
  if (!redis) {
    console.warn('⚠️ Upstash Redis not configured, using in-memory rate limiting')
    return inMemoryRateLimit(identifier, limit, window)
  }

  const key = `rate_limit:mapbox_token:${identifier}`
  const now = Date.now()
  const windowMs = window * 1000

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, now - windowMs)
    
    // Count current requests
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    
    // Set expiration
    pipeline.expire(key, window)
    
    const results = await pipeline.exec()
    const count = results[1] as number

    const remaining = Math.max(0, limit - count)
    const reset = now + windowMs

    if (count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset,
      }
    }

    return {
      success: true,
      limit,
      remaining,
      reset,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if Redis fails
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    }
  }
}

// In-memory fallback rate limiter
const memoryStore = new Map<string, { count: number; reset: number }>()

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  window: number
): RateLimitResult {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const record = memoryStore.get(key)

  if (!record || now > record.reset) {
    // Reset window
    memoryStore.set(key, {
      count: 1,
      reset: now + window * 1000,
    })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + window * 1000,
    }
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.reset,
    }
  }

  record.count++
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.reset,
  }
}

