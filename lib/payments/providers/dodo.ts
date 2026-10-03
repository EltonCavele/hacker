import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { header, isRecord, numberValue, stringValue, validDate } from "../helpers";
import type { CheckoutInput, CheckoutResult, PaymentEvent, PaymentProvider } from "../types";

const toleranceSeconds = 5 * 60;

export class DodoPaymentProvider implements PaymentProvider {
  readonly name = "DODO" as const;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (input.currency !== "USD") throw new Error("Dodo checkout requires USD");
    if (!input.providerProductId) throw new Error("Dodo provider product ID is required");
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) throw new Error("Dodo Payments is not configured");
    if (environment !== "test_mode" && environment !== "live_mode") throw new Error("Invalid Dodo Payments environment");
    const baseUrl = environment === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const response = await fetch(`${baseUrl}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_cart: [{ product_id: input.providerProductId, quantity: 1 }],
        customer: { email: input.customerEmail },
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: { purchaseId: input.purchaseId, productId: input.productId },
        feature_flags: { allow_currency_selection: false },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !isRecord(result)) throw new Error("Could not create Dodo checkout");
    const checkoutUrl = stringValue(result.checkout_url);
    const providerCheckoutId = stringValue(result.session_id);
    if (!checkoutUrl || !providerCheckoutId) throw new Error("Dodo returned an incomplete checkout");
    return { providerCheckoutId, checkoutUrl, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) };
  }

  async verifyWebhook(request: Request): Promise<PaymentEvent> {
    const rawBody = await request.text();
    const eventId = header(request, "webhook-id");
    const signatureHeader = header(request, "webhook-signature");
    const timestamp = header(request, "webhook-timestamp");
    const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
    if (!eventId || !signatureHeader || !timestamp || !webhookKey) {
      throw new Error("Missing Dodo webhook signature headers");
    }
    const timestampSeconds = Number(timestamp);
    if (!Number.isFinite(timestampSeconds) || Math.abs(Date.now() / 1000 - timestampSeconds) > toleranceSeconds) {
      throw new Error("Dodo webhook timestamp is outside the allowed window");
    }
    const key = Buffer.from(webhookKey.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", key).update(`${eventId}.${timestamp}.${rawBody}`).digest("base64");
    const valid = signatureHeader.split(/\s+/).some((part) => {
      const [, value] = part.split(",", 2);
      if (!value) return false;
      const received = Buffer.from(value);
      const expectedBytes = Buffer.from(expected);
      return received.length === expectedBytes.length && timingSafeEqual(received, expectedBytes);
    });
    if (!valid) throw new Error("Invalid Dodo webhook signature");

    const event = JSON.parse(rawBody) as Record<string, unknown>;
    const data = isRecord(event.data) ? event.data : {};
    const metadata = isRecord(data.metadata) ? data.metadata : {};
    const eventType = stringValue(event.type);
    const normalizedType = normalizeEventType(eventType);
    if (!normalizedType) {
      throw new Error(`Unsupported Dodo payment event: ${eventType ?? "unknown"}`);
    }
    const currency = stringValue(data.currency) ?? "USD";
    if (currency !== "USD") throw new Error("Dodo payment currency is not supported");
    return {
      eventId,
      eventType: normalizedType,
      purchaseId: stringValue(metadata.purchaseId ?? metadata.purchase_id),
      providerCheckoutId: stringValue(data.checkout_session_id ?? data.session_id),
      providerPaymentId: stringValue(data.payment_id),
      providerCustomerId: stringValue(isRecord(data.customer) ? data.customer.customer_id : data.customer_id),
      providerSubscriptionId: stringValue(data.subscription_id),
      amountMinor: numberValue(data.total_amount ?? data.amount ?? data.recurring_pre_tax_amount),
      currency,
      occurredAt: validDate(event.timestamp) ?? validDate(data.created_at) ?? new Date(),
      periodStart: validDate(data.current_period_start),
      periodEnd: validDate(data.current_period_end ?? data.next_billing_date),
      metadata: { ...metadata, providerEventType: eventType, providerStatus: data.status },
    };
  }

  async cancelSubscription(providerSubscriptionId: string) {
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) throw new Error("Dodo Payments is not configured");
    const environment = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
    const baseUrl = environment === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const response = await fetch(`${baseUrl}/subscriptions/${encodeURIComponent(providerSubscriptionId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ cancel_at_next_billing_date: true }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Could not cancel Dodo subscription");
  }
}

function normalizeEventType(type: string | undefined): PaymentEvent["eventType"] | undefined {
  switch (type) {
    case "payment.succeeded": return "payment.succeeded";
    case "payment.failed": return "payment.failed";
    case "refund.succeeded": return "payment.refunded";
    case "subscription.active": return "subscription.activated";
    case "subscription.renewed": return "subscription.renewed";
    case "subscription.plan_changed": return "subscription.plan_changed";
    case "subscription.cancelled": return "subscription.canceled";
    case "subscription.expired": return "subscription.expired";
    case "subscription.failed": return "subscription.payment_failed";
    case "subscription.on_hold": return "subscription.on_hold";
    default: return undefined;
  }
}
