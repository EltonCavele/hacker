# Next.js Full-Stack Starter

A starter app built with the Next.js App Router, Better Auth, PostgreSQL, Prisma, Redis, and BullMQ. It also includes examples for email, WhatsApp, file storage, and payments.

## Getting started

1. Copy `.env.example` to `.env.docker` and set `BETTER_AUTH_SECRET` to a random secret of at least 32 characters.
2. Start the full stack:

   ```sh
   npm run docker:up
   ```

   Docker builds the app, runs database migrations, and starts PostgreSQL, Redis, MinIO, the Next.js app, and the worker.

3. Open the app at [http://localhost:3000](http://localhost:3000). MinIO is at [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`). PostgreSQL is available on port `5432` and Redis on port `6379`.
4. To enable Google sign-in, add your Google OAuth credentials to `.env.docker` and register `http://localhost:3000/api/auth/callback/google` as a redirect URI in Google Cloud.

Use `npm run docker:logs` to view app and worker logs, and `npm run docker:down` to stop the stack. To run Next.js on your machine and only the infrastructure in Docker, run `npm run dev:infra`, then run `npm run dev` and `npm run worker` in separate terminals.

Docker Compose uses `.env.docker` for both service configuration and app, migration, and worker settings. Keep secrets out of the `Dockerfile`.

Google sign-in is the example login flow. The app can start without OAuth credentials, but sign-in will not work until they are configured.

See `docs/deployment.md` for the release, rollback and Railway guide, and `docs/database.md` for seed, pooling and backups.

## Project structure

```text
app/                 App Router pages, layouts, and route handlers
features/            Feature code
  auth/              Login and authentication UI
  tasks/             Example read and mutation flow
  messaging/         WhatsApp webhook and messaging service
  storage/           File upload service
  payments/          Product catalog and checkout
lib/                 Shared services and infrastructure
  auth/               Better Auth setup
  cache/              Redis data cache
  dal/                Session and data access
  db/                 Prisma client
  email/              Email provider interface and adapters
  messaging/          Messaging provider interface and adapters
  storage/            Object storage interface and adapters
  payments/           Payment provider interface and adapters
  queue/              BullMQ setup
workers/             Background job worker
prisma/               Database schema and migrations
generated/prisma/     Generated Prisma client
```

## How it works

- Server Components read data through server-side queries. They do not make HTTP calls back to this app.
- Server Actions validate input and check authentication and authorization before changing data. The server-only data access layer returns only the data each screen needs.
- Better Auth and the app share the Prisma client and database schema.
- Use `npm run db:migrate -- --name <name>` for development migrations. Use `npm run db:deploy` to apply existing migrations in production; it also generates the Prisma client.
- Redis caches have a time-to-live. Include the user or tenant in cache keys for private data. The app continues if the cache is unavailable.
- The example stores `task.created` in an outbox table in the same transaction as the task; the worker relays it to BullMQ, so the event is not lost if Redis is down (see `docs/queues-and-workers.md`).
- Email uses `sendEmail` from `lib/email`. Set `EMAIL_PROVIDER` to choose a provider; Resend is included.
- Messaging stores conversations and messages in PostgreSQL and queues inbound events for the worker. The included WhatsApp adapter sends directly to Meta. Its webhook verifies Meta requests and updates message status. Sending is text-only; handle media and interactive messages in your app as needed.
- Storage uses an S3-compatible provider. MinIO, Amazon S3, and Railway Bucket can use the same interface. Authenticated uploads receive a private, five-minute PUT URL, and a second call verifies the file's type and content before it is kept (`docs/storage.md`). Check access in your feature before issuing download URLs or deleting files.
- Production readiness: environment validation at boot, Redis rate limiting, security headers with a nonce-based CSP, `/api/health` and `/api/ready`, structured logs, optional Sentry, tests (`npm test`) and CI. See [docs/operations.md](docs/operations.md).
- Payments include EPay and Dodo Payments adapters. Products and prices are configured on the server; the client sends only a product ID. The checkout route creates an authenticated pending purchase, while public webhooks verify and record payment events. The payments dashboard shows the catalog and history. Connect a paid purchase to your app's own access flow.
- Schedule `POST /api/payments/epay/reconcile` every five minutes to check pending EPay payments if a webhook is missed. Send `Authorization: Bearer <EPAY_RECONCILIATION_TOKEN>`.
- `app/api/auth/[...all]/route.ts` handles Better Auth. Other route handlers are for external APIs, webhooks, and dedicated HTTP protocols.

## Environment variables

See `.env.example` for the full list. In Docker, services connect to `postgres`, `redis`, and `minio`; use `localhost` for tools running on your machine. Set `STORAGE_PUBLIC_ENDPOINT` to `http://localhost:9000` for local browser uploads. Configure bucket CORS to allow your app's origin and `PUT` requests with the `Content-Type` header.

For production, configure `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, `REDIS_URL`, and your OAuth credentials. Never expose secrets with the `NEXT_PUBLIC_` prefix.

Configure providers as needed:

- **Amazon S3:** Leave `STORAGE_ENDPOINT` empty and use an AWS role or credentials. For Railway Bucket, use the endpoint, region, bucket, and credentials from Railway.
- **Payments:** Set `PAYMENT_CATALOG` to JSON. Set `EPAY_SECRET_KEY` and configure the EPay callback at `/api/payments/epay/webhook`. For Dodo, set `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, and `DODO_PAYMENTS_ENVIRONMENT`, and add each product's `providerProductId`. Register both webhook URLs with their providers.
- **Email:** Set `EMAIL_PROVIDER=resend`, a verified `EMAIL_FROM` address, and `RESEND_API_KEY`.
- **WhatsApp:** Set `META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_WHATSAPP_PHONE_NUMBER_ID`, and `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Register `/api/messaging/whatsapp/webhook` as the Meta callback and subscribe to `messages`.

Example payment catalog:

```json
[
  { "id": "starter", "name": "Starter", "provider": "EPAY", "currency": "MZN", "amountMinor": 10000 },
  {
    "id": "pro",
    "name": "Pro",
    "provider": "DODO",
    "currency": "USD",
    "amountMinor": 1000,
    "providerProductId": "pdt_xxx"
  }
]
```

These prices are examples. Replace them with your own products and prices. Amounts use the currency's minor units.

## Examples

### Upload a file

```ts
const { key, url, method, headers } = await fetch("/api/storage/upload", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
}).then((response) => {
  if (!response.ok) throw new Error("Could not start the upload");
  return response.json();
});

const uploaded = await fetch(url, { method, headers, body: file });
if (!uploaded.ok) throw new Error("Upload failed");
// Save `key` on the app record associated with this file.
```

The upload size is limited by `STORAGE_MAX_UPLOAD_BYTES`, and the file type must match the signed request.

### Send an email

```ts
import { sendEmail } from "@/lib/email";

await sendEmail({
  to: "user@example.com",
  subject: "Welcome",
  html: "<p>Your account is ready.</p>",
  text: "Your account is ready.",
});
```

Call `sendEmail` only from server code, such as an authenticated Server Action, Route Handler, or worker. Validate recipients and content at the entry point.

### Send a WhatsApp message

```ts
import { sendMessage } from "@/features/messaging/service";

await sendMessage({
  channel: "whatsapp",
  recipient: "258840000000",
  text: "Hello!",
  sentByUserId: user.id,
});
```

Call `sendMessage` from server code and provide the authenticated user when applicable. Meta accepting a message does not mean it was delivered; webhooks update its status to `sent`, `delivered`, `read`, or `failed`.
