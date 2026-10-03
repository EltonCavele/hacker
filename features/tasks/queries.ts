import "server-only";

import { prisma } from "@/lib/db/client";
import { getOrSet } from "@/lib/cache/redis-cache";
import { requireUser } from "@/lib/dal";

export async function getTasks() {
  const user = await requireUser();
  return getOrSet(`tasks:${user.id}`, 30, () =>
    prisma.task.findMany({
      where: { ownerId: user.id },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  );
}
