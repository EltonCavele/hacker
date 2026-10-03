import type en from "./messages/en.json";
import type { Locale } from "./lib/i18n/config";

// Type-checks every `t("key")` against messages/en.json.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof en;
  }
}
