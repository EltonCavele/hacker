"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logout, User } from "reicon-react";
import { PageHeader } from "@/components/ui/page-header";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";

export function SettingsHeader() {
  const t = useTranslations("dashboard.nav");
  const common = useTranslations("common");
  const router = useRouter();

  return (
    <PageHeader
      actions={[
        {
          label: common("signOut"),
          icon: <Logout />,
          onClick: async () => {
            await unsubscribeLocally();
            await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
          },
          variant: "destructive",
        },
      ]}
      back={{}}
      title={t("settings")}
    />
  );
}
