// Runs in the BullMQ worker (plain tsx, no "server-only"/path aliases), so it uses the standalone Prisma client.
import webpush from "web-push";
import { standalonePrisma as prisma } from "../db/standalone";
import { logger } from "../logger";
import type { PushJob } from "./types";

let configured = false;
function configure() {
  if (configured) return true;
  const { VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_SUBJECT || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

/** Sends to every active device of a user. Throws on transient failures so BullMQ retries. */
export async function deliverPush({ userId, payload }: PushJob) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId, revokedAt: null } });
  if (subscriptions.length === 0) return;

  if (!configure()) {
    logger.info({ userId }, "VAPID not configured, skipping push send");
    return;
  }

  const body = JSON.stringify(payload);
  let transientFailure: unknown;
  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          body,
          { TTL: 60 * 60 },
        );
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.update({
            where: { id: subscription.id },
            data: { revokedAt: new Date() },
          });
        } else {
          transientFailure = error;
        }
      }
    }),
  );
  if (transientFailure) throw transientFailure;
}
