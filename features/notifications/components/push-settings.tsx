"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  hasPushIntent,
  isPushSupported,
  needsInstallForPush,
} from "../push-client";

type Status = "loading" | "unsupported" | "install" | "denied" | "off" | "on";

export function PushSettings() {
  const t = useTranslations("push");
  const [status, setStatus] = useState<Status>("loading");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    async function detect() {
      if (needsInstallForPush()) return setStatus("install");
      if (!isPushSupported()) return setStatus("unsupported");
      if (Notification.permission === "denied") return setStatus("denied");
      const subscription = await getCurrentSubscription();
      setStatus(subscription && hasPushIntent() && Notification.permission === "granted" ? "on" : "off");
    }
    detect().catch(() => setStatus("unsupported"));
  }, []);

  async function onCheckedChange(checked: boolean) {
    setIsBusy(true);
    try {
      if (!checked) {
        await disablePush();
        setStatus("off");
        toast.success(t("disabledToast"));
        return;
      }
      const result = await enablePush();
      if (result === "granted") {
        setStatus("on");
        toast.success(t("enabledToast"));
      } else if (result === "denied") {
        setStatus("denied");
      } else if (result === "error") {
        toast.error(t("enableError"));
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function sendTest() {
    const res = await fetch("/api/push/test", { method: "POST" });
    if (res.ok) toast.success(t("testSent"));
    else toast.error(t("testError"));
  }

  const hints: Partial<Record<Status, string>> = {
    unsupported: t("unsupported"),
    install: t("install"),
    denied: t("denied"),
    on: t("on"),
    off: t("off"),
  };
  const isDisabled = isBusy || status === "loading" || status === "unsupported" || status === "install" || status === "denied";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="push-switch" className="flex flex-col items-start gap-1">
          <span>{t("title")}</span>
          <span className="font-normal text-muted-foreground">{hints[status] ?? t("checking")}</span>
        </Label>
        <Switch id="push-switch" checked={status === "on"} disabled={isDisabled} onCheckedChange={onCheckedChange} />
      </div>
      {status === "on" && (
        <Button variant="outline" size="sm" className="self-start" onClick={sendTest}>
          {t("sendTest")}
        </Button>
      )}
    </div>
  );
}
