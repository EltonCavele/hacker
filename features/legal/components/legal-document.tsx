import { getFormatter, getTranslations } from "next-intl/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LEGAL_UPDATED_AT, legalEntity } from "@/lib/legal";

type Section = { title: string; body: string[] };

/** Renders a legal text from messages (`legal.<document>`), filling {company} and {email}. */
export async function LegalDocument({ document }: { document: "terms" | "privacy" }) {
  const t = await getTranslations("legal");
  const format = await getFormatter();
  const { company, email } = legalEntity();
  const fill = (text: string) => text.replaceAll("{company}", company).replaceAll("{email}", email);
  const sections = t.raw(`${document}.sections`) as Section[];

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t(`${document}.title`)}</h1>
        <p className="text-sm text-muted-foreground">
          {t("lastUpdated", { date: format.dateTime(new Date(LEGAL_UPDATED_AT), { dateStyle: "long" }) })}
        </p>
        <p className="text-muted-foreground">{fill(t.raw(`${document}.intro`) as string)}</p>
        {process.env.NODE_ENV !== "production" ? (
          <Alert>
            <AlertDescription>{t("notice")}</AlertDescription>
          </Alert>
        ) : null}
      </header>
      {sections.map((section) => (
        <section key={section.title} className="space-y-3">
          <h2 className="text-xl font-semibold">{section.title}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph} className="leading-7 text-muted-foreground">
              {fill(paragraph)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
