/* Nextpad service worker: Web Push only (no offline caching). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Nextpad";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body,
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: "/pwa-icon/192",
      badge: "/pwa-icon/192",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) return open.focus().then((client) => ("navigate" in client ? client.navigate(target) : client));
      return self.clients.openWindow(target);
    }),
  );
});

// The browser rotated the subscription: re-subscribe and tell the backend (cookies are sent same-origin).
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription?.options;
      let applicationServerKey = options?.applicationServerKey;
      if (!applicationServerKey) {
        const res = await fetch("/api/push/public-key");
        if (!res.ok) return;
        const { publicKey } = await res.json();
        const padded = publicKey.replace(/-/g, "+").replace(/_/g, "/");
        applicationServerKey = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
      }
      const subscription =
        event.newSubscription ||
        (await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey }));
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(subscription.toJSON()),
      });
    })(),
  );
});
