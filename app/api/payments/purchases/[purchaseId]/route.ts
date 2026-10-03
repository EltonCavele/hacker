import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { getPurchaseForUser } from "@/features/payments/service";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export async function GET(_request: Request, context: RouteContext<"/api/payments/purchases/[purchaseId]">) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = await enforceRateLimit("purchase-read", session.user.id, RATE_LIMITS.userRead);
  if (limited) return limited;
  const { purchaseId } = await context.params;
  const purchase = await getPurchaseForUser(session.user.id, purchaseId);
  if (!purchase) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  return NextResponse.json(purchase, { headers: { "Cache-Control": "no-store" } });
}
