import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ paymentSubscription: { findFirst: vi.fn(), update: vi.fn() } }));
vi.mock("@/lib/db/client", () => ({ prisma: db }));
const cancel = vi.hoisted(() => vi.fn());
vi.mock("@/lib/payments", () => ({ getPaymentProvider: () => ({ cancelSubscription: cancel }) }));

import { cancelSubscriptionForUser } from "./service";

beforeEach(() =>
  db.paymentSubscription.findFirst.mockResolvedValue({
    id: "s1",
    provider: "DODO",
    providerSubscriptionId: "sub_1",
    status: "ACTIVE",
    cancelAtPeriodEnd: false,
  }),
);

describe("cancelSubscriptionForUser", () => {
  it("looks the subscription up by owner, so users cannot cancel each other's", async () => {
    await cancelSubscriptionForUser("u1", "s1");
    expect(db.paymentSubscription.findFirst).toHaveBeenCalledWith({ where: { id: "s1", userId: "u1" } });
  });

  it("rejects an unknown or foreign subscription without calling the provider", async () => {
    db.paymentSubscription.findFirst.mockResolvedValue(null);
    await expect(cancelSubscriptionForUser("u2", "s1")).rejects.toThrow(/not found/);
    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels at the provider and then marks it locally", async () => {
    await cancelSubscriptionForUser("u1", "s1");
    expect(cancel).toHaveBeenCalledWith("sub_1");
    expect(db.paymentSubscription.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { cancelAtPeriodEnd: true },
    });
  });

  it("does nothing when it is already scheduled to cancel", async () => {
    db.paymentSubscription.findFirst.mockResolvedValue({ id: "s1", status: "ACTIVE", cancelAtPeriodEnd: true });
    await cancelSubscriptionForUser("u1", "s1");
    expect(cancel).not.toHaveBeenCalled();
  });
});
