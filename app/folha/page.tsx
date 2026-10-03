import { redirect } from "next/navigation";
import { getFolhaRole } from "@/features/folha/role";
import { roleHome } from "@/features/folha/types";

export default async function FolhaIndexPage() {
  redirect(roleHome(await getFolhaRole()));
}
