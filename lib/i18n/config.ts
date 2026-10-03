export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];

/** Used when neither the user's choice nor the visitor's country says otherwise. */
export const defaultLocale: Locale = "en";

/** Holds the locale: set once by proxy.ts for first-time visitors, afterwards only by the language switcher. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
/** Request header proxy.ts uses to hand the freshly detected locale to the render of the very first request. */
export const LOCALE_HEADER = "x-locale";

/** A user's own choice sticks for a year; an automatic guess that is not confident (see detect.ts) expires sooner. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const GUESSED_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24;

/** ISO 3166-1 countries where Portuguese is an official language (CPLP members plus Macau). */
export const PORTUGUESE_COUNTRIES: ReadonlySet<string> = new Set([
  "PT",
  "BR",
  "AO",
  "MZ",
  "CV",
  "GW",
  "ST",
  "TL",
  "GQ",
  "MO",
]);

/** BCP 47 tag used for number/date formatting (the message locale above is only the language). */
export const FORMAT_LOCALE: Record<Locale, string> = { pt: "pt-MZ", en: "en-US" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
