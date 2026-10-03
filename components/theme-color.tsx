"use client";

import * as React from "react";
import { useTheme } from "next-themes";

/**
 * Dynamic theme colour — keeps the browser chrome (mobile address bar, PWA title bar) the same colour as the page, so the
 * browser UI merges with the app instead of showing a stark strip (detail.design).
 *
 * Mount `<ThemeColor />` once, inside ThemeProvider (done in app/layout.tsx): it follows the active theme.
 * For a screen whose background differs (a hero, a full-bleed image, a sheet), call `useThemeColor("#0f172a")` in it:
 * the colour applies while the component is mounted and the previous one is restored on unmount. Overrides stack.
 */

const SELECTOR = 'meta[name="theme-color"]';

let base: string | null = null;
const overrides: { id: symbol; color: string }[] = [];
let current: string | null = null;
const listeners = new Set<() => void>();

/** Any CSS colour (including oklch/lab) to `#rrggbb`, via canvas, so it works in a `<meta>` on every browser. */
function toHex(css: string): string | null {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.canvas.width = ctx.canvas.height = 1;
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function apply() {
  const color = overrides.at(-1)?.color ?? base;
  if (!color || color === current) return;
  current = color;

  // The server renders one tag per colour scheme (with `media`). The app's theme is class-based and can disagree with the
  // OS, so write the real colour to every tag; whichever one the browser picks is right.
  const tags = document.querySelectorAll<HTMLMetaElement>(SELECTOR);
  if (tags.length === 0) {
    const tag = document.createElement("meta");
    tag.name = "theme-color";
    document.head.appendChild(tag);
    tag.content = color;
  } else {
    for (const tag of tags) tag.content = color;
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The colour currently applied to the browser chrome (`null` on the server and before the first paint). */
export function useCurrentThemeColor() {
  return React.useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

/** Follows the active theme: reads the page background and mirrors it into `<meta name="theme-color">`. */
export function ThemeColor() {
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    // Wait a frame so the theme class is on <html> and the new background has been computed.
    const frame = requestAnimationFrame(() => {
      const hex = toHex(getComputedStyle(document.body).backgroundColor);
      if (hex) {
        base = hex;
        apply();
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [resolvedTheme]);

  return null;
}

/**
 * Overrides the browser chrome colour while the calling component is mounted. Pass any CSS colour; `null`/`undefined`
 * leaves the theme colour alone.
 */
export function useThemeColor(color?: string | null) {
  React.useEffect(() => {
    if (!color) return;
    const hex = toHex(color);
    if (!hex) return;

    const id = Symbol("theme-color");
    overrides.push({ id, color: hex });
    apply();

    return () => {
      const index = overrides.findIndex((entry) => entry.id === id);
      if (index !== -1) overrides.splice(index, 1);
      apply();
    };
  }, [color]);
}
