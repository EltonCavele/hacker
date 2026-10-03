import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentCheckoutList } from "@/features/payments/components/payment-checkout-list";
import { paymentCatalog } from "@/features/payments/catalog";
import { getPaymentsForUser, getSubscriptionsForUser } from "@/features/payments/service";
import { getSession } from "@/features/auth/queries";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; purchaseId?: string }>;
}) {
  const t = await getTranslations("payments");
  const session = await getSession();
  if (!session) redirect("/login");
  const params = await searchParams;
  const [subscriptions, paymentHistory] = await Promise.all([
    getSubscriptionsForUser(session.user.id),
    getPaymentsForUser(session.user.id),
  ]);

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-6">
      <PaymentCheckoutList
        products={paymentCatalog}
        subscriptions={subscriptions.map((subscription) => ({
          ...subscription,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        }))}
        paymentHistory={paymentHistory.map((purchase) => ({
          ...purchase,
          paidAt: purchase.paidAt?.toISOString() ?? null,
          createdAt: purchase.createdAt.toISOString(),
        }))}
        purchaseId={params.purchaseId}
        checkoutState={params.checkout}
      />
      </div>
    </>
  );
}
