import { describe, expect, it, vi } from "vitest";

const evalMock = vi.hoisted(() => vi.fn());
vi.mock("./redis/client", () => ({ redis: { eval: evalMock } }));

import { betterAuthRateLimitStorage, consumeRateLimit, enforceRateLimit, getClientIp } from "./rate-limit";

const rule = { limit: 3, windowSeconds: 60 };

describe("consumeRateLimit", () => {
  it("allows requests up to the limit and reports what is left", async () => {
    evalMock.mockResolvedValueOnce([1, 60]).mockResolvedValueOnce([3, 41]);
    expect(await consumeRateLimit("k", rule)).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 60 });
    expect(await consumeRateLimit("k", rule)).toEqual({ allowed: true, remaining: 0, retryAfterSeconds: 41 });
  });

  it("blocks once the limit is exceeded and tells when to retry", async () => {
    evalMock.mockResolvedValueOnce([4, 17]);
    expect(await consumeRateLimit("k", rule)).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 17 });
  });

  it("namespaces keys and passes the window to Redis", async () => {
    evalMock.mockResolvedValueOnce([1, 60]);
    await consumeRateLimit("checkout:user-1", rule);
    expect(evalMock).toHaveBeenCalledWith(expect.any(String), 1, "rl:checkout:user-1", 60);
  });

  it("fails open when Redis is down", async () => {
    evalMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    expect((await consumeRateLimit("k", rule)).allowed).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("returns null while under the limit", async () => {
    evalMock.mockResolvedValueOnce([1, 60]);
    expect(await enforceRateLimit("scope", "id", rule)).toBeNull();
  });

  it("returns a 429 with Retry-After when blocked", async () => {
    evalMock.mockResolvedValueOnce([9, 12]);
    const response = await enforceRateLimit("scope", "id", rule);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe("12");
    expect(await response?.json()).toEqual({ error: "Too many requests" });
  });
});

describe("betterAuthRateLimitStorage", () => {
  it("adapts the result to Better Auth's consume contract", async () => {
    evalMock.mockResolvedValueOnce([1, 60]).mockResolvedValueOnce([11, 8]);
    expect(await betterAuthRateLimitStorage.consume("ip:/sign-in", { window: 60, max: 10 })).toEqual({
      allowed: true,
      retryAfter: null,
    });
    expect(await betterAuthRateLimitStorage.consume("ip:/sign-in", { window: 60, max: 10 })).toEqual({
      allowed: false,
      retryAfter: 8,
    });
  });
});

describe("getClientIp", () => {
  const request = (headers: Record<string, string>) => new Request("http://localhost", { headers });

  it("reads the entry the trusted proxy appended, ignoring spoofed ones", () => {
    expect(getClientIp(request({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("walks further left when more proxies are in front", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    expect(getClientIp(request({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
  });

  it("ignores forwarding headers when no proxy is trusted", () => {
    vi.stubEnv("TRUSTED_PROXY_HOPS", "0");
    expect(getClientIp(request({ "x-forwarded-for": "203.0.113.9" }))).toBe("unknown");
  });

  it("ignores values that are not IP addresses", () => {
    expect(getClientIp(request({ "x-forwarded-for": "not-an-ip" }))).toBe("unknown");
  });
});
