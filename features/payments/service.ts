import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/client";
import { getPaymentProvider } from "@/lib/payments";
import type { PaymentProviderName } from "@/lib/payments";
import type { PaymentEvent } from "@/lib/payments/types";
import { paymentCatalog } from "./catalog";

export async function createCheckout(user: { id: string; email: string }, productId: string) {
  const product = paymentCatalog.find((item) => item.id === productId);
  if (!product) throw new Error("Payment product is unavailable");
  const purchase = await prisma.paymentPurchase.create({
    data: {
      userId: user.id,
      productId: product.id,
      provider: product.provider,
      currency: product.currency,
      amountMinor: product.amountMinor,
    },
  });

  try {
    const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
    const checkout = await getPaymentProvider(product.provider).createCheckout({
      purchaseId: purchase.id,
      productId: product.id,
      productName: product.name,
      providerProductId: product.providerProductId,
      amountMinor: product.amountMinor,
      currency: product.currency,
      customerEmail: user.email,
      successUrl: `${origin}/dashboard/payments?checkout=success&purchaseId=${purchase.id}`,
      cancelUrl: `${origin}/dashboard/payments?checkout=cancelled&purchaseId=${purchase.id}`,
    });
    return prisma.paymentPurchase.update({
      where: { id: purchase.id },
      data: {
        providerCheckoutId: checkout.providerCheckoutId,
        checkoutUrl: checkout.checkoutUrl,
        expiresAt: checkout.expiresAt,
      },
      select: { id: true, checkoutUrl: true, expiresAt: true },
    });
  } catch (error) {
    await prisma.paymentPurchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function getPurchaseForUser(userId: string, purchaseId: string) {
  return prisma.paymentPurchase.findFirst({
    where: { id: purchaseId, userId },
    select: { id: true, productId: true, provider: true, status: true, currency: true, amountMinor: true, paidAt: true },
  });
}

export async function getPaymentsForUser(userId: string) {
  return prisma.paymentPurchase.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, productId: true, provider: true, status: true, currency: true, amountMinor: true, paidAt: true, createdAt: true },
  });
}

export async function reconcileEpayCheckouts() {
  const pending = await prisma.paymentPurchase.findMany({
    where: { provider: "EPAY", status: "PENDING", providerCheckoutId: { not: null } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: { id: true, providerCheckoutId: true },
  });
  let reconciled = 0;
  const provider = getPaymentProvider("EPAY");
  if (!provider.reconcileCheckout) throw new Error("EPay reconciliation is unavailable");
  for (const purchase of pending) {
    if (!purchase.providerCheckoutId) continue;
    try {
      const event = await provider.reconcileCheckout(purchase.providerCheckoutId, purchase.id);
      if (event) {
        await applyPaymentEvent("EPAY", event);
        reconciled += 1;
      }
    } catch {
      // Leave this purchase pending; a later scheduled run can retry it.
    }
  }
  return reconciled;
}

export async function getSubscriptionsForUser(userId: string) {
  return prisma.paymentSubscription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, productId: true, providerSubscriptionId: true, status: true, currency: true, amountMinor: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
  });
}

export async function cancelSubscriptionForUser(userId: string, subscriptionId: string) {
  const subscription = await prisma.paymentSubscription.findFirst({ where: { id: subscriptionId, userId } });
  if (!subscription) throw new Error("Subscription was not found");
  if (subscription.status !== "ACTIVE" || subscription.cancelAtPeriodEnd) return;
  const provider = getPaymentProvider(subscription.provider);
  if (!provider.cancelSubscription) throw new Error("This provider does not support subscription cancellation");
  await provider.cancelSubscription(subscription.providerSubscriptionId);
  await prisma.paymentSubscription.update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: true } });
}

export async function applyPaymentEvent(provider: PaymentProviderName, event: PaymentEvent) {
  await prisma.$transaction(async (tx) => {
    const recorded = await tx.paymentProviderEvent.createMany({
      data: [{ provider, eventId: event.eventId, eventType: event.eventType, metadata: event.metadata as Prisma.InputJsonValue | undefined }],
      skipDuplicates: true,
    });
    if (recorded.count === 0) return;

    const purchase = event.purchaseId
      ? await tx.paymentPurchase.findUnique({ where: { id: event.purchaseId } })
      : event.providerCheckoutId
        ? await tx.paymentPurchase.findUnique({ where: { providerCheckoutId: event.providerCheckoutId } })
        : null;
    const subscription = event.providerSubscriptionId
      ? await tx.paymentSubscription.findUnique({ where: { providerSubscriptionId: event.providerSubscriptionId } })
      : null;
    if (!purchase && !subscription) throw new Error("Payment reference does not match a purchase or subscription");
    if ((purchase && purchase.provider !== provider) || (subscription && subscription.provider !== provider)) {
      throw new Error("Payment provider does not match the recorded purchase");
    }

    if (event.eventType.startsWith("subscription.")) {
      if (event.eventType === "subscription.activated" && purchase && event.providerSubscriptionId) {
        if (event.amountMinor !== undefined && event.amountMinor !== purchase.amountMinor) {
          throw new Error("Subscription amount does not match the purchase");
        }
        await tx.paymentPurchase.update({
          where: { id: purchase.id },
          data: { status: "SUCCEEDED", providerPaymentId: event.providerPaymentId, paidAt: event.occurredAt },
        });
        await tx.paymentSubscription.upsert({
          where: { providerSubscriptionId: event.providerSubscriptionId },
          create: {
            userId: purchase.userId,
            productId: purchase.productId,
            provider,
            providerSubscriptionId: event.providerSubscriptionId,
            providerCustomerId: event.providerCustomerId,
            status: "ACTIVE",
            currency: purchase.currency,
            amountMinor: purchase.amountMinor,
            currentPeriodStart: event.periodStart,
            currentPeriodEnd: event.periodEnd,
          },
          update: {
            status: "ACTIVE",
            providerCustomerId: event.providerCustomerId,
            currentPeriodStart: event.periodStart,
            currentPeriodEnd: event.periodEnd,
          },
        });
      } else if (subscription) {
        if (event.eventType === "subscription.renewed" && event.providerPaymentId) {
          await recordRecurringPayment(tx, subscription, event, "SUCCEEDED");
        }
        const status = event.eventType === "subscription.canceled"
          ? "CANCELED"
          : event.eventType === "subscription.expired"
            ? "EXPIRED"
            : event.eventType === "subscription.payment_failed"
              ? "PAST_DUE"
              : event.eventType === "subscription.on_hold"
                ? "ON_HOLD"
                : "ACTIVE";
        await tx.paymentSubscription.update({
          where: { id: subscription.id },
          data: {
            status,
            productId: typeof event.metadata?.productId === "string" ? event.metadata.productId : undefined,
            cancelAtPeriodEnd: status === "CANCELED" || subscription.cancelAtPeriodEnd,
            currentPeriodStart: event.periodStart ?? undefined,
            currentPeriodEnd: event.periodEnd ?? undefined,
          },
        });
      } else if (purchase && event.eventType === "subscription.payment_failed") {
        await tx.paymentPurchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
      } else {
        throw new Error("Dodo subscription event is missing its purchase/subscription reference");
      }
      return;
    }

    if (!purchase && subscription) {
      if (event.eventType === "payment.succeeded") {
        await recordRecurringPayment(tx, subscription, event, "SUCCEEDED");
        return;
      }
      if (event.eventType === "payment.failed") {
        await recordRecurringPayment(tx, subscription, event, "FAILED");
        await tx.paymentSubscription.update({ where: { id: subscription.id }, data: { status: "PAST_DUE" } });
        return;
      }
      if (event.eventType === "payment.refunded") {
        await recordRecurringPayment(tx, subscription, event, "REFUNDED");
        return;
      }
    }

    if (!purchase) throw new Error("Payment event is missing its purchase reference");

    if (event.eventType === "payment.succeeded") {
      if (event.amountMinor !== purchase.amountMinor || event.currency !== purchase.currency) {
        throw new Error("Payment amount does not match the purchase");
      }
      if (purchase.status === "PENDING") {
        await tx.paymentPurchase.update({
          where: { id: purchase.id },
          data: { status: "SUCCEEDED", providerPaymentId: event.providerPaymentId, paidAt: event.occurredAt },
        });
      }
    } else if (event.eventType === "payment.refunded") {
      await tx.paymentPurchase.update({
        where: { id: purchase.id },
        data: { status: "REFUNDED", providerPaymentId: event.providerPaymentId },
      });
    } else if (purchase.status === "PENDING") {
      await tx.paymentPurchase.update({
        where: { id: purchase.id },
        data: { status: "FAILED", providerPaymentId: event.providerPaymentId },
      });
    }
  });
}

async function recordRecurringPayment(
  tx: Prisma.TransactionClient,
  subscription: { id: string; userId: string; productId: string; provider: PaymentProviderName; providerSubscriptionId: string; currency: string; amountMinor: number },
  event: PaymentEvent,
  status: "SUCCEEDED" | "FAILED" | "REFUNDED",
) {
  if (event.providerPaymentId && await tx.paymentPurchase.findUnique({ where: { providerPaymentId: event.providerPaymentId }, select: { id: true } })) return;
  const currency = event.currency ?? subscription.currency;
  const amountMinor = event.amountMinor ?? subscription.amountMinor;
  if (currency !== subscription.currency || (status === "SUCCEEDED" && amountMinor !== subscription.amountMinor)) {
    throw new Error("Recurring payment amount does not match the subscription");
  }
  await tx.paymentPurchase.create({
    data: {
      userId: subscription.userId,
      productId: subscription.productId,
      provider: subscription.provider,
      providerSubscriptionId: subscription.providerSubscriptionId,
      currency,
      amountMinor,
      status,
      providerPaymentId: event.providerPaymentId,
      paidAt: status === "SUCCEEDED" ? event.occurredAt : undefined,
    },
  });
}
