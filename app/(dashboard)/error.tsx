"use client";

import { ErrorState } from "@/components/error-state";

// Keeps the sidebar visible: only the page area is replaced by the fallback.
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/dashboard" />;
}
