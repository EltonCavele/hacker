"use client";

import { useEffect, useState } from "react";

// Browsers never reveal whether a passkey exists, so we remember on this device
// when one was created or used to sign in.
const DEVICE_PASSKEY_KEY = "nextpad:device-has-passkey";

export function setDevicePasskey(value: boolean) {
  try {
    if (value) localStorage.setItem(DEVICE_PASSKEY_KEY, "1");
    else localStorage.removeItem(DEVICE_PASSKEY_KEY);
  } catch {
    // Storage blocked: the passkey button simply stays hidden.
  }
}

function readDevicePasskey() {
  try {
    return localStorage.getItem(DEVICE_PASSKEY_KEY) === "1";
  } catch {
    return false;
  }
}

type PasskeySupport = { platform: boolean; conditional: boolean; hasDevicePasskey: boolean };

/** Resolves passkey capabilities; all flags are `false` until detection finishes. */
export function usePasskeySupport(): PasskeySupport {
  const [support, setSupport] = useState<PasskeySupport>({
    platform: false,
    conditional: false,
    hasDevicePasskey: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return;
    let cancelled = false;
    Promise.all([
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.().catch(() => false),
      PublicKeyCredential.isConditionalMediationAvailable?.().catch(() => false),
    ]).then(([platform, conditional]) => {
      if (!cancelled) {
        setSupport({ platform: !!platform, conditional: !!conditional, hasDevicePasskey: readDevicePasskey() });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return support;
}
