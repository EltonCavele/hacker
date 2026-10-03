import { NextResponse } from "next/server";
import { RATE_LIMITS, enforceRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit("push-public-key", getClientIp(request), RATE_LIMITS.publicRead);
  if (limited) return limited;
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return NextResponse.json({ error: "Push not configured" }, { status: 503 });
  return NextResponse.json({ publicKey: key });
}
