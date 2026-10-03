# Security policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Report them privately through GitHub's
["Report a vulnerability"](../../security/advisories/new) (Security tab) or by email to the maintainer.

Include what you found, how to reproduce it, and the impact you expect. You can expect an acknowledgement within
3 business days and a status update within 10.

## Scope

In scope: authentication and sessions, authorization (data access layer), payment and messaging webhooks,
file uploads, push subscriptions, and anything that exposes another user's data.

Out of scope: findings that need a compromised device or admin account, missing best-practice headers without a
demonstrated impact, and vulnerabilities in third-party services themselves.

## Handling secrets

- Never commit `.env`, `.env.docker` or real keys; only `.env.example` is tracked.
- Rotate `BETTER_AUTH_SECRET`, webhook keys, `VAPID_*` and storage credentials if they leak.
- Webhook endpoints must verify the provider signature before acting (see `docs/payments.md`, `docs/messaging.md`).
