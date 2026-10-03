import { getMessagingProvider } from "@/lib/messaging";
import { persistMessagingEvents } from "@/features/messaging/service";
import { RATE_LIMITS, enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const limited = await enforceRateLimit("webhook-whatsapp-verify", getClientIp(request), RATE_LIMITS.internal);
  if (limited) return limited;
  const verifyToken = process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) return new Response("Webhook verification is not configured", { status: 500 });

  const { searchParams } = new URL(request.url);
  if (searchParams.get("hub.mode") !== "subscribe" || searchParams.get("hub.verify_token") !== verifyToken) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(searchParams.get("hub.challenge") ?? "", { status: 200 });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit("webhook-whatsapp", getClientIp(request), RATE_LIMITS.webhook);
  if (limited) return limited;
  const rawBody = Buffer.from(await request.arrayBuffer());
  const provider = getMessagingProvider("whatsapp");
  const events = provider.parseWebhook(rawBody, request.headers.get("x-hub-signature-256"));
  if (!events) return new Response("Invalid webhook signature", { status: 401 });

  await persistMessagingEvents(events);
  return Response.json({ received: true });
}
