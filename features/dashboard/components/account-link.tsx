import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** Mobile entry to the account menu: the user's avatar, meant for the start slot of `PageHeader`. Hidden from `md` up (the sidebar has the dropdown). */
export async function AccountLink({ user }: { user: { name: string; image?: string | null } }) {
  const t = await getTranslations("dashboard.nav");
  return (
    <Link
      aria-label={t("account")}
      className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
      href="/dashboard/account"
    >
      <Avatar className="size-10">
        {user.image ? <AvatarImage alt={user.name} src={user.image} /> : null}
        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
