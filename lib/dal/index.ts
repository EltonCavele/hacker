import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/features/auth/queries";

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}
