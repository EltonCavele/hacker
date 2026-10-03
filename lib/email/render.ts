import "server-only";

import { render } from "@react-email/components";
import type { ReactElement } from "react";

/** Renders a React Email template to the `html` and plain-`text` parts `sendEmail` expects. */
export async function renderEmail(template: ReactElement): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([render(template), render(template, { plainText: true })]);
  return { html, text };
}
