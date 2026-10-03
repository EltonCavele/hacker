import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeColor } from "@/components/theme-color";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FORMAT_LOCALE, type Locale } from "@/lib/i18n/config";
import { SITE_NAME, siteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("meta"), getLocale()]);
  return {
    metadataBase: siteUrl(),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: t("description"),
    openGraph: { type: "website", siteName: SITE_NAME, locale: FORMAT_LOCALE[locale as Locale].replace("-", "_") },
    twitter: { card: "summary_large_image" },
    appleWebApp: { capable: true, title: "Nextpad", statusBarStyle: "default" },
    icons: { apple: "/pwa-icon/apple" },
  };
}

// Server-rendered browser chrome colour, one per colour scheme (= --background). <ThemeColor /> then keeps it in sync with
// the active theme and any per-screen override.
export const viewport: Viewport = {
  maximumScale: 1, // no pinch zoom / focus auto-zoom; desktop browsers ignore the viewport meta, so this only affects mobile
  userScalable: false,
  viewportFit: "cover", // lets env(safe-area-inset-*) report the home indicator / notch
  interactiveWidget: "resizes-content", // Android: the on-screen keyboard shrinks the layout viewport instead of covering content
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Set per request by proxy.ts; lets next-themes' inline script pass the Content-Security-Policy.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ThemeProvider nonce={nonce}>
            <ThemeColor />
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
