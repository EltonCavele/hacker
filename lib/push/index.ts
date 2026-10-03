import "server-only";

import { logger } from "@/lib/logger";
import { createQueue } from "@/lib/queue";
import { PUSH_QUEUE, type PushJob, type PushPayload } from "./types";

const pushQueue = createQueue<PushJob>(PUSH_QUEUE);

/** Queues a push for all of the user's devices. Never blocks or fails the caller. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    await pushQueue.add(
      "push.send",
      { userId, payload },
      {
        attempts: 5,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  } catch (error) {
    logger.error({ err: error }, "Could not enqueue push notification");
  }
}
