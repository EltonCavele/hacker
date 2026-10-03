import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/queries";
import { prisma } from "@/lib/db/client";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const limited = await enforceRateLimit("push-unsubscribe", session.user.id, RATE_LIMITS.userWrite);
  if (limited) return limited;

  const parsed = z.object({ endpoint: z.string().min(1).max(2048) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.pushSubscription.updateMany({
    where: { endpoint: parsed.data.endpoint, userId: session.user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
