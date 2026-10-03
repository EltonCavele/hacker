import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "@/features/folha/components/role-switcher";
import { FolhaLogo } from "@/features/folha/components/folha-logo";
import { getSession } from "@/features/auth/queries";
import { getFolhaRole } from "@/features/folha/role";

export default async function PerfilPage() {
  const session = await getSession();
  const role = await getFolhaRole();
  const t = await getTranslations("folha");
  return (
    <div className="px-5 pt-8">
      <div className="flex items-center gap-2">
        <FolhaLogo className="size-8 text-primary" />
        <h1 className="text-2xl font-semibold tracking-tight">folha viva</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("tagline")}</p>
      <div className="mt-8 space-y-4">
        {session ? (
          <>
            <p className="text-sm font-medium">Papel nesta demonstração</p>
            <RoleSwitcher role={role} />
          </>
        ) : (
          <Button asChild className="w-full">
            <Link href="/login">Entrar</Link>
          </Button>
        )}
        <Button asChild className="w-full" variant="outline">
          <Link href="/folha/painel">Painel público</Link>
        </Button>
        <Button asChild className="w-full" variant="ghost">
          <Link href="/folha/auditor">Auditoria</Link>
        </Button>
        <Button asChild className="w-full" variant="ghost">
          <Link href="/folha/cedsif">CEDSIF</Link>
        </Button>
      </div>
    </div>
  );
}
