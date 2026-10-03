import { FolhaShell } from "@/features/folha/components/folha-shell";
import { getSession } from "@/features/auth/queries";
import { getFolhaRole } from "@/features/folha/role";

export default async function FolhaLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = await getFolhaRole();
  return (
    <FolhaShell role={role} signedIn={Boolean(session)}>
      {children}
    </FolhaShell>
  );
}
