import { HttpError } from './env.js';

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Best-effort per-instance limiter for cheap endpoints. Expensive endpoints (AI) are also
 * limited against the database, which is shared across instances.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, 'rate_limited', 'Too many requests. Please wait a moment.');
  }
}
