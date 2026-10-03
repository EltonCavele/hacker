import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/features/auth/queries";
import { createCheckout } from "@/features/payments/service";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

const inputSchema = z.object({ productId: z.string().min(1) }).strict();

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const limited = await enforceRateLimit("checkout", session.user.id, RATE_LIMITS.userSensitive);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  const input = inputSchema.safeParse(body);
  if (!input.success) return NextResponse.json({ error: "Invalid checkout request" }, { status: 400 });

  try {
    const checkout = await createCheckout({ id: session.user.id, email: session.user.email }, input.data.productId);
    return NextResponse.json(checkout, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not create checkout" }, { status: 502 });
  }
}
