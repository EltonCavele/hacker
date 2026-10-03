"use client";

import { NextIntlClientProvider } from "next-intl";
import { useSyncExternalStore } from "react";
import { ErrorState } from "@/components/error-state";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import "./globals.css";

const messages = { en, pt } satisfies Record<Locale, unknown>;

function readLocaleCookie(): Locale {
  const value = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))?.[1];
  return isLocale(value) ? value : defaultLocale;
}

const subscribeNever = () => () => {};

// Replaces the root layout when it crashes, so it renders its own <html>/<body> and provider, without the server's
// message context: both dictionaries are bundled and the language comes from the cookie. No theme provider: it follows the OS.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // The server snapshot keeps the first client render equal to the server markup; the cookie is read after hydration.
  const locale = useSyncExternalStore(subscribeNever, readLocaleCookie, () => defaultLocale);

  return (
    <html lang={locale}>
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages[locale]}>
          <ErrorState error={error} retry={retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
