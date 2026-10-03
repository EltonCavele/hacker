import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PaymentEvent } from "@/lib/payments/types";

const tx = vi.hoisted(() => ({
  paymentProviderEvent: { createMany: vi.fn() },
  paymentPurchase: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  paymentSubscription: { findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));
vi.mock("@/lib/db/client", () => ({
  prisma: {
    $transaction: (callback: (client: typeof tx) => Promise<unknown>) => callback(tx),
    paymentSubscription: { findFirst: vi.fn() },
  },
}));

import { applyPaymentEvent } from "./service";

const purchase = { id: "p1", userId: "u1", provider: "EPAY", status: "PENDING", currency: "MZN", amountMinor: 10000 };
const succeeded: PaymentEvent = {
  eventId: "evt-1",
  eventType: "payment.succeeded",
  purchaseId: "p1",
  providerPaymentId: "pay-1",
  amountMinor: 10000,
  currency: "MZN",
  occurredAt: new Date("2026-01-01T10:00:00Z"),
};

beforeEach(() => {
  tx.paymentProviderEvent.createMany.mockResolvedValue({ count: 1 });
  tx.paymentPurchase.findUnique.mockResolvedValue(purchase);
  tx.paymentSubscription.findUnique.mockResolvedValue(null);
});

describe("applyPaymentEvent", () => {
  it("marks a pending purchase as paid", async () => {
    await applyPaymentEvent("EPAY", succeeded);
    expect(tx.paymentPurchase.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { status: "SUCCEEDED", providerPaymentId: "pay-1", paidAt: succeeded.occurredAt },
    });
  });

  it("is idempotent: a redelivered event changes nothing", async () => {
    tx.paymentProviderEvent.createMany.mockResolvedValue({ count: 0 });
    await applyPaymentEvent("EPAY", succeeded);
    expect(tx.paymentPurchase.findUnique).not.toHaveBeenCalled();
    expect(tx.paymentPurchase.update).not.toHaveBeenCalled();
  });

  it("records the event with skipDuplicates so concurrent deliveries cannot both apply", async () => {
    await applyPaymentEvent("EPAY", succeeded);
    expect(tx.paymentProviderEvent.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skipDuplicates: true,
        data: [expect.objectContaining({ provider: "EPAY", eventId: "evt-1" })],
      }),
    );
  });

  it("refuses a payment whose amount differs from the purchase", async () => {
    await expect(applyPaymentEvent("EPAY", { ...succeeded, amountMinor: 1 })).rejects.toThrow(/amount/);
    expect(tx.paymentPurchase.update).not.toHaveBeenCalled();
  });

  it("refuses a payment whose currency differs from the purchase", async () => {
    await expect(applyPaymentEvent("EPAY", { ...succeeded, currency: "USD" })).rejects.toThrow(/amount/);
  });

  it("refuses an event from a different provider than the purchase", async () => {
    await expect(applyPaymentEvent("DODO", succeeded)).rejects.toThrow(/provider/);
    expect(tx.paymentPurchase.update).not.toHaveBeenCalled();
  });

  it("refuses an event that matches nothing", async () => {
    tx.paymentPurchase.findUnique.mockResolvedValue(null);
    await expect(applyPaymentEvent("EPAY", succeeded)).rejects.toThrow(/does not match/);
  });

  it("does not re-pay a purchase that is no longer pending", async () => {
    tx.paymentPurchase.findUnique.mockResolvedValue({ ...purchase, status: "REFUNDED" });
    await applyPaymentEvent("EPAY", succeeded);
    expect(tx.paymentPurchase.update).not.toHaveBeenCalled();
  });

  it("marks a purchase as refunded", async () => {
    await applyPaymentEvent("EPAY", { ...succeeded, eventId: "evt-2", eventType: "payment.refunded" });
    expect(tx.paymentPurchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "REFUNDED" }) }),
    );
  });

  it("fails a pending purchase on a failed payment, but never downgrades a paid one", async () => {
    await applyPaymentEvent("EPAY", { ...succeeded, eventId: "evt-3", eventType: "payment.failed" });
    expect(tx.paymentPurchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "FAILED" }) }),
    );

    tx.paymentPurchase.update.mockClear();
    tx.paymentPurchase.findUnique.mockResolvedValue({ ...purchase, status: "SUCCEEDED" });
    await applyPaymentEvent("EPAY", { ...succeeded, eventId: "evt-4", eventType: "payment.failed" });
    expect(tx.paymentPurchase.update).not.toHaveBeenCalled();
  });
});
