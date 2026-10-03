"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/** A swipe counts as intentional past a distance (px), or as a flick (speed px/ms) over a minimum distance. */
const DISMISS_DISTANCE = 100
const EXPAND_DISTANCE = 60
const FLICK_VELOCITY = 0.5
const FLICK_MIN_DISTANCE = 40
const SNAP_MS = 250
/** Slide-out when a swipe dismisses the sheet; same curve/length as the CSS close animation. */
const DISMISS_MS = 350
const DISMISS_EASE = "cubic-bezier(0.32, 0.72, 0, 1)"
const MARGIN = 32 // matches `max-h-[calc(100dvh-2rem)]` on the content

type Drag = { el: HTMLElement; startY: number; startT: number; startHeight: number }

/**
 * SheetHandle — the grabber bar at the top of a bottom sheet (Dialog / AlertDialog below `sm`).
 *
 * Swipe down: close (or collapse back, when expanded). Swipe up: expand to full height, only with `isExpansible`.
 * It moves the closest `[data-slot$="-content"]` element directly, so it needs no refs or state from
 * the dialog; `onDismiss` just has to close it. Hidden from `sm` up, where the dialog is a centred modal.
 */
function SheetHandle({ onDismiss, isExpansible = false, className }: { onDismiss: () => void; isExpansible?: boolean; className?: string }) {
  const handleRef = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<Drag | null>(null)
  const sheet = React.useRef({ expanded: false, baseHeight: 0 })

  function settle(el: HTMLElement) {
    el.style.transition = `transform 200ms ease, height ${SNAP_MS}ms ease`
  }

  /** Back to the class-driven (collapsed) size. */
  function reset(el: HTMLElement) {
    el.style.height = ""
    el.style.maxHeight = ""
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const el = handleRef.current?.closest<HTMLElement>('[data-slot$="-content"]')
    if (!el) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { el, startY: event.clientY, startT: event.timeStamp, startHeight: el.offsetHeight }
    if (!sheet.current.expanded) sheet.current.baseHeight = el.offsetHeight
    el.style.transition = "none"
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d) return
    const dy = event.clientY - d.startY
    if (dy > 0 && sheet.current.expanded) {
      // Collapsing: shrink the height instead of sliding the sheet. It is anchored to the bottom, so the
      // footer stays put while the top edge comes down.
      d.el.style.height = `${Math.max(sheet.current.baseHeight, d.startHeight - dy)}px`
    } else if (dy > 0) {
      d.el.style.transform = `translateY(${dy}px)`
    } else if (isExpansible && !sheet.current.expanded) {
      // Pulling up grows the sheet live (it is anchored to the bottom).
      const max = window.innerHeight - MARGIN
      d.el.style.maxHeight = `${max}px`
      d.el.style.height = `${Math.min(max, sheet.current.baseHeight - dy)}px`
    }
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    drag.current = null
    if (!d) return
    const { el } = d
    const dy = event.clientY - d.startY
    const velocity = dy / Math.max(1, event.timeStamp - d.startT)
    const state = sheet.current
    settle(el)

    if (dy > 0) {
      const intentional = dy > DISMISS_DISTANCE || (dy > FLICK_MIN_DISTANCE && velocity > FLICK_VELOCITY)
      if (state.expanded) {
        // Collapse (or snap back to expanded) by height only; never translate, so the footer doesn't move.
        if (intentional) {
          el.style.height = `${state.baseHeight}px`
          state.expanded = false
          window.setTimeout(() => reset(el), SNAP_MS)
        } else {
          el.style.height = `${d.startHeight}px`
        }
      } else if (!intentional) {
        el.style.transform = ""
      } else {
        el.style.transition = `transform ${DISMISS_MS}ms ${DISMISS_EASE}`
        el.style.transform = "translateY(100%)"
        window.setTimeout(() => {
          // Already off-screen: skip the exit animation so it doesn't jump back before unmounting.
          el.style.animation = "none"
          onDismiss()
        }, DISMISS_MS)
      }
    } else if (isExpansible && !state.expanded) {
      const intentional = -dy > EXPAND_DISTANCE || (-dy > FLICK_MIN_DISTANCE && velocity < -FLICK_VELOCITY)
      if (intentional) {
        el.style.maxHeight = `${window.innerHeight - MARGIN}px`
        el.style.height = `${window.innerHeight - MARGIN}px`
        state.expanded = true
      } else {
        el.style.height = `${state.baseHeight}px`
        window.setTimeout(() => reset(el), SNAP_MS)
      }
    }
  }

  return (
    <div
      ref={handleRef}
      data-slot="sheet-handle"
      aria-hidden
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn(
        "sticky -top-4 z-10 shrink-0 -mx-4 -mt-4 -mb-2 flex h-7 cursor-grab touch-none items-center justify-center bg-popover active:cursor-grabbing sm:hidden",
        className
      )}
    >
      <span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
    </div>
  )
}

export { SheetHandle }
