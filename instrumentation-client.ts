import * as Sentry from "@sentry/nextjs";

// Inlined at build time (NEXT_PUBLIC_*). Without a DSN the browser SDK is never initialised.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
