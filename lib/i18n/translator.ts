import { createTranslator } from "next-intl";
import type { Locale } from "./config";
import en from "../../messages/en.json";
import pt from "../../messages/pt.json";

const messages = { en, pt } satisfies Record<Locale, unknown>;

/**
 * Translator for code with no request/React context: emails, push payloads, the worker. Plain function, so it also works
 * in the react-email preview. Inside pages use `getTranslations()` (server) or `useTranslations()` (client) instead.
 */
export function getTranslator(locale: Locale) {
  return createTranslator({ locale, messages: messages[locale] });
}
