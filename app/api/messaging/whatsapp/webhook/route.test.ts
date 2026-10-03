import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowRateLimit, redisMock } from "@/tests/helpers";

vi.mock("@/lib/redis/client", () => redisMock);
const parseWebhook = vi.hoisted(() => vi.fn());
vi.mock("@/lib/messaging", () => ({ getMessagingProvider: () => ({ parseWebhook }) }));
const persistMessagingEvents = vi.hoisted(() => vi.fn());
vi.mock("@/features/messaging/service", () => ({ persistMessagingEvents }));

import { GET, POST } from "./route";

beforeEach(() => {
  allowRateLimit();
  vi.stubEnv("META_WHATSAPP_WEBHOOK_VERIFY_TOKEN", "verify-me");
});

const verify = (query: string) => GET(new Request(`http://localhost/api/messaging/whatsapp/webhook?${query}`));

describe("GET (Meta verification handshake)", () => {
  it("echoes the challenge for the right token", async () => {
    const response = await verify("hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=1234");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("1234");
  });

  it("rejects a wrong token or mode", async () => {
    expect((await verify("hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1")).status).toBe(403);
    expect((await verify("hub.mode=unsubscribe&hub.verify_token=verify-me&hub.challenge=1")).status).toBe(403);
  });

  it("is closed when verification is not configured", async () => {
    vi.stubEnv("META_WHATSAPP_WEBHOOK_VERIFY_TOKEN", "");
    expect((await verify("hub.mode=subscribe&hub.verify_token=&hub.challenge=1")).status).toBe(500);
  });
});

describe("POST", () => {
  const post = (headers: Record<string, string> = {}) =>
    POST(new Request("http://localhost/webhook", { method: "POST", body: "{}", headers }));

  it("rejects an invalid signature and stores nothing", async () => {
    parseWebhook.mockReturnValue(null);
    expect((await post({ "x-hub-signature-256": "sha256=bad" })).status).toBe(401);
    expect(persistMessagingEvents).not.toHaveBeenCalled();
  });

  it("passes the raw signature header to the provider and persists verified events", async () => {
    const events = [{ type: "message.inbound" }];
    parseWebhook.mockReturnValue(events);
    expect((await post({ "x-hub-signature-256": "sha256=ok" })).status).toBe(200);
    expect(parseWebhook).toHaveBeenCalledWith(expect.any(Buffer), "sha256=ok");
    expect(persistMessagingEvents).toHaveBeenCalledWith(events);
  });
});
