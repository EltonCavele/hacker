import "server-only";

import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";

/**
 * Locale for code that runs outside a page render (route handlers, Better Auth hooks): the cookie, else the default.
 * Pages and actions should use next-intl's `getLocale()` / `getTranslations()` instead.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : defaultLocale;
  } catch {
    return defaultLocale; // no request scope (worker, script)
  }
}
