"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { setLocale } from "@/lib/i18n/actions";
import { locales, type Locale } from "@/lib/i18n/config";

// Each language is named in itself, so it can be found whatever the current one is.
const LANGUAGE_NAMES: Record<Locale, string> = { pt: "Português", en: "English" };

/** Lets the user override the language picked automatically. Place it in settings (or a public footer). */
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const t = useTranslations("dashboard.settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label={t("languageLabel")}
      disabled={isPending}
      value={locale}
      onChange={(event) => {
        const next = event.target.value;
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
    >
      {locales.map((value) => (
        <option key={value} value={value} lang={value}>
          {LANGUAGE_NAMES[value]}
        </option>
      ))}
    </NativeSelect>
  );
}
