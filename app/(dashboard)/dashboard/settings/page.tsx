import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/dal";
import { DeleteAccount } from "@/features/auth/components/delete-account";
import { PasskeySettings } from "@/features/auth/components/passkey-settings";
import { PushSettings } from "@/features/notifications/components/push-settings";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsHeader } from "@/features/dashboard/components/settings-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const [t, locale] = await Promise.all([getTranslations("dashboard.settings"), getLocale()]);
  const user = await requireUser();
  const passkeys = await auth.api.listPasskeys({ headers: await headers() });

  return (
    <>
      <SettingsHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("appearance")}</CardTitle>
          <CardDescription>{t("appearanceDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <span className="text-sm">{t("theme")}</span>
          <ThemeToggle />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
          <CardDescription>{t("languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher locale={locale} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("notifications")}</CardTitle>
          <CardDescription>{t("notificationsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PushSettings />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t("security")}</CardTitle>
          <CardDescription>{t("securityDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasskeySettings initialCount={passkeys.length} />
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t("deleteAccount.title")}</CardTitle>
          <CardDescription>{t("deleteAccount.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t("deleteAccount.warning")}</p>
          <DeleteAccount email={user.email} />
        </CardContent>
      </Card>
      </div>
    </>
  );
}
