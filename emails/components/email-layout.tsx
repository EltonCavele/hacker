import { Body, Container, Font, Head, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { defaultLocale, type Locale } from "../../lib/i18n/config";
import { appName, emailTheme } from "../theme";

const { colors, fontFamily, radius } = emailTheme;

type EmailLayoutProps = {
  /** Inbox preview text shown next to the subject. */
  preview: string;
  locale?: Locale;
  /** Absolute URL of the logo. Falls back to the app name as text. */
  logoUrl?: string;
  /** Small print under the card (legal text, address…). */
  footer?: ReactNode;
  children: ReactNode;
};

/** Shared shell for every email: grey page, brand header, rounded white card, footer. */
export function EmailLayout({ preview, locale = defaultLocale, logoUrl, footer, children }: EmailLayoutProps) {
  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light" />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{ url: "https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2", format: "woff2" }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: "32px 16px", backgroundColor: colors.background, fontFamily }}>
        <Container style={{ maxWidth: "400px", margin: "0 auto" }}>
          <Section style={{ textAlign: "center", padding: "0 0 24px" }}>
            {logoUrl ? (
              <Img src={logoUrl} alt={appName} height={32} style={{ margin: "0 auto" }} />
            ) : (
              <Text style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: colors.primary }}>{appName}</Text>
            )}
          </Section>
          <Section
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.card,
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            {children}
          </Section>
          {footer ? (
            <Section style={{ padding: "24px 8px 0", textAlign: "center" }}>
              <Text style={{ margin: 0, fontSize: "11px", lineHeight: "15px", color: colors.subtle }}>{footer}</Text>
            </Section>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}
