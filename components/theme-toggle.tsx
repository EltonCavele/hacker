"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "reicon-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/** Switches between light and dark. Place it in headers/settings. */
export function ThemeToggle() {
  const t = useTranslations("dashboard.settings");
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      size="icon"
      variant="outline"
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
