# PWA and push notifications

The app is an installable PWA (`app/manifest.ts`, icons rendered by `app/pwa-icon/[size]/route.tsx`, Apple meta in `app/layout.tsx`) with Web Push.

## Setup

```bash
npx web-push generate-vapid-keys
```

Set `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` in the app **and** worker environment. Without them the app boots normally and pushes are skipped (logged by the worker). Run migrations (`db:migrate`) for the `push_subscription` table. Push needs HTTPS (or localhost); locally use `next dev --experimental-https` to test on devices.

## How it works

| Piece | Where |
| --- | --- |
| Service worker (push, click, subscription change) | `public/sw.js` (no-cache header in `next.config.ts`) |
| Browser lifecycle (permission, subscribe, local unsubscribe on sign-out) | `features/notifications/push-client.ts` |
| Registration + re-sync after login | `PushRegistrar` in the dashboard layout |
| Settings toggle + test button | `features/notifications/components/push-settings.tsx` |
| Subscribe / unsubscribe / public key / test | `app/api/push/*` (endpoint host allowlist in `lib/push/types.ts`) |
| Sending | `sendPushToUser()` in `lib/push` enqueues; `push-notifications` worker (`lib/push/deliver.ts`) sends |

One row per device; `endpoint` is globally unique and upserted. 404/410 from the push service sets `revokedAt` (never deleted); other failures retry with backoff.

## Sending a notification

```ts
import { sendPushToUser } from "@/lib/push";
await sendPushToUser(userId, { title: "Nextpad", body: "Tens uma nova mensagem", tag: "messages", url: "/dashboard" });
```

Keep payloads generic: they can appear on lock screens. On iOS, push only works after the app is added to the home screen.
