# Queues and workers

BullMQ helpers are in `lib/queue/index.ts`. Queue producers can run in app code; consumers run from `workers/index.ts` as a separate process.

## Existing queues

- `task-events` receives `task.created` jobs from `features/tasks/actions.ts`.
- `messaging-inbound` receives persisted inbound WhatsApp messages from `features/messaging/service.ts`.
- `workers/index.ts` creates consumers for both queues. Their current processors log the job; the messaging processor is a placeholder for application handling.

Use the same queue name and payload type at producer and consumer. Make processors safe to retry: BullMQ jobs can run more than once. The messaging producer sets five attempts with exponential backoff and a stable job ID based on the stored message ID.

PostgreSQL and Redis do not share a transaction. For events that must not be lost, use the transactional outbox: call `enqueueOutbox(tx, queue, name, payload)` (`lib/outbox`) inside the same `prisma.$transaction` as the change (see `createTask`). The worker polls the `outbox_events` table every 2 s (`FOR UPDATE SKIP LOCKED`, safe with several replicas) and publishes to BullMQ with the outbox id as job id, so delivery is at-least-once and republishing is deduplicated. Failed publishes back off exponentially; published rows are purged after 7 days.

## Retries, failed jobs and maintenance

- `createQueue` applies defaults to every job: 5 attempts with exponential backoff (2 s base), completed jobs trimmed after 1 h, failed jobs kept for 7 days. BullMQ's _failed_ set is the dead-letter queue: inspect it with `queue.getFailed()` and retry with `job.retry()`; the worker logs final failures and reports them to Sentry. Override per job when needed.
- `WORKER_CONCURRENCY` (default 5) sets parallel jobs per queue.
- The `maintenance` queue runs daily at 03:00 (`lib/maintenance.ts`): deletes expired sessions and verifications, push subscriptions revoked for over 30 days, and old processed outbox rows. The schedule is upserted by every worker, so it runs once in total.
- Shutdown waits up to 30 s for running jobs. Processors must be idempotent.

Run the worker with `npm run worker`. On shutdown, close workers so active jobs can finish. Queue connections use `REDIS_URL` or `redis://localhost:6379` by default.
