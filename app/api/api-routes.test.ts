import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowRateLimit, blockRateLimit, jsonRequest, redisMock, session } from "@/tests/helpers";

vi.mock("@/lib/redis/client", () => redisMock);
const getSession = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/queries", () => ({ getSession }));
const payments = vi.hoisted(() => ({
  createCheckout: vi.fn(),
  applyPaymentEvent: vi.fn(),
  reconcileEpayCheckouts: vi.fn(),
  getPurchaseForUser: vi.fn(),
  cancelSubscriptionForUser: vi.fn(),
}));
vi.mock("@/features/payments/service", () => payments);
const provider = vi.hoisted(() => ({ verifyWebhook: vi.fn() }));
vi.mock("@/lib/payments", () => ({ getPaymentProvider: () => provider }));
const storage = vi.hoisted(() => ({ createUploadUrlForUser: vi.fn() }));
vi.mock("@/features/storage/service", async () => {
  const { z } = await import("zod");
  return { ...storage, uploadRequestSchema: z.object({ filename: z.string().min(1) }) };
});
const push = vi.hoisted(() => ({ sendPushToUser: vi.fn() }));
vi.mock("@/lib/push", () => push);

import { POST as checkout } from "./payments/checkout/route";
import { POST as upload } from "./storage/upload/route";
import { POST as pushTest } from "./push/test/route";
import { POST as epayWebhook } from "./payments/epay/webhook/route";
import { POST as dodoWebhook } from "./payments/dodo/webhook/route";
import { POST as reconcile } from "./payments/epay/reconcile/route";

beforeEach(() => {
  allowRateLimit();
  getSession.mockResolvedValue(session);
});

describe("POST /api/payments/checkout", () => {
  it("requires a session", async () => {
    getSession.mockResolvedValue(null);
    expect((await checkout(jsonRequest("/api/payments/checkout", { productId: "x" }))).status).toBe(401);
    expect(payments.createCheckout).not.toHaveBeenCalled();
  });

  it("rate limits before doing any work", async () => {
    blockRateLimit(42);
    const response = await checkout(jsonRequest("/api/payments/checkout", { productId: "x" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
    expect(payments.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects an invalid body, including unknown keys such as a client-chosen price", async () => {
    expect((await checkout(jsonRequest("/api/payments/checkout", {}))).status).toBe(400);
    expect((await checkout(jsonRequest("/api/payments/checkout", { productId: "x", amountMinor: 1 }))).status).toBe(
      400,
    );
    expect((await checkout(jsonRequest("/api/payments/checkout", "not json"))).status).toBe(400);
  });

  it("creates the checkout for the signed-in user", async () => {
    payments.createCheckout.mockResolvedValue({ id: "p1", checkoutUrl: "https://pay.example/1" });
    const response = await checkout(jsonRequest("/api/payments/checkout", { productId: "pro" }));
    expect(response.status).toBe(200);
    expect(payments.createCheckout).toHaveBeenCalledWith({ id: session.user.id, email: session.user.email }, "pro");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("hides provider errors behind a 502", async () => {
    payments.createCheckout.mockRejectedValue(new Error("secret provider detail"));
    const response = await checkout(jsonRequest("/api/payments/checkout", { productId: "pro" }));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});

describe("POST /api/storage/upload", () => {
  it("requires a session and enforces the rate limit", async () => {
    getSession.mockResolvedValue(null);
    expect((await upload(jsonRequest("/api/storage/upload", { filename: "a.png" }))).status).toBe(401);
    getSession.mockResolvedValue(session);
    blockRateLimit();
    expect((await upload(jsonRequest("/api/storage/upload", { filename: "a.png" }))).status).toBe(429);
    expect(storage.createUploadUrlForUser).not.toHaveBeenCalled();
  });

  it("validates input and scopes the upload URL to the user", async () => {
    expect((await upload(jsonRequest("/api/storage/upload", {}))).status).toBe(400);
    storage.createUploadUrlForUser.mockResolvedValue({ url: "https://s3/put" });
    expect((await upload(jsonRequest("/api/storage/upload", { filename: "a.png" }))).status).toBe(200);
    expect(storage.createUploadUrlForUser).toHaveBeenCalledWith(session.user.id, { filename: "a.png" });
  });
});

describe("POST /api/push/test", () => {
  it("is limited to a handful of test pushes per minute", async () => {
    blockRateLimit();
    expect((await pushTest()).status).toBe(429);
    expect(push.sendPushToUser).not.toHaveBeenCalled();
  });

  it("sends to the signed-in user only", async () => {
    expect((await pushTest()).status).toBe(200);
    expect(push.sendPushToUser).toHaveBeenCalledWith(session.user.id, expect.objectContaining({ title: "Nextpad" }));
  });
});

describe.each([
  ["EPay", epayWebhook],
  ["Dodo", dodoWebhook],
])("%s webhook", (_name, handler) => {
  const request = () => new Request("http://localhost/webhook", { method: "POST", body: "{}" });

  it("rejects an unverifiable request without touching the database", async () => {
    provider.verifyWebhook.mockRejectedValue(new Error("Invalid signature"));
    expect((await handler(request())).status).toBe(400);
    expect(payments.applyPaymentEvent).not.toHaveBeenCalled();
  });

  it("applies a verified event and acknowledges it", async () => {
    const event = { eventId: "e1", eventType: "payment.succeeded", occurredAt: new Date() };
    provider.verifyWebhook.mockResolvedValue(event);
    expect((await handler(request())).status).toBe(200);
    expect(payments.applyPaymentEvent).toHaveBeenCalledWith(expect.any(String), event);
  });

  it("answers 500 when processing fails so the provider retries", async () => {
    provider.verifyWebhook.mockResolvedValue({ eventId: "e1", eventType: "payment.succeeded", occurredAt: new Date() });
    payments.applyPaymentEvent.mockRejectedValue(new Error("db down"));
    expect((await handler(request())).status).toBe(500);
  });

  it("is rate limited per IP", async () => {
    blockRateLimit();
    expect((await handler(request())).status).toBe(429);
    expect(provider.verifyWebhook).not.toHaveBeenCalled();
  });
});

describe("POST /api/payments/epay/reconcile", () => {
  const call = (token?: string) =>
    reconcile(
      new Request("http://localhost/x", { method: "POST", headers: token ? { authorization: `Bearer ${token}` } : {} }),
    );

  beforeEach(() => vi.stubEnv("EPAY_RECONCILIATION_TOKEN", "s3cret-token"));

  it("rejects missing and wrong tokens", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("wrong")).status).toBe(401);
    expect(payments.reconcileEpayCheckouts).not.toHaveBeenCalled();
  });

  it("is closed when no token is configured, even for an empty bearer", async () => {
    vi.stubEnv("EPAY_RECONCILIATION_TOKEN", "");
    expect((await call("")).status).toBe(401);
  });

  it("runs with the right token", async () => {
    payments.reconcileEpayCheckouts.mockResolvedValue(3);
    const response = await call("s3cret-token");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reconciled: 3 });
  });
});
