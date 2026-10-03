import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/queries";
import { prisma } from "@/lib/db/client";
import { isAllowedPushEndpoint } from "@/lib/push/types";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

const subscriptionSchema = z.object({
  endpoint: z.url().max(2048).refine(isAllowedPushEndpoint, "Unsupported push service"),
  keys: z.object({ p256dh: z.string().min(1).max(256), auth: z.string().min(1).max(256) }),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const limited = await enforceRateLimit("push-subscribe", session.user.id, RATE_LIMITS.userWrite);
  if (limited) return limited;

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 255) ?? null;
  // Upsert by endpoint: a device that switches account is reassigned instead of duplicated.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: {
      userId: session.user.id,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent,
      revokedAt: null,
      lastSeenAt: new Date(),
    },
  });
  return NextResponse.json({ ok: true });
}
