"use server";

import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { PASSKEY_OFFER_DISMISSED_COOKIE, getSession } from "@/features/auth/queries";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db/client";

/** Skips the passkey offer for the current login; the next login (new session) is offered again. */
export async function dismissPasskeyOffer() {
  const session = await getSession();
  if (!session) return;
  (await cookies()).set(PASSKEY_OFFER_DISMISSED_COOKIE, session.session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

/** Saves the onboarding answers and marks the user as onboarded. */
export async function completeOnboarding(input: { name: string }) {
  const user = await requireUser();
  const t = await getTranslations("auth.onboarding");
  const parsed = z.object({ name: z.string().trim().min(2, t("nameRequired")).max(120) }).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("nameInvalid") };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, onboardedAt: new Date() } });
  return { error: null };
}
