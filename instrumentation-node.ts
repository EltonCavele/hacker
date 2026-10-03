import * as Sentry from "@sentry/nextjs";
import type { Instrumentation } from "next";
import { assertEnv } from "./lib/env";
import { logger } from "./lib/logger";

// Validate before anything else so a bad deploy crashes at boot instead of failing on the first request.
function validateEnvOrExit() {
  try {
    return assertEnv();
  } catch (error) {
    // Exit so the orchestrator restarts/rolls back loudly, rather than leaving a server that answers 500 to everything.
    logger.fatal({ err: error }, "Invalid environment configuration");
    process.exit(1);
  }
}

const env = validateEnvOrExit();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

export function reportRequestError(
  error: unknown,
  request: Parameters<Instrumentation.onRequestError>[1],
  context: Parameters<Instrumentation.onRequestError>[2],
) {
  logger.error(
    {
      err: error,
      digest: (error as { digest?: string } | null)?.digest,
      path: request.path,
      method: request.method,
      requestId: request.headers["x-request-id"],
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "Unhandled request error",
  );
  if (env.SENTRY_DSN) Sentry.captureRequestError(error, request, context);
}
