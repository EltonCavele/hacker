import { getTranslations } from "next-intl/server";
import { Edit } from "reicon-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/features/auth/queries";

export default async function ProfilePage() {
  const t = await getTranslations("dashboard");
  const session = await getSession();
  if (!session) return null;
  const { user } = session;

  return (
    <>
      <PageHeader
        actions={[{ label: t("profile.edit"), icon: <Edit />, href: "/dashboard/profile/edit", variant: "default" }]}
        back={{}}
        title={t("nav.profile")}
      />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.accountTitle")}</CardTitle>
          <CardDescription>{t("profile.accountDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar size="lg">
            {user.image ? <AvatarImage alt={user.name} src={user.image} /> : null}
            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge className="ml-auto" variant={user.emailVerified ? "success" : "warning"}>
            {user.emailVerified ? t("profile.emailVerified") : t("profile.emailUnverified")}
          </Badge>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
