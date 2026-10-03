import "server-only";

import { headers } from "next/headers";
import { safeAppPath } from "./safe-path";

/** Login URL that returns the visitor to the page they asked for. Pass it to `redirect()`. */
export async function loginRedirectPath(fallback = "/dashboard") {
  const headerStore = await headers();
  const next = safeAppPath(`${headerStore.get("x-pathname") ?? ""}${headerStore.get("x-search") ?? ""}`, fallback);
  return `/login?callbackURL=${encodeURIComponent(next)}`;
}
