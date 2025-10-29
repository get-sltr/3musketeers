// Lazy import to prevent build-time evaluation
let RedisClass: any = null;
let redisInstance: any = null;

// Lazily create the client to avoid build-time env evaluation
export function getRedis(): any {
  // Only import Redis at runtime, not during build
  if (typeof window !== 'undefined') return null; // Client-side safety check
  
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  
  // Return cached instance if already created
  if (redisInstance) return redisInstance;
  
  // Dynamic import at runtime using require (works in Next.js server context)
  try {
    if (!RedisClass) {
      RedisClass = require('@upstash/redis').Redis;
    }
    redisInstance = new RedisClass({ url, token });
    return redisInstance;
  } catch (e) {
    // Redis package not available (e.g., during build or package missing)
    return null;
  }
}


