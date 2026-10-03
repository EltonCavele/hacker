import "server-only";

import { prisma } from "@/lib/db/client";
import { createQueue } from "@/lib/queue";
import { getMessagingProvider } from "@/lib/messaging";
import type {
  InboundMessageJob,
  MessagingWebhookEvent,
  SendMessageInput,
} from "@/lib/messaging";

const inboundMessages = createQueue<InboundMessageJob>("messaging-inbound");

export async function sendMessage(input: SendMessageInput) {
  const provider = getMessagingProvider(input.channel);
  const { externalId } = await provider.sendText(input);
  const occurredAt = new Date();
  const conversation = await prisma.conversation.upsert({
    where: {
      channel_channelAccountId_externalContactId: {
        channel: input.channel,
        channelAccountId: provider.channelAccountId,
        externalContactId: input.recipient,
      },
    },
    update: { lastMessageAt: occurredAt },
    create: {
      channel: input.channel,
      channelAccountId: provider.channelAccountId,
      externalContactId: input.recipient,
      lastMessageAt: occurredAt,
    },
  });

  const message = await prisma.message.upsert({
    where: { channel_externalId: { channel: input.channel, externalId } },
    update: {
      direction: "outbound",
      contentType: "text",
      text: input.text,
      payload: { type: "text", text: input.text },
      sentByUserId: input.sentByUserId,
    },
    create: {
      channel: input.channel,
      externalId,
      direction: "outbound",
      contentType: "text",
      text: input.text,
      payload: { type: "text", text: input.text },
      status: "accepted",
      occurredAt,
      conversationId: conversation.id,
      sentByUserId: input.sentByUserId,
    },
    select: { id: true, externalId: true, status: true },
  });

  return message;
}

export async function persistMessagingEvents(events: MessagingWebhookEvent[]) {
  for (const event of events) {
    if (event.type === "message.status") {
      const conversation = await prisma.conversation.upsert({
        where: {
          channel_channelAccountId_externalContactId: {
            channel: event.channel,
            channelAccountId: event.channelAccountId,
            externalContactId: event.recipientId,
          },
        },
        update: { lastMessageAt: event.occurredAt },
        create: {
          channel: event.channel,
          channelAccountId: event.channelAccountId,
          externalContactId: event.recipientId,
          lastMessageAt: event.occurredAt,
        },
      });
      await prisma.message.upsert({
        where: { channel_externalId: { channel: event.channel, externalId: event.externalId } },
        update: { status: event.status, statusUpdatedAt: event.occurredAt },
        create: {
          channel: event.channel,
          externalId: event.externalId,
          direction: "outbound",
          contentType: "unknown",
          status: event.status,
          statusUpdatedAt: event.occurredAt,
          occurredAt: event.occurredAt,
          conversationId: conversation.id,
        },
      });
      continue;
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        channel_channelAccountId_externalContactId: {
          channel: event.channel,
          channelAccountId: event.channelAccountId,
          externalContactId: event.senderId,
        },
      },
      update: { lastMessageAt: event.occurredAt },
      create: {
        channel: event.channel,
        channelAccountId: event.channelAccountId,
        externalContactId: event.senderId,
        lastMessageAt: event.occurredAt,
      },
    });
    const message = await prisma.message.upsert({
      where: { channel_externalId: { channel: event.channel, externalId: event.externalId } },
      update: {},
      create: {
        channel: event.channel,
        externalId: event.externalId,
        direction: "inbound",
        contentType: event.contentType,
        text: event.text,
        payload: event.payload,
        status: "received",
        occurredAt: event.occurredAt,
        conversationId: conversation.id,
      },
      select: { id: true },
    });

    await inboundMessages.add("message.received", {
      ...event,
      messageId: message.id,
      occurredAt: event.occurredAt.toISOString(),
    }, {
      jobId: `inbound-${message.id}`,
      attempts: 5,
      backoff: { type: "exponential", delay: 1_000 },
      removeOnComplete: { count: 5_000 },
    });
  }
}
