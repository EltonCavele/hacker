import { defaultLocale, type Locale } from "../lib/i18n/config";
import { getTranslator } from "../lib/i18n/translator";
import { EmailCode } from "./components/email-code";
import { EmailDivider } from "./components/email-divider";
import { EmailHeading } from "./components/email-heading";
import { EmailLayout } from "./components/email-layout";
import { EmailText } from "./components/email-text";

export type OtpEmailProps = {
  code: string;
  expiresInMinutes: number;
  locale?: Locale;
};

/** Subject line for the same email, so the two cannot drift apart. */
export function otpEmailSubject(code: string, locale: Locale = defaultLocale) {
  return getTranslator(locale)("email.otp.subject", { code });
}

export function OtpEmail({ code, expiresInMinutes, locale = defaultLocale }: OtpEmailProps) {
  const t = getTranslator(locale);
  return (
    <EmailLayout locale={locale} preview={otpEmailSubject(code, locale)}>
      <EmailHeading>{t("email.otp.heading")}</EmailHeading>
      <EmailCode code={code} />
      <div style={{ height: "20px" }} />
      <EmailText>{t("email.otp.body", { minutes: expiresInMinutes })}</EmailText>
      <EmailDivider />
      <EmailText small>{t("email.otp.footer")}</EmailText>
    </EmailLayout>
  );
}

OtpEmail.PreviewProps = { code: "144703", expiresInMinutes: 10, locale: "pt" } satisfies OtpEmailProps;

export default OtpEmail;
