import "server-only";

import { randomUUID } from "node:crypto";
import type { MessagingProvider, MessagingWebhookEvent, SendMessageInput } from "../types";

/** Logs messages instead of sending them. Intended for local development and tests. */
export class LogMessagingProvider implements MessagingProvider {
  readonly channel = "whatsapp" as const;
  readonly channelAccountId = "log";

  async sendText(input: SendMessageInput) {
    const externalId = `log_${randomUUID()}`;
    console.info("[messaging:log]", {
      externalId,
      channel: input.channel,
      recipient: input.recipient,
      text: input.text,
    });
    return { externalId };
  }

  parseWebhook(_rawBody: Buffer, _signature: string | null): MessagingWebhookEvent[] | null {
    return null;
  }
}
