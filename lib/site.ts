/** Public origin of the app (used for canonical URLs, sitemap and Open Graph). Falls back to localhost in development. */
export function siteUrl() {
  return new URL(process.env.BETTER_AUTH_URL || "http://localhost:3000");
}

export const SITE_NAME = "Nextpad";
