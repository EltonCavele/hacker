import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DodoPaymentProvider } from "./dodo";
import { EpayPaymentProvider } from "./epay";

const EPAY_SECRET = "epay-test-secret";
const DODO_KEY = Buffer.from("dodo-test-key").toString("base64");

beforeEach(() => {
  vi.stubEnv("EPAY_SECRET_KEY", EPAY_SECRET);
  vi.stubEnv("DODO_PAYMENTS_WEBHOOK_KEY", `whsec_${DODO_KEY}`);
});

function epayRequest(body: unknown, signature?: string) {
  const raw = JSON.stringify(body);
  const sig = signature ?? createHmac("sha256", EPAY_SECRET).update(raw).digest("hex");
  return new Request("http://localhost/webhook", {
    method: "POST",
    body: raw,
    headers: { "x-educavelpay-signature": sig },
  });
}

const epayPaid = {
  id: "co_1",
  status: "paid",
  amount: "150.50",
  currency: "MZN",
  external_reference: "purchase-1",
  paid_at: "2026-01-01T10:00:00Z",
};

describe("EPay webhook", () => {
  const provider = new EpayPaymentProvider();

  it("accepts a correctly signed payment and normalises it", async () => {
    const event = await provider.verifyWebhook(epayRequest(epayPaid));
    expect(event).toMatchObject({
      eventType: "payment.succeeded",
      purchaseId: "purchase-1",
      amountMinor: 15050,
      currency: "MZN",
      providerCheckoutId: "co_1",
    });
  });

  it("rejects a wrong signature", async () => {
    await expect(provider.verifyWebhook(epayRequest(epayPaid, "0".repeat(64)))).rejects.toThrow(/signature/i);
  });

  it("rejects a signature made over a different body (tampering)", async () => {
    const forged = new Request("http://localhost/webhook", {
      method: "POST",
      body: JSON.stringify({ ...epayPaid, amount: "1" }),
      headers: {
        "x-educavelpay-signature": createHmac("sha256", EPAY_SECRET).update(JSON.stringify(epayPaid)).digest("hex"),
      },
    });
    await expect(provider.verifyWebhook(forged)).rejects.toThrow(/signature/i);
  });

  it("rejects a request without signature or without configured secret", async () => {
    await expect(
      provider.verifyWebhook(new Request("http://localhost", { method: "POST", body: "{}" })),
    ).rejects.toThrow();
    vi.stubEnv("EPAY_SECRET_KEY", "");
    await expect(provider.verifyWebhook(epayRequest(epayPaid))).rejects.toThrow();
  });

  it("ignores pending payments and maps refunds and failures", async () => {
    expect(await provider.verifyWebhook(epayRequest({ ...epayPaid, status: "pending" }))).toBeNull();
    expect((await provider.verifyWebhook(epayRequest({ ...epayPaid, status: "refunded" })))?.eventType).toBe(
      "payment.refunded",
    );
    expect((await provider.verifyWebhook(epayRequest({ ...epayPaid, status: "failed" })))?.eventType).toBe(
      "payment.failed",
    );
  });

  it("builds a stable event id so retries are deduplicated", async () => {
    const a = await provider.verifyWebhook(epayRequest(epayPaid));
    const b = await provider.verifyWebhook(epayRequest(epayPaid));
    expect(a?.eventId).toBe(b?.eventId);
  });

  it("rejects a non-MZN currency", async () => {
    await expect(provider.verifyWebhook(epayRequest({ ...epayPaid, currency: "USD" }))).rejects.toThrow(/currency/i);
  });
});

function dodoRequest(body: unknown, overrides: { id?: string; timestamp?: string; signature?: string } = {}) {
  const raw = JSON.stringify(body);
  const id = overrides.id ?? "evt_1";
  const timestamp = overrides.timestamp ?? String(Math.floor(Date.now() / 1000));
  const signature =
    overrides.signature ??
    `v1,${createHmac("sha256", Buffer.from(DODO_KEY, "base64")).update(`${id}.${timestamp}.${raw}`).digest("base64")}`;
  return new Request("http://localhost/webhook", {
    method: "POST",
    body: raw,
    headers: { "webhook-id": id, "webhook-timestamp": timestamp, "webhook-signature": signature },
  });
}

const dodoPaid = {
  type: "payment.succeeded",
  timestamp: "2026-01-01T10:00:00Z",
  data: { payment_id: "pay_1", total_amount: 1999, currency: "USD", metadata: { purchaseId: "purchase-1" } },
};

describe("Dodo webhook", () => {
  const provider = new DodoPaymentProvider();

  it("accepts a correctly signed event", async () => {
    const event = await provider.verifyWebhook(dodoRequest(dodoPaid));
    expect(event).toMatchObject({
      eventId: "evt_1",
      eventType: "payment.succeeded",
      purchaseId: "purchase-1",
      amountMinor: 1999,
      currency: "USD",
    });
  });

  it("rejects a bad signature", async () => {
    await expect(provider.verifyWebhook(dodoRequest(dodoPaid, { signature: "v1,AAAA" }))).rejects.toThrow(/signature/i);
  });

  it("rejects replays outside the timestamp tolerance", async () => {
    const stale = String(Math.floor(Date.now() / 1000) - 3600);
    await expect(provider.verifyWebhook(dodoRequest(dodoPaid, { timestamp: stale }))).rejects.toThrow(/timestamp/i);
  });

  it("rejects missing headers", async () => {
    await expect(
      provider.verifyWebhook(new Request("http://localhost", { method: "POST", body: "{}" })),
    ).rejects.toThrow(/Missing/);
  });

  it("rejects unsupported currencies and event types", async () => {
    await expect(
      provider.verifyWebhook(dodoRequest({ ...dodoPaid, data: { ...dodoPaid.data, currency: "EUR" } })),
    ).rejects.toThrow(/currency/i);
    await expect(provider.verifyWebhook(dodoRequest({ ...dodoPaid, type: "dispute.opened" }))).rejects.toThrow(
      /Unsupported/,
    );
  });
});
