"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Chart, CreditCard, Document, Home6 } from "reicon-react";
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
import { FolhaLogo } from "@/features/folha/components/folha-logo";

const navItems = [
  { href: "/folha/painel", label: "Painel", icon: Chart, exact: true },
  { href: "/folha/auditor", label: "Auditoria", icon: Document, exact: false },
  { href: "/folha/cedsif", label: "CEDSIF", icon: CreditCard, exact: false },
] as const;

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
