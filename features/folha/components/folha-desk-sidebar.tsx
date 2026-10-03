"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Chart, CreditCard, Document, Home6, Logout } from "reicon-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarBrand,
  SidebarHeader,
  SidebarIcon,
  SidebarItem,
  SidebarLabel,
  SidebarLink,
  SidebarMenu,
  SidebarNav,
  SidebarSubitem,
  SidebarSubLink,
  SidebarSubmenu,
} from "@/components/ui/sidebar";
import { SignOutButton, useSignOut } from "@/features/auth/components/sign-out-button";
import { FolhaLogo } from "@/features/folha/components/folha-logo";

const navItems = [
  { href: "/folha/painel", label: "Painel", icon: Chart, exact: true },
  { href: "/folha/auditor", label: "Auditoria", icon: Document, exact: false },
  { href: "/folha/cedsif", label: "CEDSIF", icon: CreditCard, exact: false },
] as const;

function DeskSignOut() {
  const t = useTranslations("common");
  const { signOut, isLoading } = useSignOut();

  return (
    <>
      <SidebarItem className="max-md:hidden">
        <SidebarLink asChild>
          <button aria-label={t("signOut")} disabled={isLoading} onClick={signOut} type="button">
            <SidebarIcon icon={Logout} />
            <SidebarLabel>{t("signOut")}</SidebarLabel>
          </button>
        </SidebarLink>
      </SidebarItem>
      <SidebarItem className="md:hidden">
        <Sheet>
          <SidebarLink asChild>
            <SheetTrigger aria-label={t("signOut")} type="button">
              <SidebarIcon icon={Logout} />
            </SheetTrigger>
          </SidebarLink>
          <SheetContent
            className="rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            showCloseButton={false}
            side="bottom"
          >
            <SheetTitle className="sr-only">{t("signOut")}</SheetTitle>
            <SignOutButton className="w-full" />
          </SheetContent>
        </Sheet>
      </SidebarItem>
    </>
  );
}

export function FolhaDeskSidebar() {
  const pathname = usePathname();
  const isActive = (href: string, exact: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <Sidebar className="md:sticky md:top-0 md:h-screen md:shrink-0">
      <SidebarHeader>
        <SidebarBrand asChild>
          <Link href="/folha/painel">
            <FolhaLogo className="size-6 text-primary" />
            Folha Viva
          </Link>
        </SidebarBrand>
      </SidebarHeader>
      <SidebarNav>
        <SidebarMenu>
          {navItems.map(({ href, label, icon, exact }) => (
            <SidebarItem isActive={isActive(href, exact)} key={href}>
              <SidebarLink asChild>
                <Link href={href}>
                  <SidebarIcon icon={icon} />
                  <SidebarLabel>{label}</SidebarLabel>
                </Link>
              </SidebarLink>
            </SidebarItem>
          ))}
          <DeskSignOut />
        </SidebarMenu>
        <SidebarSubmenu>
          <SidebarSubitem>
            <SidebarSubLink asChild>
              <Link href="/folha/chefe">
                <Home6 className="mr-1 inline size-3.5" />
                App do chefe
              </Link>
            </SidebarSubLink>
          </SidebarSubitem>
        </SidebarSubmenu>
      </SidebarNav>
    </Sidebar>
  );
}
