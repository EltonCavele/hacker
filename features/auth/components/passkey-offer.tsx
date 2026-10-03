"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { dismissPasskeyOffer } from "@/features/auth/actions";
import { authClient } from "@/lib/auth/client";
import { setDevicePasskey } from "../hooks/use-passkey-support";

/** Actions for the passkey offer screen, shown at every login while the user has no passkey. */
export function PasskeyOffer() {
  const t = useTranslations("auth.passkeyOffer");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function leave() {
    await dismissPasskeyOffer();
    router.replace("/dashboard");
    router.refresh();
  }

  // Browsers without WebAuthn can't create one: skip the offer silently.
  useEffect(() => {
    if (!window.PublicKeyCredential) void leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setIsLoading(true);
    const { error } = await authClient.passkey.addPasskey();
    if (error) {
      setIsLoading(false);
      toast.error(t("createError"));
      return;
    }
    setDevicePasskey(true);
    toast.success(t("created"));
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" type="button" isLoading={isLoading} onClick={create}>
        {t("register")}
      </Button>
      <Button size="lg" variant="ghost" type="button" disabled={isLoading} onClick={leave}>
        {t("notNow")}
      </Button>
    </div>
  );
}
