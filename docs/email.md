# Email

Email sending is provided by `lib/email`. The public entry point is `sendEmail` from `@/lib/email`.

## Current implementation

- `lib/email/types.ts` defines the message and provider interface.
- `lib/email/providers/resend.ts` sends email through Resend.
- `lib/email/index.ts` selects and caches the provider instance.
- Supported providers: `resend` (default) and `log`, which only logs the message to the server console and needs no credentials (`EMAIL_FROM` optional). Use `EMAIL_PROVIDER=log` for local development and tests.
- `EMAIL_FROM` and `RESEND_API_KEY` are required when sending.

## Usage

Call `sendEmail` only from server code, such as a Server Action, Route Handler, or worker. Supply at least one of `html` or `text`, plus `to` and `subject`. Validate recipients and content in the feature or route that accepts them.

## Templates

Templates are [React Email](https://react.email) components in `emails/`. Preview them with `npm run email:dev` (port 3001); each template exports `PreviewProps` for that.

- `emails/theme.ts`: colours, font and radii as hex (email clients don't support CSS variables). Mirrors the tokens in `app/globals.css`; edit it to rebrand.
- `emails/components/`: building blocks. `EmailLayout` is the shared shell (grey page, brand header, rounded card, optional footer); inside it use `EmailHeading`, `EmailText`, `EmailCode`, `EmailButton`, `EmailDivider`.
- `emails/otp-email.tsx`: the verification-code email; copy it as the starting point for new templates.

Render and send from server code:

```ts
const content = await renderEmail(createElement(OtpEmail, { code, expiresInMinutes: 5 }));
await sendEmail({ to, subject, ...content }); // html + plain-text
```

Use `createElement` in `.ts` files, or JSX in `.tsx`. Don't use Tailwind classes or `components/ui` in emails; use inline styles from `emailTheme`.

## Adding a provider

Implement `EmailProvider` and return the provider message ID as `{ id }`. Add provider selection in `lib/email/index.ts`. Do not expose credentials to client code or add provider-specific calls to application features.
