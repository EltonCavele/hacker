"use client";

// Browser-side Web Push lifecycle. "Intent" (user opted in on this device) is tracked apart from the real
// subscription, because permission can be revoked from browser settings behind our back.
const INTENT_KEY = "nextpad:push-enabled";

export function isPushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** iOS only allows push for PWAs added to the home screen. */
export function needsInstallForPush() {
  if (typeof window === "undefined") return false;
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIos && !standalone;
}

export function hasPushIntent() {
  try {
    return localStorage.getItem(INTENT_KEY) === "1";
  } catch {
    return false;
  }
}

function setPushIntent(value: boolean) {
  try {
    if (value) localStorage.setItem(INTENT_KEY, "1");
    else localStorage.removeItem(INTENT_KEY);
  } catch {
    // Storage blocked: intent is simply not remembered.
  }
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/** Idempotent: reuses an existing subscription, otherwise creates one, then (re)posts it to the backend. */
export async function syncPushSubscription() {
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const res = await fetch("/api/push/public-key");
    if (!res.ok) throw new Error("Push is not configured on the server");
    const { publicKey } = (await res.json()) as { publicKey: string };
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Invalid push subscription");
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  if (!res.ok) throw new Error("Could not save push subscription");
}

let inFlightEnable: Promise<NotificationPermission | "error"> | null = null;

/** Asks permission (deduped) and subscribes. */
export function enablePush() {
  inFlightEnable ??= (async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return permission;
      await syncPushSubscription();
      setPushIntent(true);
      return permission;
    } catch (error) {
      console.error(error);
      return "error" as const;
    } finally {
      inFlightEnable = null;
    }
  })();
  return inFlightEnable;
}

/** Removes this device's subscription on the server and in the browser. */
export async function disablePush() {
  setPushIntent(false);
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => undefined);
  await subscription.unsubscribe();
}

/** For logout: drop the browser subscription without needing the (vanishing) auth session. */
export async function unsubscribeLocally() {
  setPushIntent(false);
  try {
    await (await getCurrentSubscription())?.unsubscribe();
  } catch {
    // Best effort.
  }
}
