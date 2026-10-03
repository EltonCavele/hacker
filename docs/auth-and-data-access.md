# Authentication and data access

Authentication uses Better Auth with the Prisma adapter. Server auth setup is in `lib/auth/index.ts`; the browser client is in `lib/auth/client.ts`.

## Sessions and protected access

- `/api/auth/[...all]` forwards Better Auth requests.
- `features/auth/queries.ts` reads the current session from request headers.
- `lib/dal/index.ts` exports `requireUser()`, which redirects unauthenticated users to `/login` and returns a small user object.
- Server queries, actions, and services should check authentication and authorization before reading or changing private data.

Use `getSession()` in HTTP routes that need to return an API status such as `401`. Use `requireUser()` in page-oriented server code where redirecting to login is appropriate. Do not trust user IDs supplied by the client when a session can provide them.

Google sign-in is enabled only when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured. Set `BETTER_AUTH_URL` and a strong `BETTER_AUTH_SECRET` in deployed environments. Never expose secrets through `NEXT_PUBLIC_` variables.

## Passkeys

Passkeys use the Better Auth `@better-auth/passkey` plugin (`lib/auth/index.ts`, `passkeyClient()` in `lib/auth/client.ts`). `rpID`/`origin` are derived from `BETTER_AUTH_URL`, so it must match the URL users open (passkeys are bound to the domain).

- **First login**: the dashboard layout renders `PasskeyPrompt` while `user.passkeyPromptedAt` is empty. Accepting or skipping calls `markPasskeyPrompted()` (`features/auth/actions.ts`), so it is asked only once.
- **Settings**: `PasskeySettings` is an instant switch on `/dashboard/settings`. On registers a passkey on the current device; off deletes all the user's passkeys.
- **Login**: `/login` has "Entrar com passkey" next to Google sign-in.

## Account deletion

Settings → Delete account (`features/auth/components/delete-account.tsx`) calls Better Auth's `deleteUser` (enabled in `lib/auth/index.ts`). The user types their email to confirm.

- Better Auth requires a session created within `session.freshAge` (1 day); an older session gets `SESSION_EXPIRED` and the dialog asks the user to sign in again.
- `beforeDelete` refuses (`ACTIVE_SUBSCRIPTION`) while the user has a subscription that is active, past due or on hold and not set to cancel at period end, because deleting rows would not stop the provider from billing.
- The database cascades to sessions, accounts, passkeys, push subscriptions, tasks and payment rows. Messages sent by the user are kept with the author unset. If you must retain invoices for tax reasons, change the payment relations to `SetNull` and anonymise instead of cascading before launch.
- `afterDelete` removes the user's files from storage (`users/<id>/` and `pending/users/<id>/`) and logs failures without blocking.
- Add cleanup for any new per-user data (external services, caches) in `afterDelete`.

## Legal pages

`/terms` and `/privacy` render the text in `messages/*.json` under `legal` (`features/legal/components/legal-document.tsx`). Set `LEGAL_COMPANY_NAME` and `LEGAL_CONTACT_EMAIL`, bump `LEGAL_UPDATED_AT` in `lib/legal.ts` when the text changes, and have a lawyer review the template. The login page and home page link to them. If you add analytics, marketing cookies or new data processors, update the Privacy text first.
