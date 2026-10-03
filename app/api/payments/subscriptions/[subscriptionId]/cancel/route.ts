import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { cancelSubscriptionForUser } from "@/features/payments/service";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/payments/subscriptions/[subscriptionId]/cancel">,
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = await enforceRateLimit("subscription-cancel", session.user.id, RATE_LIMITS.userSensitive);
  if (limited) return limited;
  const { subscriptionId } = await context.params;
  try {
    await cancelSubscriptionForUser(session.user.id, subscriptionId);
    return NextResponse.json({ cancelled: true });
  } catch {
    return NextResponse.json({ error: "Could not cancel subscription" }, { status: 400 });
  }
}
