import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { safeAppPath } from "@/features/auth/safe-path";
import { getSession } from "@/features/auth/queries";
import { PasskeySignInButton } from "@/features/auth/components/passkey-sign-in-button";
import { Separator } from "@/components/ui/separator";
import { EmailOtpSignIn } from "@/features/auth/components/email-otp-sign-in";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackURL?: string }> }) {
  const t = await getTranslations("auth.login");
  const legal = await getTranslations("legal");
  const next = safeAppPath((await searchParams).callbackURL);
  const session = await getSession();
  if (session) redirect(next);

  return (
    <main className="mx-auto flex min-h-[var(--visual-vh,100dvh)] w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <EmailOtpSignIn
        callbackURL={next}
        header={
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Separator className="flex-1" />
            {t("or")}
            <Separator className="flex-1" />
          </div>
          <div className="flex flex-col gap-3">
            <GoogleSignInButton callbackURL={next} />
            <PasskeySignInButton callbackURL={next} />
          </div>
        </div>
      </EmailOtpSignIn>
      <p className="text-center text-xs text-muted-foreground">
        {legal.rich("acceptance", {
          terms: (chunks) => (
            <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
              {chunks}
            </Link>
          ),
        })}
      </p>
    </main>
  );
}
