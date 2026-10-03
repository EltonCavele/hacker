import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
  outboxEvent: { update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
}));
vi.mock("../db/standalone", () => ({
  standalonePrisma: { ...tx, $transaction: (run: (client: typeof tx) => unknown) => run(tx) },
}));
const add = vi.hoisted(() => vi.fn());
const close = vi.hoisted(() => vi.fn());
vi.mock("../queue", () => ({ createQueue: () => ({ add, close }) }));

import { enqueueOutbox } from "./index";
import { relayOutbox } from "./relay";

beforeEach(() => {
  tx.$queryRaw.mockResolvedValue([]);
});

describe("enqueueOutbox", () => {
  it("writes the event through the given transaction client", async () => {
    await enqueueOutbox(tx, "task-events", "task.created", { taskId: "t1" });
    expect(tx.outboxEvent.create).toHaveBeenCalledWith({
      data: { queue: "task-events", name: "task.created", payload: { taskId: "t1" } },
    });
  });
});

describe("relayOutbox", () => {
  const row = { id: "e1", queue: "task-events", name: "task.created", payload: { taskId: "t1" }, attempts: 0 };

  it("publishes with the outbox id as job id and marks the row processed", async () => {
    tx.$queryRaw.mockResolvedValue([row]);
    expect(await relayOutbox()).toBe(1);
    expect(add).toHaveBeenCalledWith("task.created", { taskId: "t1" }, { jobId: "e1" });
    expect(tx.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { processedAt: expect.any(Date) },
    });
  });

  it("keeps the row and backs off when Redis is unavailable", async () => {
    tx.$queryRaw.mockResolvedValue([row]);
    add.mockRejectedValue(new Error("redis down"));
    expect(await relayOutbox()).toBe(0);
    expect(tx.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "e1" },
      data: { attempts: 1, lastError: "Error: redis down", availableAt: expect.any(Date) },
    });
  });
});
