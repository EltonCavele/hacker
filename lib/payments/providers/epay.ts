import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { header } from "../helpers";
import type { CheckoutInput, CheckoutResult, PaymentEvent, PaymentProvider } from "../types";

const epayPayload = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "paid", "failed", "cancelled", "refunded"]),
  amount: z.union([z.string(), z.number()]).transform((value) => Number(value)).refine(Number.isFinite),
  currency: z.string().default("MZN"),
  external_reference: z.string().min(1),
  payment_url: z.string().url().optional(),
  paid_at: z.string().optional(),
  updated_at: z.string().optional(),
  event_id: z.string().optional(),
}).passthrough();

export class EpayPaymentProvider implements PaymentProvider {
  readonly name = "EPAY" as const;

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    if (input.currency !== "MZN") throw new Error("EPay checkout requires MZN");
    const secretKey = process.env.EPAY_SECRET_KEY;
    if (!secretKey) throw new Error("EPay is not configured");
    const response = await fetch(`${process.env.EPAY_BASE_URL ?? "https://checkout.epay.co.mz/api/v1"}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: input.amountMinor / 100,
        currency: "MZN",
        description: input.productName,
        external_reference: input.purchaseId,
        customer_email: input.customerEmail,
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        callback_url: process.env.EPAY_WEBHOOK_URL,
      }),
      signal: AbortSignal.timeout(Number(process.env.EPAY_REQUEST_TIMEOUT_MS ?? 15000)),
    });
    const result = epayPayload.safeParse(await response.json().catch(() => null));
    if (!response.ok || !result.success || !result.data.payment_url) {
      throw new Error("Could not create EPay checkout");
    }
    return { providerCheckoutId: result.data.id, checkoutUrl: result.data.payment_url };
  }

  async verifyWebhook(request: Request): Promise<PaymentEvent | null> {
    const rawBody = await request.text();
    const secret = process.env.EPAY_SECRET_KEY;
    const signature = header(request, process.env.EPAY_SIGNATURE_HEADER ?? "x-educavelpay-signature");
    if (!secret || !signature || !rawBody) throw new Error("Missing EPay webhook signature");
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const actualBytes = Buffer.from(signature.trim().toLowerCase());
    const expectedBytes = Buffer.from(expected);
    if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
      throw new Error("Invalid EPay webhook signature");
    }

    return this.normalizePayment(epayPayload.parse(JSON.parse(rawBody)));
  }

  async reconcileCheckout(providerCheckoutId: string, purchaseId: string): Promise<PaymentEvent | null> {
    const secretKey = process.env.EPAY_SECRET_KEY;
    if (!secretKey) throw new Error("EPay is not configured");
    const response = await fetch(`${process.env.EPAY_BASE_URL ?? "https://checkout.epay.co.mz/api/v1"}/payments/${encodeURIComponent(providerCheckoutId)}`, {
      headers: { Authorization: `Bearer ${secretKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(Number(process.env.EPAY_REQUEST_TIMEOUT_MS ?? 15000)),
    });
    const result = epayPayload.safeParse(await response.json().catch(() => null));
    if (!response.ok || !result.success) throw new Error("Could not reconcile EPay checkout");
    if (result.data.external_reference !== purchaseId) throw new Error("EPay purchase reference mismatch");
    return this.normalizePayment(result.data);
  }

  private normalizePayment(payment: z.infer<typeof epayPayload>): PaymentEvent | null {
    if (payment.currency.toUpperCase() !== "MZN") throw new Error("Invalid EPay currency");
    if (payment.status === "pending") return null;
    return {
      eventId: payment.event_id ?? `epay:${payment.id}:${payment.status}:${payment.updated_at ?? "status"}`,
      eventType: payment.status === "paid" ? "payment.succeeded" : payment.status === "refunded" ? "payment.refunded" : "payment.failed",
      purchaseId: payment.external_reference,
      providerCheckoutId: payment.id,
      providerPaymentId: payment.id,
      amountMinor: Math.round(payment.amount * 100),
      currency: "MZN",
      occurredAt: new Date(payment.paid_at ?? payment.updated_at ?? Date.now()),
      metadata: { providerStatus: payment.status },
    };
  }
}
