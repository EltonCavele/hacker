import { isIP } from "node:net";
import { defaultLocale, PORTUGUESE_COUNTRIES, type Locale } from "./config";

/** Country headers set by the CDN/platform in front of the app: free, exact and already there, so tried first. */
const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

/** Plain-text endpoint returning the ISO country of `{ip}`. Override with GEOIP_URL (must contain `{ip}`). */
const DEFAULT_GEOIP_URL = "https://ipapi.co/{ip}/country/";
const LOOKUP_TIMEOUT_MS = 800;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 5_000;
// Per-process memo so several first visits from one IP (or one NAT) cost a single lookup. The cookie is the real cache.
const countryCache = new Map<string, { country: string | null; expires: number }>();

export function localeFromCountry(country: string | null | undefined): Locale {
  return country && PORTUGUESE_COUNTRIES.has(country.toUpperCase()) ? "pt" : defaultLocale;
}

/** Fallback when the country is unknown: the browser's preferred languages (`pt`, `pt-BR`... win only if listed first). */
export function localeFromAcceptLanguage(header: string | null): Locale {
  const first = header?.split(",")[0]?.trim().toLowerCase();
  return first?.startsWith("pt") ? "pt" : defaultLocale;
}

function normalizeCountry(value: string | null | undefined) {
  const code = value?.trim().toUpperCase();
  // "XX"/"T1" are Cloudflare's "unknown"/"Tor" markers.
  return code && /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null;
}

async function lookupCountry(ip: string): Promise<string | null> {
  const cached = countryCache.get(ip);
  if (cached && cached.expires > Date.now()) return cached.country;

  const template = process.env.GEOIP_URL || DEFAULT_GEOIP_URL;
  let country: string | null = null;
  try {
    const response = await fetch(template.replace("{ip}", encodeURIComponent(ip)), {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      cache: "no-store",
    });
    if (response.ok) country = normalizeCountry(await response.text());
  } catch {
    // Timeout, rate limit or network error: the caller falls back to Accept-Language.
  }
  // Failures are memoised too (shorter) so a dead provider is not hit by every new visitor.
  if (countryCache.size >= CACHE_MAX_ENTRIES) countryCache.delete(countryCache.keys().next().value!);
  countryCache.set(ip, { country, expires: Date.now() + (country ? CACHE_TTL_MS : 5 * 60 * 1000) });
  return country;
}

function isPublicIp(ip: string) {
  if (!isIP(ip)) return false;
  return !/^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i.test(ip);
}

export type DetectedLocale = {
  locale: Locale;
  /** True when it came from the IP/CDN country rather than a weaker hint. */ confident: boolean;
};

/**
 * Picks a locale for a visitor with no stored choice. Only called when the locale cookie is missing (see proxy.ts), so
 * the geo lookup happens once per browser, never per render.
 */
export async function detectLocale(headers: Headers, clientIp: string): Promise<DetectedLocale> {
  for (const name of COUNTRY_HEADERS) {
    const country = normalizeCountry(headers.get(name));
    if (country) return { locale: localeFromCountry(country), confident: true };
  }
  if (isPublicIp(clientIp)) {
    const country = await lookupCountry(clientIp);
    if (country) return { locale: localeFromCountry(country), confident: true };
  }
  return { locale: localeFromAcceptLanguage(headers.get("accept-language")), confident: false };
}
