export type EmailContent =
  | { html: string; text?: string }
  | { html?: string; text: string };

export type EmailMessage = EmailContent & {
  to: string | string[];
  subject: string;
  from?: string;
  replyTo?: string;
};

export type EmailSendResult = { id: string };

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>;
}
