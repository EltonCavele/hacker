import "server-only";

import { isBusinessScopedUserId, WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { normalizeWebhook, verifySignature } from "@kapso/whatsapp-cloud-api/server";
import type { JsonObject, MessagingProvider, MessagingWebhookEvent, SendMessageInput } from "../types";

type WhatsAppWebhookPayload = Parameters<typeof normalizeWebhook>[0];

export class WhatsAppProvider implements MessagingProvider {
  readonly channel = "whatsapp" as const;
  readonly channelAccountId: string;
  private readonly client: WhatsAppClient;

  constructor(
    private readonly accessToken: string,
    private readonly appSecret: string,
    private readonly phoneNumberId: string,
  ) {
    // Omitting baseUrl and kapsoApiKey keeps requests on Meta's Graph API.
    this.channelAccountId = phoneNumberId;
    this.client = new WhatsAppClient({ accessToken });
  }

  async sendText(input: SendMessageInput) {
    const response = await this.client.messages.sendText({
      phoneNumberId: this.phoneNumberId,
      ...(isBusinessScopedUserId(input.recipient)
        ? { recipient: input.recipient }
        : { to: input.recipient }),
      body: input.text,
    });
    const externalId = response.messages?.[0]?.id;
    if (!externalId) throw new Error("Meta accepted no message id in its response");
    return { externalId };
  }

  parseWebhook(rawBody: Buffer, signature: string | null): MessagingWebhookEvent[] | null {
    if (!signature) return null;
    const validSignature = verifySignature({
      appSecret: this.appSecret,
      rawBody,
      signatureHeader: signature,
    });
    if (!validSignature) return null;

    const payload = JSON.parse(rawBody.toString("utf8")) as WhatsAppWebhookPayload;
    const normalized = normalizeWebhook(payload);
    const events: MessagingWebhookEvent[] = [];

    for (const message of normalized.messages) {
      if (message.kapso?.direction !== "inbound" || !message.id) continue;
      const senderId = message.from ?? message.fromUserId;
      if (!senderId) continue;

      events.push({
        type: "message.inbound",
        channel: this.channel,
        channelAccountId: this.phoneNumberId,
        externalId: message.id,
        senderId,
        contentType: message.type,
        text: message.text?.body ?? null,
        payload: JSON.parse(JSON.stringify(message)) as JsonObject,
        occurredAt: new Date(Number(message.timestamp) * 1000),
      });
    }

    for (const status of normalized.statuses) {
      if (!status.id || !["sent", "delivered", "read", "failed"].includes(status.status)) continue;
      const recipientId = status.recipientId ?? status.recipientUserId;
      if (!recipientId) continue;
      events.push({
        type: "message.status",
        channel: this.channel,
        channelAccountId: this.channelAccountId,
        externalId: status.id,
        recipientId,
        status: status.status as "sent" | "delivered" | "read" | "failed",
        occurredAt: new Date(Number(status.timestamp) * 1000),
      });
    }

    return events;
  }
}
