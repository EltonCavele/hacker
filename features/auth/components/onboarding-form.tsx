"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/features/auth/actions";

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("auth.onboarding");
  const common = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await completeOnboarding({ name });
    if (result.error) {
      setIsLoading(false);
      setError(result.error);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Label htmlFor="name">{t("name")}</Label>
      <Input
        id="name"
        autoComplete="name"
        autoFocus
        required
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={error ? true : undefined}
      />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button size="lg" type="submit" isLoading={isLoading}>
        {common("continue")}
      </Button>
    </form>
  );
}
