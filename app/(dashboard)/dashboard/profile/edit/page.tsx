import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/features/auth/queries";
import { ProfileForm } from "@/features/dashboard/components/profile-form";

export default async function EditProfilePage() {
  const t = await getTranslations("dashboard.profile");
  const session = await getSession();
  if (!session) return null;
  const { user } = session;

  return (
    <>
      <PageHeader back={{ href: "/dashboard/profile" }} title={t("editTitle")} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("personalData")}</CardTitle>
            <CardDescription>{t("emailLocked")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm email={user.email} name={user.name} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
