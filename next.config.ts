import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { staticSecurityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Reuse visited dynamic pages on the client for 30s so navigating back does not refetch.
    // Mutations call revalidatePath/router.refresh(), which clears this cache.
    staleTimes: { dynamic: 30, static: 180 },
  },
  poweredByHeader: false,
  // Dev only: lets a phone on the same Wi-Fi (http://192.168.x.x:3000) load the dev JS chunks. Without this Next blocks
  // them, the page never hydrates and forms fall back to a native submit, which just reloads the page.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  async headers() {
    return [
      {
        // The Content-Security-Policy is per request (nonce), so it is set in proxy.ts instead.
        source: "/:path*",
        headers: staticSecurityHeaders(process.env.NODE_ENV === "production"),
      },
      {
        // Always revalidate the service worker so updates ship immediately.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
