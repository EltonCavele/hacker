"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const t = useTranslations("dashboard.profile");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (!value) return;
    setIsLoading(true);
    const { error } = await authClient.updateUser({ name: value });
    setIsLoading(false);
    if (error) {
      toast.error(t("saveError"));
      return;
    }
    toast.success(t("saved"));
    router.push("/dashboard/profile");
    router.refresh();
  }

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="profile-name">{t("name")}</Label>
        <Input defaultValue={name} id="profile-name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile-email">{t("email")}</Label>
        <Input defaultValue={email} disabled id="profile-email" />
      </div>
      <div>
        <Button isLoading={isLoading} type="submit">{t("save")}</Button>
      </div>
    </form>
  );
}
