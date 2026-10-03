import { z } from "zod";

/** Env vars arrive as "" when a key is listed in .env without a value; treat that as unset. */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());
const withDefault = <T extends z.ZodType>(schema: T, fallback: z.output<T>) =>
  z.preprocess(emptyToUndefined, schema.default(fallback as never));

const optionalString = optional(z.string());
const optionalUrl = optional(z.url());
const positiveInt = optional(z.coerce.number().int().positive());

const schema = z.object({
  NODE_ENV: withDefault(z.enum(["development", "test", "production"]), "development"),

  DATABASE_URL: withDefault(z.string().min(1), "postgres://postgres:postgres@localhost:5432/app"),
  /** Max connections in this process's pg pool. Keep (replicas x this) below the database / PgBouncer limit. */
  DATABASE_POOL_MAX: positiveInt,
  REDIS_URL: withDefault(z.string().min(1), "redis://localhost:6379"),

  BETTER_AUTH_URL: optionalUrl,
  BETTER_AUTH_SECRET: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  EMAIL_PROVIDER: withDefault(z.enum(["resend", "log"]), "resend"),
  EMAIL_FROM: optionalString,
  RESEND_API_KEY: optionalString,

  MESSAGING_PROVIDER: withDefault(z.enum(["whatsapp", "log"]), "whatsapp"),
  META_ACCESS_TOKEN: optionalString,
  META_APP_SECRET: optionalString,
  META_WHATSAPP_PHONE_NUMBER_ID: optionalString,
  META_WHATSAPP_WEBHOOK_VERIFY_TOKEN: optionalString,

  STORAGE_PROVIDER: withDefault(z.string(), "s3"),
  STORAGE_BUCKET: optionalString,
  STORAGE_ENDPOINT: optionalString,
  STORAGE_PUBLIC_ENDPOINT: optionalString,
  STORAGE_ACCESS_KEY_ID: optionalString,
  STORAGE_SECRET_ACCESS_KEY: optionalString,
  STORAGE_MAX_UPLOAD_BYTES: positiveInt,

  PAYMENT_CATALOG: optionalString,
  EPAY_SECRET_KEY: optionalString,
  EPAY_WEBHOOK_URL: optionalUrl,
  EPAY_RECONCILIATION_TOKEN: optionalString,
  DODO_PAYMENTS_API_KEY: optionalString,
  DODO_PAYMENTS_WEBHOOK_KEY: optionalString,

  VAPID_SUBJECT: optionalString,
  VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,

  /** Shown on /terms and /privacy. */
  LEGAL_COMPANY_NAME: optionalString,
  LEGAL_CONTACT_EMAIL: optional(z.email()),
  LOG_LEVEL: withDefault(z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]), "info"),
  SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  /** Number of reverse proxies in front of the app, used to read the client IP from X-Forwarded-For. */
  TRUSTED_PROXY_HOPS: withDefault(z.coerce.number().int().min(0).max(10), 1),
  /** Country lookup used to pick the first-visit language; must contain `{ip}`. See docs/i18n.md. */
  GEOIP_URL: optional(z.string().includes("{ip}")),
  WORKER_HEALTH_PORT: withDefault(z.coerce.number().int().min(0).max(65535), 3100),
});

export type Env = z.infer<typeof schema>;

/** Groups of variables that only make sense together: either all are set or none. */
const ALL_OR_NONE: Array<{ label: string; keys: Array<keyof Env> }> = [
  { label: "Google OAuth", keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"] },
  { label: "Web Push (VAPID)", keys: ["VAPID_SUBJECT", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"] },
  {
    label: "WhatsApp (Meta)",
    keys: [
      "META_ACCESS_TOKEN",
      "META_APP_SECRET",
      "META_WHATSAPP_PHONE_NUMBER_ID",
      "META_WHATSAPP_WEBHOOK_VERIFY_TOKEN",
    ],
  },
  {
    label: "Object storage",
    keys: ["STORAGE_BUCKET", "STORAGE_ENDPOINT", "STORAGE_ACCESS_KEY_ID", "STORAGE_SECRET_ACCESS_KEY"],
  },
];

/** Variables that must be set when the app runs in production. */
function productionIssues(env: Env): string[] {
  const issues: string[] = [];
  if (!env.BETTER_AUTH_URL) issues.push("BETTER_AUTH_URL is required in production");
  else if (!env.BETTER_AUTH_URL.startsWith("https://") && !isLocalUrl(env.BETTER_AUTH_URL)) {
    issues.push("BETTER_AUTH_URL must use https:// in production");
  }
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
    issues.push("BETTER_AUTH_SECRET is required in production and must have at least 32 characters");
  }
  if (env.EMAIL_PROVIDER === "resend" && !(env.RESEND_API_KEY && env.EMAIL_FROM)) {
    issues.push("EMAIL_PROVIDER=resend requires RESEND_API_KEY and EMAIL_FROM (or set EMAIL_PROVIDER=log)");
  }
  if (env.DODO_PAYMENTS_API_KEY && !env.DODO_PAYMENTS_WEBHOOK_KEY) {
    issues.push("DODO_PAYMENTS_API_KEY requires DODO_PAYMENTS_WEBHOOK_KEY (webhooks would be rejected)");
  }
  if (env.EPAY_SECRET_KEY && !env.EPAY_WEBHOOK_URL) {
    issues.push("EPAY_SECRET_KEY requires EPAY_WEBHOOK_URL");
  }
  if (env.PAYMENT_CATALOG) {
    try {
      JSON.parse(env.PAYMENT_CATALOG);
    } catch {
      issues.push("PAYMENT_CATALOG must be valid JSON");
    }
  }
  return issues;
}

function isLocalUrl(value: string) {
  const { hostname } = new URL(value);
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export class EnvError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join("\n")}`);
    this.name = "EnvError";
  }
}

/**
 * Validates a set of env vars. With `strict` (production runtime) it also enforces required secrets and
 * provider credentials; without it, only types, formats and all-or-none groups are checked.
 */
export function parseEnv(source: Record<string, string | undefined>, { strict = false } = {}): Env {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new EnvError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
  const env = result.data;
  const issues: string[] = [];
  for (const group of ALL_OR_NONE) {
    const present = group.keys.filter((key) => env[key] !== undefined);
    if (present.length > 0 && present.length < group.keys.length) {
      const missing = group.keys.filter((key) => env[key] === undefined);
      issues.push(`${group.label} is partially configured; missing ${missing.join(", ")}`);
    }
  }
  if (strict) issues.push(...productionIssues(env));
  if (issues.length > 0) throw new EnvError(issues);
  return env;
}

let cached: Env | undefined;

/** Typed, memoised env. Lenient: safe to import at build time, where production secrets are not available. */
export function getEnv(): Env {
  return (cached ??= parseEnv(process.env));
}

/**
 * Fails fast when a production process starts with a broken configuration.
 * Call once at boot (instrumentation.ts for the app, workers/index.ts for the worker).
 */
export function assertEnv(): Env {
  cached = parseEnv(process.env, { strict: process.env.NODE_ENV === "production" });
  return cached;
}
