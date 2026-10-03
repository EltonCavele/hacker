import { vi } from "vitest";

/** Standard mock of the Redis client behind the rate limiter: `allow()` lets requests through, `block()` rejects them. */
export const redisEval = vi.fn();

export const redisMock = { redis: { eval: redisEval, ping: vi.fn() } };

export function allowRateLimit() {
  redisEval.mockResolvedValue([1, 60]);
}

export function blockRateLimit(retryAfterSeconds = 30) {
  redisEval.mockResolvedValue([999, retryAfterSeconds]);
}

export const user = { id: "11111111-1111-4111-8111-111111111111", email: "ana@example.com", name: "Ana" };

export const session = { user: { ...user, onboardedAt: new Date() }, session: { id: "s1" } };

export function jsonRequest(url: string, body: unknown, init: RequestInit = {}) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });
}
