import "server-only";

import { redis } from "@/lib/redis/client";

export async function getOrSet<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;
  } catch {
    // Redis is an optimization; a cache outage should not block the source read.
  }

  const value = await load();
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Return the source value even when the cache cannot be updated.
  }
  return value;
}

export async function invalidateCache(key: string) {
  try {
    await redis.del(key);
  } catch {
    // Cache entries still expire by TTL if Redis is unavailable.
  }
}
