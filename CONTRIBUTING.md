# Contributing

## Setup

1. Use the Node version in `.nvmrc` (`nvm use`).
2. Copy `.env.example` to `.env` and `.env.docker`, and set `BETTER_AUTH_SECRET` (32+ characters).
3. `npm install` (this also installs the git hooks).
4. `npm run dev:infra` to start PostgreSQL, Redis and MinIO, then `npm run db:migrate`.
5. `npm run dev`, and `npm run worker` in a second terminal.

Read `docs/README.md` for how each area works. For any UI change read `docs/design-system.md` first.

## Before you open a PR

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs the same checks. Pre-commit runs Prettier and ESLint on the staged files; pre-push runs the typecheck.
`npm run format` formats the whole repo (do it in its own commit).

## Conventions

- Features live in `features/<name>/`; shared infrastructure in `lib/`; primitives in `components/ui`.
- Validate input on the server (zod) and check authentication/authorization in every Server Action and route.
- Use colour tokens and existing components; update `docs/design-system.md` and `app/design-system/page.tsx` when you add one.
- Schema changes need a migration: `npm run db:migrate -- --name <name>`; commit the generated SQL.
- New environment variables go in `.env.example` and the env validation.
- Commits: short imperative summary, e.g. `feat: add push subscription cleanup`. One concern per PR.

## Reporting security issues

See `SECURITY.md`. Do not use public issues.
