# Messaging

Messaging currently supports WhatsApp through Meta's Graph API. Provider code lives in `lib/messaging`; persistence and application behavior live in `features/messaging/service.ts`.

## Main flow

1. Server code calls `sendMessage` in `features/messaging/service.ts`.
2. The provider sends text and returns Meta's message ID.
3. The service stores the conversation and message in PostgreSQL.
4. Meta sends webhooks to `/api/messaging/whatsapp/webhook`.
5. The route verifies webhook data through the provider and persists inbound messages or status updates.
6. Inbound messages are queued as `messaging-inbound` jobs.

## Important files

- `lib/messaging/types.ts`: channels, events, and provider interface.
- `lib/messaging/providers/whatsapp.ts`: outbound text and signed webhook parsing.
- `lib/messaging/providers/log.ts`: logs outbound text instead of sending it; enabled with `MESSAGING_PROVIDER=log` (no credentials, rejects all webhooks). Intended for development and tests.
- `features/messaging/service.ts`: database writes and inbound queueing.
- `app/api/messaging/whatsapp/webhook/route.ts`: Meta webhook verification and request handling.
- `workers/index.ts`: current worker entry point.

## Rules for changes

- Keep the raw request body available for signature verification.
- Treat provider acceptance as `accepted`; delivery status is updated later by webhooks.
- Use the provider's external message ID and the database uniqueness constraints to handle retries.
- The current outbound API sends text only. Inbound events retain provider payload data, but application handling in the worker is only a placeholder today.
- Configure `META_ACCESS_TOKEN`, `META_APP_SECRET`, `META_WHATSAPP_PHONE_NUMBER_ID`, and `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN` on the server.
