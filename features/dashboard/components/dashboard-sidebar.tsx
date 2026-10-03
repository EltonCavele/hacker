"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Bell, Bookmark, ChevronRight, CreditCard, Home6, Logout, Menu, Settings, Star, User } from "reicon-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List, ListIcon, ListItem, ListItemEnd, ListItemStart, ListItemTitle } from "@/components/ui/list";
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
} from "@/components/ui/sidebar";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";

const navItems = [
  { href: "/dashboard", label: "home", icon: Home6, exact: true },
  { href: "/dashboard/payments", label: "payments", icon: CreditCard, exact: false },
  // Temporary items to exercise the tab bar "Menu" overflow; the routes don't exist yet.
  { href: "/dashboard/notifications", label: "notifications", icon: Bell, exact: false },
  { href: "/dashboard/saved", label: "saved", icon: Bookmark, exact: false },
  { href: "/dashboard/favorites", label: "favorites", icon: Star, exact: false },
] as const;

/** Items shown in the tab bar below `md`. From MAX_TABS + 1 items on, a 4th "Menu" slot opens the rest in a bottom sheet. */
const MAX_TABS = 3;

type DashboardSidebarProps = {
  user: { name: string; email: string; image?: string | null };
};

/** Navigation of the authenticated area: the current route drives `isActive`. */
export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const t = useTranslations("dashboard.nav");
  const common = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string, exact: boolean) => (exact ? pathname === href : pathname.startsWith(href));
  const hasOverflow = navItems.length > MAX_TABS;
  const overflowItems = hasOverflow ? navItems.slice(MAX_TABS) : [];

  return (
    <Sidebar className="md:sticky md:top-0 md:h-screen md:shrink-0">
      <SidebarHeader>
        <SidebarBrand asChild>
          <Link href="/dashboard">Nextpad</Link>
        </SidebarBrand>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t("accountMenu")}
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
          >
            <Avatar className="size-6">
              {user.image ? <AvatarImage alt={user.name} src={user.image} /> : null}
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={10} className="w-60 rounded-2xl p-1.5">
            <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-1.5 text-sm">
              <span className="truncate text-foreground">{user.name}</span>
              <span className="truncate font-normal text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild size="lg">
              <Link href="/dashboard/profile">
                <User />
                {t("profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild size="lg">
              <Link href="/dashboard/settings">
                <Settings />
                {t("settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={async () => {
                await unsubscribeLocally();
                await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
              }}
              size="lg"
              variant="destructive"
            >
              <Logout />
              {common("signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarNav>
        <SidebarMenu>
          {navItems.map(({ href, label, icon: Icon, exact }, index) => (
            <SidebarItem
              className={hasOverflow && index >= MAX_TABS ? "max-md:hidden" : undefined}
              key={href}
              isActive={isActive(href, exact)}
            >
              <SidebarLink asChild>
                <Link href={href}>
                  <SidebarIcon icon={Icon} />
                  <SidebarLabel>{t(label)}</SidebarLabel>
                </Link>
              </SidebarLink>
            </SidebarItem>
          ))}
          {hasOverflow ? (
            <SidebarItem
              className="md:hidden"
              isActive={menuOpen || overflowItems.some((item) => isActive(item.href, item.exact))}
            >
              <Sheet onOpenChange={setMenuOpen} open={menuOpen}>
                <SidebarLink asChild>
                  <SheetTrigger aria-label={t("menu")} type="button">
                    <SidebarIcon icon={Menu} />
                  </SheetTrigger>
                </SidebarLink>
                <SheetContent
                  className="rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                  showCloseButton={false}
                  side="bottom"
                >
                  <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
                  <List>
                    {overflowItems.map(({ href, label, icon: Icon }) => (
                      <Link href={href} key={href} onClick={() => setMenuOpen(false)}>
                        <ListItem className="py-4">
                          <ListIcon className="[&_svg]:size-7">
                            <Icon />
                          </ListIcon>
                          <ListItemStart>
                            <ListItemTitle className="text-lg">{t(label)}</ListItemTitle>
                          </ListItemStart>
                          <ListItemEnd>
                            <ChevronRight className="size-5 text-muted-foreground" />
                          </ListItemEnd>
                        </ListItem>
                      </Link>
                    ))}
                  </List>
                </SheetContent>
              </Sheet>
            </SidebarItem>
          ) : null}
        </SidebarMenu>
      </SidebarNav>
    </Sidebar>
  );
}
