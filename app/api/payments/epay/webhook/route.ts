import { NextResponse } from "next/server";
import { applyPaymentEvent } from "@/features/payments/service";
import { getPaymentProvider } from "@/lib/payments";
import type { PaymentEvent } from "@/lib/payments/types";
import { RATE_LIMITS, enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = await enforceRateLimit("webhook-epay", getClientIp(request), RATE_LIMITS.webhook);
  if (limited) return limited;
  let event: PaymentEvent | null;
  try {
    event = await getPaymentProvider("EPAY").verifyWebhook(request);
  } catch {
    return NextResponse.json({ error: "Invalid EPay webhook" }, { status: 400 });
  }
  try {
    if (event) await applyPaymentEvent("EPAY", event);
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Could not process EPay webhook" }, { status: 500 });
  }
}
