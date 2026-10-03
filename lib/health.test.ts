import { afterEach, describe, expect, it, vi } from "vitest";

const prisma = vi.hoisted(() => ({ $queryRaw: vi.fn() }));
const redis = vi.hoisted(() => ({ ping: vi.fn() }));
vi.mock("./db/client", () => ({ prisma }));
vi.mock("./redis/client", () => ({ redis }));

import { checkReadiness } from "./health";

afterEach(() => vi.useRealTimers());

describe("checkReadiness", () => {
  it("is ready when PostgreSQL and Redis answer", async () => {
    prisma.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    redis.ping.mockResolvedValue("PONG");
    const result = await checkReadiness();
    expect(result.ready).toBe(true);
    expect(result.checks.database.status).toBe("up");
    expect(result.checks.redis.status).toBe("up");
  });

  it("reports which dependency is down without leaking the error", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("password authentication failed for user postgres"));
    redis.ping.mockResolvedValue("PONG");
    const result = await checkReadiness();
    expect(result.ready).toBe(false);
    expect(result.checks.database.status).toBe("down");
    expect(result.checks.redis.status).toBe("up");
    expect(JSON.stringify(result)).not.toContain("password");
  });

  it("treats a hung dependency as down after the timeout", async () => {
    vi.useFakeTimers();
    prisma.$queryRaw.mockResolvedValue([]);
    redis.ping.mockReturnValue(new Promise(() => {}));
    const pending = checkReadiness();
    await vi.advanceTimersByTimeAsync(2500);
    const result = await pending;
    expect(result.ready).toBe(false);
    expect(result.checks.redis.status).toBe("down");
  });
});
