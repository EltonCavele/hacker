"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORMAT_LOCALE, type Locale } from "@/lib/i18n/config";

type Product = {
  id: string;
  name: string;
  description?: string;
  provider: "EPAY" | "DODO";
  currency: "MZN" | "USD";
  amountMinor: number;
};

type PaymentState = { id: string; productId: string; status: string; currency: string; amountMinor: number; paidAt?: string | null };
type PaymentHistoryItem = PaymentState & { provider: string; paidAt: string | null; createdAt: string };
type Subscription = { id: string; productId: string; status: string; currency: string; amountMinor: number; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean };

export function PaymentCheckoutList({
  products,
  subscriptions,
  paymentHistory,
  purchaseId,
  checkoutState,
}: {
  products: Product[];
  subscriptions: Subscription[];
  paymentHistory: PaymentHistoryItem[];
  purchaseId?: string;
  checkoutState?: string;
}) {
  const t = useTranslations("payments");
  const formatLocale = FORMAT_LOCALE[useLocale() as Locale];
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentState | null>(null);
  const [history, setHistory] = useState(paymentHistory);
  const [error, setError] = useState<string | null>(null);
  const [cancelPending, setCancelPending] = useState<string | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState(subscriptions);

  useEffect(() => {
    if (!purchaseId || checkoutState !== "success") return;
    let stopped = false;
    let attempts = 0;
    const poll = async () => {
      try {
        const response = await fetch(`/api/payments/purchases/${encodeURIComponent(purchaseId)}`, { cache: "no-store" });
        if (!response.ok || stopped) return;
        const current = (await response.json()) as PaymentState;
        setPayment(current);
        setHistory((items) => items.map((item) => item.id === current.id ? { ...item, status: current.status, paidAt: current.paidAt ?? item.paidAt } : item));
        attempts += 1;
        if (current.status === "PENDING" && attempts < 30) window.setTimeout(poll, 4000);
      } catch {
        if (!stopped && attempts < 30) window.setTimeout(poll, 4000);
      }
    };
    void poll();
    return () => { stopped = true; };
  }, [purchaseId, checkoutState]);

  async function startCheckout(productId: string) {
    setPendingProduct(productId);
    setError(null);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.checkoutUrl !== "string") throw new Error("checkout");
      window.location.assign(result.checkoutUrl);
    } catch {
      setError(t("checkoutError"));
      setPendingProduct(null);
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    setCancelPending(subscriptionId);
    setError(null);
    try {
      const response = await fetch(`/api/payments/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`, { method: "POST" });
      if (!response.ok) throw new Error("cancel");
      setActiveSubscriptions((items) => items.map((item) => item.id === subscriptionId ? { ...item, cancelAtPeriodEnd: true } : item));
    } catch {
      setError(t("cancelError"));
    } finally {
      setCancelPending(null);
    }
  }

  return (
    <section className="space-y-5">
      {checkoutState && (
        <p role="status" className="border-b border-border pb-4 text-sm text-muted-foreground">
          {payment?.status === "SUCCEEDED"
            ? t("status.succeeded")
            : payment?.status === "FAILED" || payment?.status === "REFUNDED"
              ? t("status.failed")
              : checkoutState === "cancelled"
                ? t("status.cancelled")
                : t("status.pending")}
        </p>
      )}
      {products.length ? (
        <ul className="divide-y divide-border">
          {products.map((product) => (
            <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 py-5 first:pt-0 last:pb-0">
              <div className="space-y-1">
                <h2 className="font-medium">{product.name}</h2>
                {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
                <p className="text-sm text-muted-foreground">
                  {new Intl.NumberFormat(formatLocale, { style: "currency", currency: product.currency }).format(product.amountMinor / 100)}
                  {" · "}{product.provider === "EPAY" ? "EPay" : "Dodo Payments"}
                </p>
              </div>
              <Button
                disabled={pendingProduct !== null}
                isLoading={pendingProduct === product.id}
                onClick={() => void startCheckout(product.id)}
                type="button"
              >
                {pendingProduct === product.id ? t("opening") : t("continue")}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{t("noProducts")}</p>
      )}
      {activeSubscriptions.length > 0 && (
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-medium">{t("subscriptions")}</h2>
          <ul className="divide-y divide-border">
            {activeSubscriptions.map((subscription) => (
              <li key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{subscription.productId}</p>
                  <p className="text-sm text-muted-foreground">
                    {subscription.status}{subscription.currentPeriodEnd ? ` · ${t("until", { date: new Intl.DateTimeFormat(formatLocale, { dateStyle: "medium" }).format(new Date(subscription.currentPeriodEnd)) })}` : ""}
                  </p>
                </div>
                {subscription.status === "ACTIVE" && !subscription.cancelAtPeriodEnd && (
                  <Button variant="outline" size="sm" disabled={cancelPending !== null} isLoading={cancelPending === subscription.id} onClick={() => void cancelSubscription(subscription.id)} type="button">
                    {cancelPending === subscription.id ? t("cancelling") : t("cancelAtPeriodEnd")}
                  </Button>
                )}
                {subscription.cancelAtPeriodEnd && <Badge variant="warning">{t("cancelScheduled")}</Badge>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {history.length > 0 && (
        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="text-lg font-medium">{t("history")}</h2>
          <ul className="divide-y divide-border">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{item.productId}</p>
                  <p className="text-sm text-muted-foreground">{new Intl.DateTimeFormat(formatLocale, { dateStyle: "medium" }).format(new Date(item.createdAt))} · {item.provider}</p>
                </div>
                <p className="text-sm">
                  {new Intl.NumberFormat(formatLocale, { style: "currency", currency: item.currency }).format(item.amountMinor / 100)} · {item.status}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </section>
  );
}
