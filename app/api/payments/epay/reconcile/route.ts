import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { reconcileEpayCheckouts } from "@/features/payments/service";
import { RATE_LIMITS, enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit("epay-reconcile", getClientIp(request), RATE_LIMITS.internal);
  if (limited) return limited;
  const secret = process.env.EPAY_RECONCILIATION_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const received = Buffer.from(match?.[1] ?? "");
  const expected = Buffer.from(secret ?? "");
  if (!secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reconciled = await reconcileEpayCheckouts();
    return NextResponse.json({ reconciled });
  } catch {
    return NextResponse.json({ error: "Could not reconcile EPay payments" }, { status: 500 });
  }
}
