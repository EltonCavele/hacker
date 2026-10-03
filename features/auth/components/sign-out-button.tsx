"use client";

import { Button } from "@/components/ui/button";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function SignOutButton() {
  const t = useTranslations("common");
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={async () => {
          await unsubscribeLocally();
          await authClient.signOut({ fetchOptions: { onSuccess: () => {
            router.push("/");
            router.refresh(); // drop cached pages from the previous session
          } } });
        }}
      type="button"
    >
      {t("signOut")}
    </Button>
  );
}
