import { standalonePrisma as prisma } from "../db/standalone";
import { logger } from "../logger";
import { createQueue } from "../queue";

type Row = { id: string; queue: string; name: string; payload: object; attempts: number };

const BATCH_SIZE = 50;
const MAX_BACKOFF_MS = 5 * 60_000;

const queues = new Map<string, ReturnType<typeof createQueue<object>>>();
function queueFor(name: string) {
  let queue = queues.get(name);
  if (!queue) queues.set(name, (queue = createQueue<object>(name)));
  return queue;
}

/**
 * Publishes pending outbox events to BullMQ. Safe to run from several worker replicas: rows are claimed with
 * FOR UPDATE SKIP LOCKED inside a transaction, and the BullMQ job id equals the outbox id, so a crash after
 * publishing but before committing only results in a deduplicated republish.
 * Returns the number of events published.
 */
export async function relayOutbox(): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Row[]>`
      SELECT id, queue, name, payload, attempts FROM outbox_events
      WHERE processed_at IS NULL AND available_at <= now()
      ORDER BY created_at
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED`;

    let published = 0;
    for (const row of rows) {
      try {
        await queueFor(row.queue).add(row.name, row.payload, { jobId: row.id });
        await tx.outboxEvent.update({ where: { id: row.id }, data: { processedAt: new Date() } });
        published++;
      } catch (error) {
        const attempts = row.attempts + 1;
        logger.error({ err: error, outboxId: row.id, queue: row.queue, attempts }, "Could not publish outbox event");
        await tx.outboxEvent.update({
          where: { id: row.id },
          data: {
            attempts,
            lastError: String(error).slice(0, 500),
            availableAt: new Date(Date.now() + Math.min(1000 * 2 ** attempts, MAX_BACKOFF_MS)),
          },
        });
      }
    }
    return published;
  });
}

/** Published events are only kept for debugging; drop them after a week. */
export async function purgeProcessedOutbox(olderThanDays = 7) {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000);
  const { count } = await prisma.outboxEvent.deleteMany({ where: { processedAt: { lt: cutoff } } });
  return count;
}

export async function closeOutboxQueues() {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
}
