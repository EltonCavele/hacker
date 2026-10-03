"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CheckCircle, Layers, User } from "reicon-react";
import { cn } from "@/lib/utils";
import { FolhaDeskSidebar } from "@/features/folha/components/folha-desk-sidebar";
import { FolhaLogo } from "@/features/folha/components/folha-logo";
import type { FolhaRole } from "@/features/folha/types";

const chiefTabs = [
  { href: "/folha/chefe", label: "Atestar", icon: CheckCircle, match: (path: string) => path === "/folha/chefe" },
  { href: "/folha/chefe/sorteio", label: "Sorteio", icon: Camera, match: (path: string) => path.startsWith("/folha/chefe/sorteio") },
  { href: "/folha/chefe/fila", label: "Fila", icon: Layers, match: (path: string) => path.startsWith("/folha/chefe/fila") },
  { href: "/folha/perfil", label: "Perfil", icon: User, match: (path: string) => path.startsWith("/folha/perfil") },
];

export function FolhaShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: FolhaRole;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const desk =
    pathname.startsWith("/folha/cedsif") ||
    pathname.startsWith("/folha/auditor") ||
    pathname.startsWith("/folha/painel");
  const hideTabs = /\/folha\/chefe\/sorteio\/[^/]+/.test(pathname);

  if (desk) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <FolhaDeskSidebar />
        <main className="min-w-0 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
    );
  }
  const tabs = role === "chief" ? chiefTabs : [
    { href: role === "auditor" ? "/folha/auditor" : role === "cedsif" ? "/folha/cedsif" : "/folha/funcionario", label: "Início", icon: CheckCircle, match: () => true },
    { href: "/folha/perfil", label: "Perfil", icon: User, match: (path: string) => path.startsWith("/folha/perfil") },
  ];

  return (
    <div className={cn("folha-app min-h-dvh bg-background text-foreground", desk && "folha-desk")}>
      <div className={cn("mx-auto flex min-h-dvh w-full flex-col bg-background", desk ? "max-w-6xl" : "max-w-md md:border-x md:border-border")}>
        <div className="flex items-center justify-between px-5 pt-3 text-[11px] font-medium tracking-wide text-muted-foreground">
          <span>08:42</span>
          <span className="uppercase">Dados fictícios</span>
          <span>87%</span>
        </div>
        <div className={cn("flex-1", hideTabs ? "pb-8" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]")}>{children}</div>
        {hideTabs ? null : (
          <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-border bg-background px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            {tabs.map((tab) => {
              const active = tab.match(pathname);
              const Icon = tab.icon;
              return (
                <Link
                  className={cn("flex flex-col items-center gap-1 px-3 py-1 text-[11px]", active ? "text-primary" : "text-muted-foreground")}
                  href={tab.href}
                  key={tab.href}
                >
                  <Icon className="size-6" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}

export function FolhaWordmark({ unit }: { unit?: string }) {
  return (
    <div className="flex items-center gap-2">
      <FolhaLogo className="size-8 text-primary" />
      <span className="text-sm font-semibold tracking-tight">{unit ?? "folha viva"}</span>
    </div>
  );
}
