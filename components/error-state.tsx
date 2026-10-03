"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Full-area fallback for an unexpected error: reports it, shows a calm message with the error digest (so support can
 * find the matching server log) and offers a retry. Used by every `error.tsx`.
 */
export function ErrorState({
  error,
  retry,
  homeHref = "/",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
}) {
  const t = useTranslations("error");
  const common = useTranslations("common");
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("description")}
      </p>
      {error.digest ? <p className="font-mono text-xs text-muted-foreground">{t("reference", { digest: error.digest })}</p> : null}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>{t("retry")}</Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{common("backHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
