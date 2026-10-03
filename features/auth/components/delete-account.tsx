"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";

/** Permanent self-service account deletion. The user must type their email to arm the button. */
export function DeleteAccount({ email }: { email: string }) {
  const t = useTranslations("dashboard.settings.deleteAccount");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<"sessionExpired" | "activeSubscription" | "generic" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const armed = confirmation.trim().toLowerCase() === email.toLowerCase();

  function onOpenChange(next: boolean) {
    if (isDeleting) return;
    setOpen(next);
    if (!next) {
      setConfirmation("");
      setError(null);
    }
  }

  async function onDelete() {
    setIsDeleting(true);
    setError(null);
    const { error: failure } = await authClient.deleteUser();
    if (failure) {
      setIsDeleting(false);
      setError(
        failure.code === "SESSION_EXPIRED"
          ? "sessionExpired"
          : failure.code === "ACTIVE_SUBSCRIPTION"
            ? "activeSubscription"
            : "generic",
      );
      return;
    }
    await unsubscribeLocally();
    toast.success(t("success"));
    router.push("/");
    router.refresh(); // drop cached pages from the deleted session
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="destructive" size={'lg'} className="w-full">
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="delete-account-email">{t("confirmLabel", { email })}</Label>
          <Input
            id="delete-account-email"
            type="email"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={email}
          />
        </div>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t(`errors.${error}`)}{" "}
              {error === "activeSubscription" ? (
                <Link href="/dashboard/payments" className="underline underline-offset-4">
                  {t("goToPayments")}
                </Link>
              ) : null}
            </AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isDeleting}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={!armed} isLoading={isDeleting} onClick={onDelete}>
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
