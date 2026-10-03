import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const t = await getTranslations("home");
  const legal = await getTranslations("legal");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-4">
        <h1 className="max-w-2xl text-4xl font-semibold sm:text-6xl">
          {t("title")}
        </h1>
        <p className="max-w-xl text-lg leading-8 text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/login">{t("signIn")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">{t("openDashboard")}</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/folha">{t("openFolha")}</Link>
        </Button>
      </div>
      <footer className="flex gap-4 text-sm text-muted-foreground">
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">{legal("footer.terms")}</Link>
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">{legal("footer.privacy")}</Link>
      </footer>
    </main>
  );
}
