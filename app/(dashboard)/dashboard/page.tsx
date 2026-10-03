import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/features/auth/queries";
import { AccountLink } from "@/features/dashboard/components/account-link";
import { TaskList } from "@/features/tasks/components/task-list";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <PageHeader start={<AccountLink user={session.user} />} title={t("nav.home")} />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-16 pt-6">
      <section className="space-y-2 pt-6">
        <h2 className="text-lg font-medium">{t("home.nextStepTitle")}</h2>
        <p className="max-w-2xl leading-7 text-muted-foreground">
          {t.rich("home.nextStep", { code: (chunks) => <code>{chunks}</code> })}
        </p>
      </section>
      
      <TaskList />
      </div>
    </>
  );
}
