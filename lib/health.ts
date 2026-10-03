import "server-only";

import { prisma } from "./db/client";
import { redis } from "./redis/client";

const CHECK_TIMEOUT_MS = 2000;

export type DependencyCheck = { status: "up" | "down"; latencyMs: number };

async function timed(check: () => Promise<unknown>): Promise<DependencyCheck> {
  const startedAt = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), CHECK_TIMEOUT_MS);
      }),
    ]);
    return { status: "up", latencyMs: Math.round(performance.now() - startedAt) };
  } catch {
    return { status: "down", latencyMs: Math.round(performance.now() - startedAt) };
  } finally {
    clearTimeout(timer);
  }
}

/** Checks the dependencies the app cannot serve traffic without. Never exposes error details. */
export async function checkReadiness() {
  const [database, cache] = await Promise.all([timed(() => prisma.$queryRaw`SELECT 1`), timed(() => redis.ping())]);
  const ready = database.status === "up" && cache.status === "up";
  return { ready, checks: { database, redis: cache } };
}
