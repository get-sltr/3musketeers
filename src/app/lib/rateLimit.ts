// NO top-level imports to prevent build-time analysis
// Redis is imported lazily inside the function

const windowMs = 60_000; // 1 minute
const maxPerWindow = 100; // default: 100 requests per minute per client

export function getClientIdFromRequest(request: Request): string {
  const hdr = (name: string) => request.headers.get(name);
  return (
    hdr('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdr('cf-connecting-ip') ||
    hdr('x-real-ip') ||
    'unknown'
  );
}

// In-memory fallback for local/dev or missing env during build
type WindowRecord = { windowStartMs: number; tokensUsed: number };
const memStore = new Map<string, WindowRecord>();

export async function checkRateLimit(
  key: string,
  limit: number = maxPerWindow,
  windowInMs: number = windowMs
): Promise<{ ok: boolean; remaining: number; resetMs: number }> {
  // Lazy import Redis module only at runtime, not during build
  let redis: any = null;
  try {
    const redisModule = await import('./redis');
    redis = redisModule.getRedis();
  } catch (error) {
    // Redis module unavailable during build - use fallback
    redis = null;
  }
  if (redis) {
    const windowKey = `rl:${key}`;
    // Increment counter and set expiry if new
    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.pexpire(windowKey, windowInMs);
      const resetMs = Date.now() + windowInMs;
      return { ok: true, remaining: limit - 1, resetMs };
    }

    // Get remaining TTL to compute reset timestamp
    const ttlMs = await redis.pttl(windowKey);
    const resetMs = Date.now() + Math.max(0, ttlMs ?? 0);

    if (count <= limit) {
      return { ok: true, remaining: limit - count, resetMs };
    }
    return { ok: false, remaining: 0, resetMs };
  }

  // Fallback: simple in-memory window counter
  const now = Date.now();
  const current = memStore.get(key);
  if (!current || now - current.windowStartMs >= windowInMs) {
    memStore.set(key, { windowStartMs: now, tokensUsed: 1 });
    return { ok: true, remaining: limit - 1, resetMs: now + windowInMs };
  }
  if (current.tokensUsed < limit) {
    current.tokensUsed += 1;
    return { ok: true, remaining: limit - current.tokensUsed, resetMs: current.windowStartMs + windowInMs };
  }
  return { ok: false, remaining: 0, resetMs: current.windowStartMs + windowInMs };
}


