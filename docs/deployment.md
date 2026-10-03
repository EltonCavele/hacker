# Deployment

Three processes plus three backing services make a deployment:

| Piece                                        | What                                                                                     | Image / command                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `app`                                        | Next.js standalone server, port 3000                                                     | `Dockerfile`, stage `runner`                          |
| `worker`                                     | BullMQ consumers, outbox relay, daily maintenance; health on `WORKER_HEALTH_PORT` (3100) | `Dockerfile`, stage `worker` (or `Dockerfile.worker`) |
| `migrate`                                    | One-shot `prisma migrate deploy`                                                         | `Dockerfile`, stage `migrate`                         |
| PostgreSQL 17, Redis 7, S3-compatible bucket | State                                                                                    | managed service of your platform                      |

Configuration is environment variables only; `.env.example` lists them and `lib/env.ts` validates them at boot (production refuses to start with a missing or weak `BETTER_AUTH_SECRET`, a non-https `BETTER_AUTH_URL`, ...). See [operations.md](operations.md).

## Release procedure

1. Build the images from the commit CI passed on (`NEXT_PUBLIC_*` values are build args, they are baked into the browser bundle).
2. Run the `migrate` image once against the production database. Migrations must be backward compatible with the version still serving traffic ([database.md](database.md#migrations-in-deployment)).
3. Roll out `app`, waiting for `/api/ready` to answer 200 (it checks PostgreSQL and Redis). Roll out `worker`; it stops gracefully on SIGTERM and lets running jobs finish (30 s).
4. Smoke test: sign in, create a task, check `/api/ready` and the worker's `/health`.

## Rollback

- **Code**: redeploy the previous image tag (platforms keep previous deployments; Railway: _Deployments → Redeploy/Rollback_). Because migrations are additive, the old version keeps working on the new schema.
- **Schema**: do not run `migrate reset` or edit applied migrations. Ship a new forward migration that undoes the change. If data was damaged, restore a backup ([database.md](database.md#backups)).
- **Queued work** survives a rollback: BullMQ jobs live in Redis and unpublished events in the `outbox_events` table.

## Railway

1. Create a project with PostgreSQL, Redis and a Bucket (or any S3-compatible storage) and map their connection variables to `DATABASE_URL`, `REDIS_URL` and the `STORAGE_*` variables.
2. Service `app`: deploy this repository; `railway.toml` selects the Dockerfile and sets the `/api/ready` health check. Set `BETTER_AUTH_URL` to the public https URL, a random `BETTER_AUTH_SECRET` (32+ characters), email, OAuth and payment variables, and `TRUSTED_PROXY_HOPS` (check how many proxies sit in front of the app, usually 1).
3. Service `worker`: same repository, config file `railway.worker.toml` (uses `Dockerfile.worker`). It needs the same `DATABASE_URL`, `REDIS_URL`, `STORAGE_*`, `VAPID_*` and `SENTRY_DSN`, but no public domain.
4. Migrations: run `npm run db:deploy` as a one-off with the production `DATABASE_URL` (from CI or `railway run`) before each release. Do this from one place only, not in every service's start command.
5. Storage lifecycle: in the bucket add a rule that expires objects under the `pending/` prefix after 1 day (MinIO in Compose gets this automatically; see [storage.md](storage.md)).
6. Configure the webhook URLs in the Meta, EPay and Dodo dashboards to your public domain (`/api/messaging/whatsapp/webhook`, `/api/payments/epay/webhook`, `/api/payments/dodo/webhook`).

Other platforms follow the same shape: build the image, run `migrate`, start `app` and `worker`, probe `/api/ready` and the worker `/health`.
