import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, LOCALE_HEADER } from "@/lib/i18n/config";

/** Cookie (the user's choice) wins; the header covers the first request, before the browser has the cookie. */
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const headerLocale = (await headers()).get(LOCALE_HEADER);
  const locale = isLocale(cookieLocale) ? cookieLocale : isLocale(headerLocale) ? headerLocale : defaultLocale;
  return { locale, messages: (await import(`../messages/${locale}.json`)).default };
});
