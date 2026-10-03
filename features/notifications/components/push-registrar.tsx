"use client";

import { useEffect } from "react";
import { hasPushIntent, isPushSupported, registerServiceWorker, syncPushSubscription } from "../push-client";

/** Registers the service worker and re-syncs the subscription for users who opted in on this device. */
export function PushRegistrar() {
  useEffect(() => {
    if (!isPushSupported()) return;
    registerServiceWorker().catch(console.error);
    if (hasPushIntent() && Notification.permission === "granted") {
      syncPushSubscription().catch(console.error);
    }
  }, []);
  return null;
}
