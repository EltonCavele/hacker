import { redirect } from "next/navigation";
import { loginRedirectPath } from "@/features/auth/redirect-to-login";
import { getSession } from "@/features/auth/queries";
import { FolhaShell } from "@/features/folha/components/folha-shell";
import { getFolhaRole } from "@/features/folha/role";

export default async function FolhaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect(await loginRedirectPath("/folha"));
  const role = await getFolhaRole();
  return (
    <FolhaShell role={role} signedIn>
      {children}
    </FolhaShell>
  );
}
