export type PaymentProviderName = "EPAY" | "DODO";
export type PaymentCurrency = "MZN" | "USD";

export type CheckoutInput = {
  purchaseId: string;
  productId: string;
  productName: string;
  providerProductId?: string;
  amountMinor: number;
  currency: PaymentCurrency;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutResult = {
  providerCheckoutId: string;
  checkoutUrl: string;
  expiresAt?: Date;
};

export type PaymentEvent = {
  eventId: string;
  eventType:
    | "payment.succeeded"
    | "payment.failed"
    | "payment.refunded"
    | "subscription.activated"
    | "subscription.renewed"
    | "subscription.plan_changed"
    | "subscription.payment_failed"
    | "subscription.on_hold"
    | "subscription.canceled"
    | "subscription.expired";
  purchaseId?: string;
  providerCheckoutId?: string;
  providerPaymentId?: string;
  providerCustomerId?: string;
  providerSubscriptionId?: string;
  amountMinor?: number;
  currency?: PaymentCurrency;
  occurredAt: Date;
  periodStart?: Date;
  periodEnd?: Date;
  metadata?: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly name: PaymentProviderName;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(request: Request): Promise<PaymentEvent | null>;
  cancelSubscription?(providerSubscriptionId: string): Promise<void>;
  reconcileCheckout?(providerCheckoutId: string, purchaseId: string): Promise<PaymentEvent | null>;
}
