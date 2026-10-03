import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { RoleSwitcher } from "@/features/folha/components/role-switcher";
import { roleHome } from "@/features/folha/types";
import type { FolhaRole } from "@/features/folha/types";

const links: Array<{ href: string; key: "chief" | "auditor" | "cedsif" | "employee" | "panel" }> = [
  { href: "/folha/chefe", key: "chief" },
  { href: "/folha/auditor", key: "auditor" },
  { href: "/folha/cedsif", key: "cedsif" },
  { href: "/folha/funcionario", key: "employee" },
  { href: "/folha/painel", key: "panel" },
];

export async function FolhaHeader({ role, signedIn }: { role: FolhaRole; signedIn: boolean }) {
  const t = await getTranslations("folha");
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link className="text-lg font-semibold" href={signedIn ? roleHome(role) : "/folha/painel"}>
            {t("title")}
          </Link>
          <p className="text-sm text-muted-foreground">{t("tagline")}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((link) => (
            <Link className="text-muted-foreground hover:text-foreground" href={link.href} key={link.href}>
              {t(`nav.${link.key}`)}
            </Link>
          ))}
          {signedIn ? <RoleSwitcher role={role} /> : (
            <Link className="underline underline-offset-4" href="/login">
              {t("nav.signIn")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
