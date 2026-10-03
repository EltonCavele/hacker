import "server-only";

import { cookies } from "next/headers";
import { FOLHA_ROLE_COOKIE, isFolhaRole, type FolhaRole } from "./types";

export async function getFolhaRole(): Promise<FolhaRole> {
  const value = (await cookies()).get(FOLHA_ROLE_COOKIE)?.value;
  return isFolhaRole(value) ? value : "chief";
}

