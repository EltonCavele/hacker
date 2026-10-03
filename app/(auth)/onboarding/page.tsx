import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/features/auth/queries";
import { OnboardingForm } from "@/features/auth/components/onboarding-form";

export default async function OnboardingPage() {
  const t = await getTranslations("auth.onboarding");
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.onboardedAt) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      {/* Google accounts arrive with a name; email accounts have an empty one. */}
      <OnboardingForm defaultName={session.user.name} />
    </main>
  );
}
