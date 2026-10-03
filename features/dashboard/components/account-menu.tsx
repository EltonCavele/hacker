"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Logout, Settings, User } from "reicon-react";
import { List, ListIcon, ListItem, ListItemDescription, ListItemEnd, ListItemStart, ListItemTitle } from "@/components/ui/list";
import { unsubscribeLocally } from "@/features/notifications/push-client";
import { authClient } from "@/lib/auth/client";

const links = [
  { href: "/dashboard/profile", label: "profile", description: "profileDescription", icon: User },
  { href: "/dashboard/settings", label: "settings", description: "settingsDescription", icon: Settings },
] as const;

/** Mobile counterpart of the sidebar's account dropdown: same entries, as a list. */
export function AccountMenu() {
  const t = useTranslations("dashboard");
  const common = useTranslations("common");
  const router = useRouter();

  return (
    <List>
      {links.map(({ href, label, description, icon: Icon }) => (
        <Link key={href} href={href} className="block">
          <ListItem>
            <ListIcon><Icon /></ListIcon>
            <ListItemStart>
              <ListItemTitle>{t(`nav.${label}`)}</ListItemTitle>
              <ListItemDescription>{t(`accountMenu.${description}`)}</ListItemDescription>
            </ListItemStart>
            <ListItemEnd><ChevronRight className="size-5 text-muted-foreground" /></ListItemEnd>
          </ListItem>
        </Link>
      ))}
      <button
        className="block w-full text-left text-destructive"
        onClick={async () => {
          await unsubscribeLocally();
          await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
        }}
        type="button"
      >
        <ListItem>
          <ListIcon className="text-destructive"><Logout /></ListIcon>
          <ListItemStart>
            <ListItemTitle>{common("signOut")}</ListItemTitle>
          </ListItemStart>
          <ListItemEnd />
        </ListItem>
      </button>
    </List>
  );
}
