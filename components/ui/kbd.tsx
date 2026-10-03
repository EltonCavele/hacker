"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Kbd — a keyboard key or shortcut, rendered as a small keycap. Use `KbdGroup` to chain keys (⌘ + K).
 *
 * Write keys by name and let `Shortcut` render them for the user's platform ("mod" is ⌘ on Mac, Ctrl elsewhere).
 * To teach shortcuts without a cheat sheet, add `ShortcutHint` to a control: the hint appears while the user holds the modifier.
 * Don't use it for plain text that happens to mention a key.
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1.5 font-sans text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 select-none dark:bg-input/30 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

type Modifier = "meta" | "ctrl" | "alt" | "shift"
/** `mod` resolves to the platform's primary modifier: ⌘ on Apple devices, Ctrl elsewhere. */
type ModifierName = Modifier | "mod"

// --- platform ---------------------------------------------------------------------------------------------------

function subscribeNever() {
  return () => {}
}

/** True on Apple platforms. `false` on the server and during hydration, then corrected on the client. */
function useIsApple() {
  return React.useSyncExternalStore(
    subscribeNever,
    () => {
      const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
      return /mac|iphone|ipad|ipod/i.test(nav.userAgentData?.platform ?? navigator.platform ?? "")
    },
    () => false
  )
}

// --- modifier tracking (one set of global listeners, shared by every hint) -------------------------------------------

const held: Record<Modifier, boolean> = { meta: false, ctrl: false, alt: false, shift: false }
const listeners = new Set<() => void>()

function sync(event: KeyboardEvent) {
  const next: Record<Modifier, boolean> = {
    meta: event.metaKey,
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
  }
  if ((Object.keys(next) as Modifier[]).every((key) => next[key] === held[key])) return
  Object.assign(held, next)
  for (const listener of listeners) listener()
}

function releaseAll() {
  if (!Object.values(held).some(Boolean)) return
  Object.assign(held, { meta: false, ctrl: false, alt: false, shift: false })
  for (const listener of listeners) listener()
}

function subscribeHeld(listener: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("keydown", sync, true)
    window.addEventListener("keyup", sync, true)
    // Keyup never arrives if the window loses focus mid-press (e.g. ⌘-Tab), so release on blur.
    window.addEventListener("blur", releaseAll)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener("keydown", sync, true)
      window.removeEventListener("keyup", sync, true)
      window.removeEventListener("blur", releaseAll)
    }
  }
}

/** Whether the given modifier is currently held down. `mod` follows the platform (⌘ on Apple, Ctrl elsewhere). */
function useModifierHeld(modifier: ModifierName = "mod") {
  const apple = useIsApple()
  const key: Modifier = modifier === "mod" ? (apple ? "meta" : "ctrl") : modifier
  return React.useSyncExternalStore(
    subscribeHeld,
    () => held[key],
    () => false
  )
}

// --- rendering --------------------------------------------------------------------------------------------------

/** Key label for the platform: "mod" → ⌘ / Ctrl, "alt" → ⌥ / Alt, "shift" → ⇧ / Shift, "enter" → ↵. Others pass through. */
function keyLabel(key: string, apple: boolean) {
  switch (key.toLowerCase()) {
    case "mod":
      return apple ? "⌘" : "Ctrl"
    case "meta":
      return apple ? "⌘" : "Win"
    case "ctrl":
      return apple ? "⌃" : "Ctrl"
    case "alt":
      return apple ? "⌥" : "Alt"
    case "shift":
      return apple ? "⇧" : "Shift"
    case "enter":
      return "↵"
    case "esc":
    case "escape":
      return "Esc"
    default:
      return key.length === 1 ? key.toUpperCase() : key
  }
}

/** A shortcut as keycaps for the user's platform: `<Shortcut keys={["mod", "K"]} />` → ⌘ K on Mac, Ctrl K elsewhere. */
function Shortcut({ keys, className }: { keys: readonly string[]; className?: string }) {
  const apple = useIsApple()
  return (
    <KbdGroup className={className}>
      {keys.map((key) => (
        <Kbd key={key}>{keyLabel(key, apple)}</Kbd>
      ))}
    </KbdGroup>
  )
}

/**
 * ShortcutHint — shows a control's shortcut only while the user holds the modifier ("a shortcuts list teaches people
 * once; holding ⌘ teaches them every time"). Put it inside a `relative` control; it floats on the corner, so nothing shifts.
 */
function ShortcutHint({
  keys,
  modifier = "mod",
  className,
}: {
  /** The full shortcut, modifier included: `["mod", "S"]`. */
  keys: readonly string[]
  /** Which held key reveals the hint. Defaults to the platform's primary modifier. */
  modifier?: ModifierName
  className?: string
}) {
  const visible = useModifierHeld(modifier)
  return (
    <span
      data-slot="shortcut-hint"
      data-visible={visible}
      aria-hidden
      className={cn(
        "pointer-events-none absolute -top-2.5 -right-2 z-10 origin-bottom-left scale-90 opacity-0 transition-[opacity,scale] duration-150 ease-out data-[visible=true]:scale-100 data-[visible=true]:opacity-100 motion-reduce:transition-none",
        className
      )}
    >
      <Shortcut keys={keys} />
    </span>
  )
}

export { Kbd, KbdGroup, Shortcut, ShortcutHint, useModifierHeld, useIsApple }
export type { ModifierName }
