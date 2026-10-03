import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import {
  GUESSED_LOCALE_COOKIE_MAX_AGE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
} from "@/lib/i18n/config";
import { detectLocale } from "@/lib/i18n/detect";
import { buildCsp, cspOriginsFromEnv } from "@/lib/security-headers";

/**
 * Runs before every page render: attaches a request id for log correlation and a per-request CSP nonce, and picks the
 * language for first-time visitors (country of the IP, looked up once and then remembered in a cookie).
 * Pages read the nonce from the `x-nonce` request header (see app/layout.tsx), which makes them dynamically rendered.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV === "development",
    upgradeInsecure: process.env.BETTER_AUTH_URL?.startsWith("https://") ?? false,
    ...cspOriginsFromEnv(process.env),
  });

  // The cookie is the cache: the IP is only looked at while it is missing, so returning visitors cost nothing.
  const stored = request.cookies.get(LOCALE_COOKIE)?.value;
  const detected = isLocale(stored) ? null : await detectLocale(request.headers, getClientIp(request));
  const locale = isLocale(stored) ? stored : detected!.locale;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, locale);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-request-id", requestId);
  if (detected) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      // Only a country match is trusted for long; a weaker guess (Accept-Language) is re-evaluated tomorrow.
      maxAge: detected.confident ? LOCALE_COOKIE_MAX_AGE : GUESSED_LOCALE_COOKIE_MAX_AGE,
    });
  }
  return response;
}

export const config = {
  matcher: [
    {
      // Documents only: API routes, build assets, icons and the service worker do not render HTML.
      source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js|pwa-icon|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
