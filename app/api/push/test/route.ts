import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/queries";
import { getRequestLocale } from "@/lib/i18n/server";
import { getTranslator } from "@/lib/i18n/translator";
import { sendPushToUser } from "@/lib/push";
import { RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const limited = await enforceRateLimit("push-test", session.user.id, RATE_LIMITS.userSensitive);
  if (limited) return limited;
  const t = getTranslator(await getRequestLocale());
  await sendPushToUser(session.user.id, {
    title: "Nextpad",
    body: t("push.testBody"),
    tag: "push-test",
    url: "/dashboard/settings",
  });
  return NextResponse.json({ ok: true });
}
