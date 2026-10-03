import "server-only";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";

export const PASSKEY_OFFER_DISMISSED_COOKIE = "passkey-offer-dismissed";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * True when the passkey offer screen should be shown: the user has no passkey and has not skipped it in this login.
 * The skip cookie stores the session id, so a new login (new session) shows the offer again.
 */
export async function shouldOfferPasskey(session: { session: { id: string }; user: { id: string } }) {
  const dismissedFor = (await cookies()).get(PASSKEY_OFFER_DISMISSED_COOKIE)?.value;
  if (dismissedFor === session.session.id) return false;
  const count = await prisma.passkey.count({ where: { userId: session.user.id } });
  return count === 0;
}
