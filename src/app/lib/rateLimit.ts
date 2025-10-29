import { redis } from './redis';

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

export async function checkRateLimit(
  key: string,
  limit: number = maxPerWindow,
  windowInMs: number = windowMs
): Promise<{ ok: boolean; remaining: number; resetMs: number }> {
  const windowKey = `rl:${key}`;
  const ttlKey = `${windowKey}:ttl`;
  // Increment counter and set expiry if new
  const count = await redis.incr(windowKey);
  if (count === 1) {
    await redis.pexpire(windowKey, windowInMs);
    const resetMs = Date.now() + windowInMs;
    await redis.psetex(ttlKey, windowInMs, String(resetMs));
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


