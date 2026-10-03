import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowRateLimit, blockRateLimit, redisMock, user } from "@/tests/helpers";

vi.mock("@/lib/redis/client", () => redisMock);
const redirect = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// Server actions read the request locale from cookies; tests run in Portuguese.
vi.mock("next-intl/server", async () => {
  const { createTranslator } = await import("next-intl");
  const messages = (await import("@/messages/pt.json")).default;
  return { getTranslations: async (namespace: string) => createTranslator({ locale: "pt", messages, namespace } as never) };
});
const getSession = vi.hoisted(() => vi.fn());
const cookieSet = vi.hoisted(() => vi.fn());
vi.mock("@/features/auth/queries", () => ({
  getSession,
  PASSKEY_OFFER_DISMISSED_COOKIE: "passkey-offer-dismissed",
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: cookieSet }), headers: async () => new Headers() }));
const db = vi.hoisted(() => {
  const tx = { task: { create: vi.fn(), deleteMany: vi.fn() }, outboxEvent: { create: vi.fn() } };
  return {
    user: { update: vi.fn() },
    task: tx.task,
    outboxEvent: tx.outboxEvent,
    $transaction: vi.fn(async (run: (client: typeof tx) => unknown) => run(tx)),
  };
});
vi.mock("@/lib/db/client", () => ({ prisma: db }));
vi.mock("@/lib/cache/redis-cache", () => ({ invalidateCache: vi.fn() }));

import { completeOnboarding, dismissPasskeyOffer } from "./auth/actions";
import { createTask, deleteTask } from "./tasks/actions";

const signedIn = () => getSession.mockResolvedValue({ user, session: { id: "sess-1" } });

beforeEach(() => {
  allowRateLimit();
  signedIn();
  db.task.create.mockResolvedValue({ id: "t1" });
  db.$transaction.mockImplementation(async (run) => run(db));
});

describe("authentication guard", () => {
  it("sends anonymous visitors to /login before any write", async () => {
    getSession.mockResolvedValue(null);
    await expect(completeOnboarding({ name: "Ana Silva" })).rejects.toThrow("NEXT_REDIRECT:/login");
    await expect(createTask(new FormData())).rejects.toThrow("NEXT_REDIRECT:/login");
    await expect(deleteTask(user.id)).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(db.user.update).not.toHaveBeenCalled();
    expect(db.task.create).not.toHaveBeenCalled();
    expect(db.task.deleteMany).not.toHaveBeenCalled();
  });
});

describe("completeOnboarding", () => {
  it("rejects names that are too short", async () => {
    expect(await completeOnboarding({ name: "A" })).toEqual({ error: "Indique o seu nome completo." });
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it("saves the trimmed name for the current user only", async () => {
    expect(await completeOnboarding({ name: "  Ana Silva  " })).toEqual({ error: null });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { name: "Ana Silva", onboardedAt: expect.any(Date) },
    });
  });
});

describe("dismissPasskeyOffer", () => {
  it("stores the session id in an httpOnly cookie", async () => {
    await dismissPasskeyOffer();
    expect(cookieSet).toHaveBeenCalledWith(
      "passkey-offer-dismissed",
      "sess-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
  });

  it("does nothing without a session", async () => {
    getSession.mockResolvedValue(null);
    await dismissPasskeyOffer();
    expect(cookieSet).not.toHaveBeenCalled();
  });
});

describe("tasks", () => {
  const form = (title: string) => {
    const data = new FormData();
    data.set("title", title);
    return data;
  };

  it("creates a task owned by the current user", async () => {
    await createTask(form("  Escrever testes  "));
    expect(db.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { ownerId: user.id, title: "Escrever testes" } }),
    );
    expect(db.outboxEvent.create).toHaveBeenCalledWith({
      data: { queue: "task-events", name: "task.created", payload: { taskId: "t1" } },
    });
  });

  it("ignores empty and oversized titles", async () => {
    await createTask(form("   "));
    await createTask(form("x".repeat(161)));
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it("does nothing when rate limited", async () => {
    blockRateLimit();
    await createTask(form("ok"));
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it("stores the event with the task, so a failed event write rolls the task back", async () => {
    db.outboxEvent.create.mockRejectedValue(new Error("db down"));
    await expect(createTask(form("ok"))).rejects.toThrow("db down");
  });

  it("deletes only the caller's own task (no IDOR)", async () => {
    await deleteTask("22222222-2222-4222-8222-222222222222");
    expect(db.task.deleteMany).toHaveBeenCalledWith({
      where: { id: "22222222-2222-4222-8222-222222222222", ownerId: user.id },
    });
  });

  it("rejects a malformed id", async () => {
    await expect(deleteTask("not-a-uuid")).rejects.toThrow();
    expect(db.task.deleteMany).not.toHaveBeenCalled();
  });
});
