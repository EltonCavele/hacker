"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export function useSignOut() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function signOut() {
    setIsLoading(true);
    await unsubscribeLocally();
    const { error } = await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
    if (error) setIsLoading(false);
  }

  return { signOut, isLoading };
}

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { signOut, isLoading } = useSignOut();

  return (
    <Button className={cn(className)} isLoading={isLoading} onClick={signOut} type="button" variant="outline">
      {t("signOut")}
    </Button>
  );
}
