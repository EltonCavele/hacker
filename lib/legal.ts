import { getEnv } from "./env";
import { SITE_NAME } from "./site";

/** Date the Terms and Privacy Policy last changed. Bump it (and tell users) whenever their text changes materially. */
export const LEGAL_UPDATED_AT = "2026-10-01";

/** Who is behind the service, shown on /terms and /privacy. Set LEGAL_COMPANY_NAME and LEGAL_CONTACT_EMAIL in production. */
export function legalEntity() {
  const env = getEnv();
  return {
    company: env.LEGAL_COMPANY_NAME ?? SITE_NAME,
    email: env.LEGAL_CONTACT_EMAIL ?? "privacy@example.com",
  };
}
