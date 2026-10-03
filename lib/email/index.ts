import "server-only";

import { LogEmailProvider } from "./providers/log";
import { ResendEmailProvider } from "./providers/resend";
import type { EmailMessage, EmailProvider, EmailSendResult } from "./types";

let provider: EmailProvider | undefined;

function getEmailProvider(): EmailProvider {
  if (provider) return provider;

  const providerName = process.env.EMAIL_PROVIDER ?? "resend";
  if (providerName === "log") {
    provider = new LogEmailProvider(process.env.EMAIL_FROM);
    return provider;
  }
  if (providerName !== "resend") {
    throw new Error(`Unsupported email provider: ${providerName}`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.EMAIL_FROM;
  if (!apiKey) throw new Error("RESEND_API_KEY is required to send email");
  if (!defaultFrom) throw new Error("EMAIL_FROM is required to send email");

  provider = new ResendEmailProvider(apiKey, defaultFrom);
  return provider;
}

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  return getEmailProvider().send(message);
}

export type { EmailContent, EmailMessage, EmailProvider, EmailSendResult } from "./types";
