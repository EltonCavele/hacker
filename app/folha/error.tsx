"use client";

import { ErrorState } from "@/components/error-state";

export default function FolhaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} homeHref="/folha" retry={retry} />;
}
