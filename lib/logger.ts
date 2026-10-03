import pino from "pino";

/** Structured JSON logger shared by the app and the worker. Level comes from LOG_LEVEL (default: info). */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "test" ? "silent" : "info"),
  base: { service: process.env.SERVICE_NAME ?? "app" },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  // Never log credentials or tokens even if an object containing them is passed by mistake.
  redact: {
    paths: ["*.password", "*.token", "*.secret", "*.authorization", "headers.authorization", "headers.cookie"],
    censor: "[redacted]",
  },
});

/** Child logger carrying a request id so every line of one request can be correlated. */
export function requestLogger(request: Request) {
  return logger.child({ requestId: request.headers.get("x-request-id") ?? undefined });
}
