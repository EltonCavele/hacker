import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/features/auth/queries";
import { AccountMenu } from "@/features/dashboard/components/account-menu";

/** Mobile-only destination of the tab bar's account item (desktop uses the sidebar dropdown). */
export default async function AccountPage() {
  const t = await getTranslations("dashboard.nav");
  const session = await getSession();
  if (!session) redirect("/login");
  const { user } = session;

  return (
    <>
      <PageHeader back={{ href: "/dashboard" }} title={t("account")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-16 pt-6">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {user.image ? <AvatarImage alt={user.name} src={user.image} /> : null}
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <AccountMenu />
      </div>
    </>
  );
}
