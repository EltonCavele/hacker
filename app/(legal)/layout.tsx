import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/site";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("legal");
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <nav className="flex items-center justify-between gap-4" aria-label={SITE_NAME}>
        <Link href="/" className="font-semibold">
          {SITE_NAME}
        </Link>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/terms">{t("footer.terms")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/privacy">{t("footer.privacy")}</Link>
          </Button>
        </div>
      </nav>
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
