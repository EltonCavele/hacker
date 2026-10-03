"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Class-based theming (`.dark` on <html>). Wrap the app once in app/layout.tsx. `nonce` lets its inline no-flash script pass the CSP. */
export function ThemeProvider({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange nonce={nonce}>
      {children}
    </NextThemesProvider>
  );
}
