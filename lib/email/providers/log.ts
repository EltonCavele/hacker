import "server-only";

import { randomUUID } from "node:crypto";
import type { EmailMessage, EmailProvider, EmailSendResult } from "../types";

/** Logs emails instead of sending them. Intended for local development and tests. */
export class LogEmailProvider implements EmailProvider {
  constructor(private readonly defaultFrom = "log@localhost") {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (message.html === undefined && message.text === undefined) {
      throw new Error("Email content is required");
    }

    const id = `log_${randomUUID()}`;
    console.info("[email:log]", {
      id,
      from: message.from ?? this.defaultFrom,
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
      text: message.text,
      html: message.html,
    });
    return { id };
  }
}
