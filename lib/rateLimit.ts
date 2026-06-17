/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single-instance deployment. For multi-instance, back this
 * with Redis/Upstash — the interface stays the same.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): {
  success: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  entry.count += 1;
  const success = entry.count <= limit;
  return { success, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
}

// Periodically purge expired entries.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) {
      if (v.resetAt < now) store.delete(k);
    }
  }, 60_000).unref?.();
}
