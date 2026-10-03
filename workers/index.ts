import "./service-name";
import { createServer } from "node:http";
import * as Sentry from "@sentry/node";
import type { Job, Worker } from "bullmq";
import { assertEnv } from "../lib/env";
import { logger } from "../lib/logger";
import { runMaintenance } from "../lib/maintenance";
import { closeOutboxQueues, purgeProcessedOutbox, relayOutbox } from "../lib/outbox/relay";
import { createQueue, createWorker } from "../lib/queue";
import type { InboundMessageJob } from "../lib/messaging";
import { deliverPush } from "../lib/push/deliver";
import { PUSH_QUEUE, type PushJob } from "../lib/push/types";

// Crash at boot on a broken configuration instead of failing jobs one by one later.
const env = assertEnv();

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 0,
  });
}

const SHUTDOWN_TIMEOUT_MS = 30_000;

const worker = createWorker<{ taskId: string }>("task-events", async (job) => {
  logger.info({ jobId: job.id, taskId: job.data.taskId }, `Processed ${job.name}`);
});

const messagingWorker = createWorker<InboundMessageJob>("messaging-inbound", async (job) => {
  logger.info(
    { id: job.data.messageId, channel: job.data.channel, contentType: job.data.contentType },
    "Inbound message ready for application handling",
  );
});

const pushWorker = createWorker<PushJob>(PUSH_QUEUE, async (job) => {
  await deliverPush(job.data);
});

const MAINTENANCE_QUEUE = "maintenance";
const maintenanceWorker = createWorker<Record<string, never>>(MAINTENANCE_QUEUE, async (job) => {
  const outbox = await purgeProcessedOutbox();
  logger.info({ jobId: job.id, ...(await runMaintenance()), outbox }, "Maintenance finished");
});

// Repeatable job, deduplicated by scheduler id: every replica upserts the same schedule, so it runs once a day in total.
const maintenanceQueue = createQueue<Record<string, never>>(MAINTENANCE_QUEUE);
void maintenanceQueue
  .upsertJobScheduler("daily-maintenance", { pattern: "0 3 * * *" }, { name: "maintenance.run", data: {} })
  .catch((error) => logger.error({ err: error }, "Could not schedule maintenance"));

// Transactional outbox relay: publishes events written by the app to BullMQ (see lib/outbox).
let relaying = false;
const outboxTimer = setInterval(async () => {
  if (relaying || shuttingDown) return;
  relaying = true;
  try {
    while ((await relayOutbox()) > 0 && !shuttingDown);
  } catch (error) {
    logger.error({ err: error }, "Outbox relay failed");
  } finally {
    relaying = false;
  }
}, 2_000);

const workers: Array<{ name: string; worker: Worker }> = [
  { name: "task-events", worker },
  { name: "messaging-inbound", worker: messagingWorker as Worker },
  { name: PUSH_QUEUE, worker: pushWorker as Worker },
  { name: MAINTENANCE_QUEUE, worker: maintenanceWorker as Worker },
];

for (const { name, worker: instance } of workers) {
  instance.on("failed", (job: Job | undefined, error: Error) => {
    // BullMQ retries according to the job's `attempts`; only the last failure is final.
    const final = job ? job.attemptsMade >= (job.opts.attempts ?? 1) : true;
    logger.error({ err: error, queue: name, jobId: job?.id, attempt: job?.attemptsMade, final }, "Job failed");
    if (final && env.SENTRY_DSN) Sentry.captureException(error, { tags: { queue: name }, extra: { jobId: job?.id } });
  });
  instance.on("error", (error) => logger.error({ err: error, queue: name }, "Worker error"));
}

// Orchestrators need something to probe: GET /health is 200 while every worker is running and Redis answers.
const healthServer = createServer(async (request, response) => {
  if (request.method !== "GET" || request.url !== "/health") {
    response.writeHead(404).end();
    return;
  }
  try {
    const running = workers.every(({ worker: instance }) => instance.isRunning());
    // BullMQ types its client narrowly; at runtime it is an ioredis instance.
    const client = (await worker.client) as unknown as { ping(): Promise<string> };
    await Promise.race([
      client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("redis timeout")), 2000)),
    ]);
    response.writeHead(running ? 200 : 503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: running ? "ok" : "stopped" }));
  } catch {
    response.writeHead(503, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ status: "unavailable" }));
  }
});
healthServer.listen(env.WORKER_HEALTH_PORT, () => {
  logger.info({ port: env.WORKER_HEALTH_PORT }, "Worker health endpoint listening");
});

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "Shutting down: waiting for in-flight jobs");
  const forced = setTimeout(() => {
    logger.error("Shutdown timed out; exiting with jobs still running");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  clearInterval(outboxTimer);
  try {
    // close() lets active jobs finish before resolving.
    await Promise.all(workers.map(({ worker: instance }) => instance.close()));
    await Promise.all([maintenanceQueue.close(), closeOutboxQueues()]);
    healthServer.close();
    if (env.SENTRY_DSN) await Sentry.close(2000);
    clearTimeout(forced);
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error during shutdown");
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void shutdown(signal));
}

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled rejection");
  if (env.SENTRY_DSN) Sentry.captureException(reason);
});
