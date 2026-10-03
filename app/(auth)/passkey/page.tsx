import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FingerScan } from "reicon-react";
import { getSession, shouldOfferPasskey } from "@/features/auth/queries";
import { PasskeyOffer } from "@/features/auth/components/passkey-offer";

export default async function PasskeyPage() {
  const t = await getTranslations("auth.passkeyOffer");
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.user.onboardedAt) redirect("/onboarding");
  if (!(await shouldOfferPasskey(session))) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FingerScan className="size-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <PasskeyOffer />
    </main>
  );
}
