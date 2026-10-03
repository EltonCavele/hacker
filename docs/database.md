# Database

The project uses PostgreSQL through Prisma. The client is initialized in `lib/db/client.ts`; the schema and migrations are under `prisma/`.

## Working with data

- Use the shared `prisma` client; do not create a client for each request.
- Keep database access on the server.
- Select only fields needed by the caller, especially for user-facing queries.
- Scope private reads and writes by the authenticated user's ID.
- Use transactions when a group of database writes must succeed or fail together.
- Add a migration when changing the schema. Do not edit generated Prisma output by hand.

The schema contains Better Auth models, tasks, messaging conversations and messages, payment purchases, provider events, and subscriptions. Unique constraints support idempotency for external message IDs, checkout IDs, payment IDs, webhook event IDs, and subscription IDs.

Use `npm run db:migrate -- --name <name>` for a development migration. Use `npm run db:deploy` to apply existing migrations and generate the Prisma client in deployment workflows. The default local connection is `postgres://postgres:postgres@localhost:5432/app`; configure `DATABASE_URL` for other environments.

## Seed

`npm run db:seed` (also run by `prisma migrate reset`) creates `demo@example.com` with a few tasks. It is idempotent and refuses to run when `NODE_ENV=production`. Sign in with an email code; with `EMAIL_PROVIDER=log` the code is printed in the server console.

## Migrations in deployment

Apply migrations once per release, before the new version receives traffic, from a single job (`npm run db:deploy`; Compose does this in the one-shot `migrate` service). Do not run them from every app replica's start command. `prisma migrate deploy` takes a database advisory lock, so concurrent runs are safe but one waits for the other. Make migrations backward compatible (add, then backfill, then drop in a later release) so the previous version keeps working while the rollout happens. The `migrate` Docker stage contains the Prisma CLI; the `runner` image does not.

Existing history note: `20261001114329_add_payments` renames `payment_purchases.user_id` to `"userId"` by dropping and re-adding it, which fails on a non-empty table. It is fine for a fresh database; if you have deployed data, replace it with `ALTER TABLE ... RENAME COLUMN` before the first production deploy.

## Connection pooling

The app and worker each keep a `pg` pool (default 10). Size it with `DATABASE_POOL_MAX` so that replicas × (app + worker) pools stay below PostgreSQL's `max_connections`. With many replicas or serverless-style scaling, put PgBouncer (transaction mode) in front and point `DATABASE_URL` at it; run migrations against the direct database URL, since they need session-level locks.

## Backups

- `npm run db:backup` writes a compressed `pg_dump` to `backups/` (git-ignored). `npm run db:restore -- <file>` restores it after a confirmation prompt. Both need the PostgreSQL client tools matching the server major version.
- In production prefer the provider's managed backups with point-in-time recovery (Railway, RDS, Neon, ...) and keep scheduled `db:backup` dumps stored off the database host as a second copy.
- A backup you never restored is not a backup: rehearse `db:restore` into a scratch database on a schedule and check that the app boots against it.
- Redis holds only caches, rate-limit counters and queue state; losing it is recoverable. The outbox table in PostgreSQL is the source of truth for events not yet queued.
