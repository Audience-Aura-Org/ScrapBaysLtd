import "server-only";

/**
 * Simple in-memory fixed-window rate limiter keyed by IP + bucket.
 * Fine for a single Node process (Hostinger Node.js hosting). If you ever run several
 * instances, swap this for a shared store such as Redis.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  entry.count++;
  return { ok: entry.count <= limit, retryAfter: Math.ceil((entry.reset - now) / 1000) };
}

export function clientIp(headers: Headers) {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown"
  );
}

/** Honeypot filled in, or submitted faster than a human could type: treat as a bot. */
export function looksLikeBot(input: { website?: string; startedAt?: number }) {
  if (input.website && input.website.trim() !== "") return true;
  if (input.startedAt && Date.now() - input.startedAt < 2500) return true;
  return false;
}
