import "server-only";

import { getClientIp } from "./client-ip";
import { logger } from "./logger";
import { redis } from "./redis/client";

export { getClientIp };

export type RateLimitRule = { limit: number; windowSeconds: number };
export type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

// Fixed window done atomically on the Redis side so concurrent requests cannot all pass a stale read.
const CONSUME_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then redis.call("EXPIRE", KEYS[1], ARGV[1]) end
local ttl = redis.call("TTL", KEYS[1])
if ttl < 0 then redis.call("EXPIRE", KEYS[1], ARGV[1]) ttl = tonumber(ARGV[1]) end
return { count, ttl }
`;

/**
 * Counts one request against `key`. Fails open when Redis is unavailable: a cache outage must not take the
 * whole API down, and the failure is logged so it shows up in monitoring.
 */
export async function consumeRateLimit(key: string, { limit, windowSeconds }: RateLimitRule): Promise<RateLimitResult> {
  try {
    const [count, ttl] = (await redis.eval(CONSUME_SCRIPT, 1, `rl:${key}`, windowSeconds)) as [number, number];
    return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: Math.max(1, ttl) };
  } catch (error) {
    logger.error({ err: error, key }, "Rate limiter unavailable; allowing request");
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Rate-limit storage in the shape Better Auth expects, so auth endpoints share the same Redis counters. */
export const betterAuthRateLimitStorage = {
  async consume(key: string, rule: { window: number; max: number }) {
    const result = await consumeRateLimit(`auth:${key}`, { limit: rule.max, windowSeconds: rule.window });
    return { allowed: result.allowed, retryAfter: result.allowed ? null : result.retryAfterSeconds };
  },
};

/**
 * Enforces `rule` for `identifier` (a user id for authenticated routes, `getClientIp(request)` for public ones).
 * Returns a 429 response to send back, or null when the request may proceed.
 */
export async function enforceRateLimit(
  scope: string,
  identifier: string,
  rule: RateLimitRule,
): Promise<Response | null> {
  const result = await consumeRateLimit(`${scope}:${identifier}`, rule);
  if (result.allowed) return null;
  return Response.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds), "Cache-Control": "no-store" },
    },
  );
}

/** Reasonable defaults, tuned per kind of route. */
export const RATE_LIMITS = {
  /** Authenticated mutations (checkout, upload URLs, push subscriptions). */
  userWrite: { limit: 30, windowSeconds: 60 },
  /** Expensive or abuse-prone user actions (checkout creation, test pushes). */
  userSensitive: { limit: 5, windowSeconds: 60 },
  /** Authenticated reads. */
  userRead: { limit: 120, windowSeconds: 60 },
  /** Public webhooks from payment/messaging providers (keyed by IP). */
  webhook: { limit: 300, windowSeconds: 60 },
  /** Public, unauthenticated reads. */
  publicRead: { limit: 60, windowSeconds: 60 },
  /** Secret-protected maintenance endpoints. */
  internal: { limit: 10, windowSeconds: 60 },
} satisfies Record<string, RateLimitRule>;
