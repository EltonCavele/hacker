import "server-only";

import { Resend } from "resend";
import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;
  private readonly defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.client = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const email = {
      from: message.from ?? this.defaultFrom,
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
    };
    const body = message.html !== undefined
      ? { html: message.html, text: message.text }
      : message.text !== undefined
        ? { text: message.text }
        : undefined;

    if (!body) throw new Error("Email content is required");

    const { data, error } = await this.client.emails.send({ ...email, ...body });

    if (error) throw new Error(`Email provider failed: ${error.message}`);
    if (!data?.id) throw new Error("Email provider did not return a message id");

    return { id: data.id };
  }
}
