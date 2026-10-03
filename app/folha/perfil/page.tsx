import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { RoleSwitcher } from "@/features/folha/components/role-switcher";
import { FolhaLogo } from "@/features/folha/components/folha-logo";
import { getFolhaRole } from "@/features/folha/role";

export default async function PerfilPage() {
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
        <p className="text-sm font-medium">Papel nesta demonstração</p>
        <RoleSwitcher role={role} />
        <Button asChild className="w-full" variant="outline">
          <Link href="/folha/painel">Painel</Link>
        </Button>
        <Button asChild className="w-full" variant="ghost">
          <Link href="/folha/auditor">Auditoria</Link>
        </Button>
        <Button asChild className="w-full" variant="ghost">
          <Link href="/folha/cedsif">CEDSIF</Link>
        </Button>
        <SignOutButton className="w-full" />
      </div>
    </div>
  );
}
