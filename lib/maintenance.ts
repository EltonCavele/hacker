import { standalonePrisma as prisma } from "./db/standalone";

const DAY_MS = 86_400_000;

/** Housekeeping for rows that nothing else removes. Idempotent; runs daily from the worker. */
export async function runMaintenance(now = new Date()) {
  const [sessions, verifications, pushSubscriptions] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verification.deleteMany({ where: { expiresAt: { lt: now } } }),
    // Revoked (404/410 from the push service) subscriptions are kept briefly for debugging, then dropped.
    prisma.pushSubscription.deleteMany({ where: { revokedAt: { lt: new Date(now.getTime() - 30 * DAY_MS) } } }),
  ]);
  return {
    sessions: sessions.count,
    verifications: verifications.count,
    pushSubscriptions: pushSubscriptions.count,
  };
}
