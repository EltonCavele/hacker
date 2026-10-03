"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db/client";
import { invalidateCache } from "@/lib/cache/redis-cache";
import { enqueueOutbox } from "@/lib/outbox";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

const taskTitle = z.string().trim().min(1).max(160);

export async function createTask(formData: FormData) {
  const user = await requireUser();
  if (await enforceRateLimit("task-create", user.id, RATE_LIMITS.userWrite)) return;
  const parsedTitle = taskTitle.safeParse(formData.get("title"));
  if (!parsedTitle.success) return;
  const title = parsedTitle.data;
  // The event is stored with the task in one transaction; the worker's outbox relay publishes it to BullMQ.
  await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: { ownerId: user.id, title },
      select: { id: true },
    });
    await enqueueOutbox(tx, "task-events", "task.created", { taskId: task.id });
  });

  await invalidateCache(`tasks:${user.id}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const parsedId = z.uuid().parse(taskId);
  await prisma.task.deleteMany({ where: { id: parsedId, ownerId: user.id } });
  await invalidateCache(`tasks:${user.id}`);
  revalidatePath("/dashboard");
}
