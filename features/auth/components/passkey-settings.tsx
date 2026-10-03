"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth/client";
import { setDevicePasskey } from "../hooks/use-passkey-support";

/** Instant toggle: on registers a passkey on this device, off removes all of the user's passkeys. */
export function PasskeySettings({ initialCount }: { initialCount: number }) {
  const t = useTranslations("auth.passkeySettings");
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [isBusy, setIsBusy] = useState(false);

  async function enable() {
    const { data, error } = await authClient.passkey.addPasskey();
    if (error || !data) {
      toast.error(t("createError"));
      return;
    }
    setDevicePasskey(true);
    setCount((current) => current + 1);
    toast.success(t("enabled"));
  }

  async function disable() {
    const { data: passkeys, error } = await authClient.passkey.listUserPasskeys();
    if (error || !passkeys) {
      toast.error(t("disableError"));
      return;
    }
    const results = await Promise.all(passkeys.map((item) => authClient.passkey.deletePasskey({ id: item.id })));
    if (results.some((result) => result.error)) {
      toast.error(t("removeError"));
      return;
    }
    setDevicePasskey(false);
    setCount(0);
    toast.success(t("disabled"));
  }

  async function onCheckedChange(checked: boolean) {
    setIsBusy(true);
    try {
      await (checked ? enable() : disable());
    } finally {
      setIsBusy(false);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor="passkey-switch" className="flex flex-col items-start gap-1">
        <span>{t("label")}</span>
        <span className="font-normal text-muted-foreground">
          {count > 0 ? t("count", { count }) : t("none")}
        </span>
      </Label>
      <Switch id="passkey-switch" checked={count > 0} disabled={isBusy} onCheckedChange={onCheckedChange} />
    </div>
  );
}
