import "server-only";

import { LogMessagingProvider } from "./providers/log";
import { WhatsAppProvider } from "./providers/whatsapp";
import type { MessagingChannel, MessagingProvider } from "./types";

let whatsappProvider: MessagingProvider | undefined;

export function getMessagingProvider(channel: MessagingChannel): MessagingProvider {
  if (channel !== "whatsapp") throw new Error(`Unsupported messaging channel: ${channel}`);
  if (whatsappProvider) return whatsappProvider;

  const providerName = process.env.MESSAGING_PROVIDER ?? "whatsapp";
  if (providerName === "log") {
    whatsappProvider = new LogMessagingProvider();
    return whatsappProvider;
  }
  if (providerName !== "whatsapp") {
    throw new Error(`Unsupported messaging provider: ${providerName}`);
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const appSecret = process.env.META_APP_SECRET;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !appSecret || !phoneNumberId) {
    throw new Error("META_ACCESS_TOKEN, META_APP_SECRET and META_WHATSAPP_PHONE_NUMBER_ID are required");
  }

  whatsappProvider = new WhatsAppProvider(accessToken, appSecret, phoneNumberId);
  return whatsappProvider;
}

export type {
  InboundMessageEvent,
  InboundMessageJob,
  JsonObject,
  JsonValue,
  MessageDeliveryStatus,
  MessageDirection,
  MessagingChannel,
  MessagingProvider,
  MessagingWebhookEvent,
  SendMessageInput,
} from "./types";
