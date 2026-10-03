import { describe, expect, it, vi } from "vitest";

const checkReadiness = vi.hoisted(() => vi.fn());
vi.mock("@/lib/health", () => ({ checkReadiness }));

import { GET as health } from "./health/route";
import { GET as ready } from "./ready/route";

describe("GET /api/health", () => {
  it("is a dependency-free liveness probe", async () => {
    const response = health();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(checkReadiness).not.toHaveBeenCalled();
  });
});

describe("GET /api/ready", () => {
  it("is 200 when every dependency is up", async () => {
    checkReadiness.mockResolvedValue({ ready: true, checks: { database: { status: "up" }, redis: { status: "up" } } });
    const response = await ready();
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ready");
  });

  it("is 503 when a dependency is down so load balancers drain the instance", async () => {
    checkReadiness.mockResolvedValue({
      ready: false,
      checks: { database: { status: "down" }, redis: { status: "up" } },
    });
    const response = await ready();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});
