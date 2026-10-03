# Operations: configuration, security and monitoring

Everything needed to run the app safely in production. Code lives in `lib/env.ts`, `lib/rate-limit.ts`, `lib/logger.ts`, `lib/health.ts`, `lib/security-headers.ts`, `proxy.ts` and `instrumentation*.ts`.

## Environment validation

`lib/env.ts` validates every variable with zod.

- **At boot** (`instrumentation-node.ts` for the app, `workers/index.ts` for the worker) `assertEnv()` runs. In production it also requires `BETTER_AUTH_URL` (https), a `BETTER_AUTH_SECRET` of 32+ characters, Resend credentials when `EMAIL_PROVIDER=resend`, a Dodo webhook key when its API key is set, and valid `PAYMENT_CATALOG` JSON. A bad configuration logs every problem and exits with code 1, so the deploy fails instead of serving errors.
- **Groups are all-or-none**: Google OAuth, Web Push (VAPID), WhatsApp and object storage. A half-configured group is an error in every environment.
- **Empty strings count as unset**, so `KEY=` lines copied from `.env.example` are fine.
- `getEnv()` is lenient (no production requirements) so `next build` works without secrets. Read config through it in new code; add new variables to the schema.

## Rate limiting

`lib/rate-limit.ts` keeps fixed-window counters in Redis (atomic Lua script, shared by every replica). It fails open and logs when Redis is down.

```ts
const limited = await enforceRateLimit("checkout", session.user.id, RATE_LIMITS.userSensitive);
if (limited) return limited; // 429 with Retry-After
```

- Key authenticated routes by user id and public ones by `getClientIp(request)`.
- Presets in `RATE_LIMITS`: `userWrite`, `userSensitive`, `userRead`, `webhook`, `publicRead`, `internal`.
- Better Auth uses the same Redis counters (`customStorage`) with stricter rules for OTP endpoints. Better Auth enables its limiter in production only.
- `TRUSTED_PROXY_HOPS` (default 1) says how many proxies sit in front of the app. Set it correctly: too high lets clients spoof their IP, `0` ignores `X-Forwarded-For` (all requests then share the `unknown` bucket).

## Security headers and CSP

- `next.config.ts` sends the static headers from `lib/security-headers.ts` (nosniff, frame denial, referrer and permissions policy, HSTS in production).
- `proxy.ts` sets a **per-request CSP with a nonce** on document requests and a request id (`x-request-id`). Because the nonce is per request, **all pages render dynamically**. `app/layout.tsx` passes the nonce to `next-themes`.
- `style-src` keeps `'unsafe-inline'`: Radix, Base UI and Sonner set inline `style` attributes, which cannot carry a nonce.
- Other origins are derived from env: storage (`STORAGE_PUBLIC_ENDPOINT`/`STORAGE_ENDPOINT`, for direct uploads and images) and the Sentry ingest host. A new third-party script, image host or API called from the browser must be added in `cspOriginsFromEnv` or `buildCsp`, otherwise the browser blocks it (check the console).

## Health checks

| Endpoint                  | Meaning                                                                    | Use for                            |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| `GET /api/health`         | The process is up. Touches no dependency.                                  | Liveness / container `HEALTHCHECK` |
| `GET /api/ready`          | 200 only if PostgreSQL and Redis answer (2 s timeout each), otherwise 503. | Load balancer / readiness          |
| Worker `GET :3100/health` | Every BullMQ worker is running and Redis answers.                          | Worker container healthcheck       |

Both are wired into `Dockerfile` and `docker-compose.yml`. Responses never include error details.

## Logging and errors

- `lib/logger.ts` (pino) writes one JSON line per event with `level`, `service` (`app` or `worker`), and `requestId` where a request logger is used. Set `LOG_LEVEL`. Secrets in `password`, `token`, `secret` and `authorization` fields are redacted.
- Unhandled server errors are logged with their digest, path and request id (`onRequestError`), and the browser shows the same digest as "Referência", so support can find the log line.
- Set `SENTRY_DSN` (server and worker) and `NEXT_PUBLIC_SENTRY_DSN` (browser, build time) to also report to Sentry. Without them nothing is sent. Source maps are not uploaded; add `withSentryConfig` and an auth token if you need readable stack traces.
- Error screens: `app/error.tsx`, `app/(dashboard)/error.tsx` (keeps the sidebar), `app/global-error.tsx` (root layout crash) and `app/not-found.tsx`. In this Next.js version the retry prop is named `retry`.

## Tests and CI

- `npm test` runs Vitest (`*.test.ts`, Node environment). Database, Redis and providers are mocked; keep tests next to the code they cover.
- Payment webhook signatures, payment event idempotency and amount checks, the auth guard and ownership checks, rate limiting, env validation, CSP and health checks are covered. Add a test whenever you add a webhook or a route that changes data.
- `.github/workflows/ci.yml` runs lint, typecheck, tests, build and `npm audit`; applies migrations to a real PostgreSQL and fails on schema drift; and builds both Docker images. Dependabot updates npm, Actions and Docker weekly.
- Not covered yet: browser end-to-end tests (add Playwright against `docker compose`) and tests against a real database.
