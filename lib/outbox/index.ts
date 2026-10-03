// No "server-only": the producer runs in the app, the relay in the worker.
import type { Prisma } from "../../generated/prisma/client";

/**
 * Records an event in the same database transaction as the change that caused it. The worker's relay
 * (lib/outbox/relay.ts) publishes it to BullMQ afterwards, so a crash or a Redis outage between the commit and
 * the publish can no longer lose the event.
 *
 *   await prisma.$transaction(async (tx) => {
 *     const task = await tx.task.create({ data });
 *     await enqueueOutbox(tx, "task-events", "task.created", { taskId: task.id });
 *   });
 *
 * Delivery is at-least-once (the BullMQ job id is the outbox id, so republishing is deduplicated), so consumers
 * must still be idempotent.
 */
export async function enqueueOutbox<T extends object>(
  tx: { outboxEvent: { create(args: { data: Prisma.OutboxEventCreateInput }): PromiseLike<unknown> } },
  queue: string,
  name: string,
  payload: T,
) {
  await tx.outboxEvent.create({ data: { queue, name, payload: payload as Prisma.InputJsonObject } });
}
