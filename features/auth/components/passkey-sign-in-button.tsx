"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FingerScan } from "reicon-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { setDevicePasskey, usePasskeySupport } from "../hooks/use-passkey-support";

export function PasskeySignInButton({ callbackURL = "/dashboard" }: { callbackURL?: string }) {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { platform, conditional, hasDevicePasskey } = usePasskeySupport();

  if (!hasDevicePasskey || (!platform && !conditional)) return null;

  async function signIn() {
    setIsLoading(true);
    const { error } = await authClient.signIn.passkey();
    if (error) {
      setIsLoading(false);
      toast.error(t("passkeyError"));
      return;
    }
    setDevicePasskey(true);
    router.push(callbackURL);
  }

  return (
    <Button size="lg" variant="ghost" type="button" isLoading={isLoading} onClick={signIn}>
      <FingerScan />
      {t("passkey")}
    </Button>
  );
}
