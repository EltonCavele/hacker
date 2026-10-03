export type MessagingChannel = "whatsapp";
export type MessageDirection = "inbound" | "outbound";
export type MessageDeliveryStatus = "accepted" | "sent" | "delivered" | "read" | "failed";
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export type JsonObject = { [key: string]: JsonValue };

export type SendMessageInput = {
  channel: MessagingChannel;
  recipient: string;
  text: string;
  sentByUserId?: string;
};

export type InboundMessageEvent = {
  type: "message.inbound";
  channel: MessagingChannel;
  channelAccountId: string;
  externalId: string;
  senderId: string;
  contentType: string;
  text: string | null;
  payload: JsonObject;
  occurredAt: Date;
};

export type InboundMessageJob = Omit<InboundMessageEvent, "occurredAt"> & {
  messageId: string;
  occurredAt: string;
};

export type MessageStatusEvent = {
  type: "message.status";
  channel: MessagingChannel;
  channelAccountId: string;
  externalId: string;
  recipientId: string;
  status: Exclude<MessageDeliveryStatus, "accepted">;
  occurredAt: Date;
};

export type MessagingWebhookEvent = InboundMessageEvent | MessageStatusEvent;

export interface MessagingProvider {
  readonly channel: MessagingChannel;
  readonly channelAccountId: string;
  sendText(input: SendMessageInput): Promise<{ externalId: string }>;
  parseWebhook(rawBody: Buffer, signature: string | null): MessagingWebhookEvent[] | null;
}
