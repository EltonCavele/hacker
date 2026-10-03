export const PUSH_QUEUE = "push-notifications";

/** Keep it generic: payloads can show on lock screens. Real content is fetched in-app. */
export type PushPayload = {
  title: string;
  body?: string;
  /** Same tag replaces an earlier notification instead of stacking. */
  tag?: string;
  /** In-app path opened on click. */
  url?: string;
};

export type PushJob = { userId: string; payload: PushPayload };

/** Hosts of the push services; anything else is refused to avoid SSRF through stored endpoints. */
const ALLOWED_HOSTS = [
  "fcm.googleapis.com",
  "fcmregistrations.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "push.apple.com",
  "notify.windows.com",
];

export function isAllowedPushEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}
