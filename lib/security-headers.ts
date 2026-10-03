/** Headers sent on every response. Kept free of imports so both next.config.ts and proxy.ts can use it. */
export function staticSecurityHeaders(isProduction: boolean) {
  const headers = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
  ];
  // Browsers ignore HSTS over plain http, but never advertise it from a dev server.
  if (isProduction) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  return headers;
}

function originOf(value: string | undefined) {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

type CspOptions = {
  nonce: string;
  isDev: boolean;
  /** Upgrade http subresources only when the site itself is served over https. */
  upgradeInsecure: boolean;
  /** Origins the browser talks to besides this app: object storage (direct presigned uploads), Sentry... */
  connectOrigins: Array<string | undefined>;
  imageOrigins: Array<string | undefined>;
};

export function buildCsp({ nonce, isDev, upgradeInsecure, connectOrigins, imageOrigins }: CspOptions) {
  const connect = ["'self'", ...connectOrigins.filter(Boolean)];
  const images = ["'self'", "blob:", "data:", ...imageOrigins.filter(Boolean)];
  const directives = [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonce-trusted Next.js bootstrap load its own chunks.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // Radix, Base UI and Sonner position floating UI with inline style attributes, which cannot carry a nonce.
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}${isDev ? " ws: wss:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (upgradeInsecure) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

/** Origins for the CSP derived from env: the storage endpoint (uploads/avatars) and the Sentry ingest host. */
export function cspOriginsFromEnv(env: Record<string, string | undefined>) {
  const storage = originOf(env.STORAGE_PUBLIC_ENDPOINT) ?? originOf(env.STORAGE_ENDPOINT);
  const sentry = originOf(env.NEXT_PUBLIC_SENTRY_DSN);
  return {
    // Google profile pictures are shown for accounts that sign in with Google.
    imageOrigins: [storage, "https://lh3.googleusercontent.com"],
    connectOrigins: [storage, sentry],
  };
}
