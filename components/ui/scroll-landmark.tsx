"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ArrowUp, Undo } from "reicon-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

/** Scrolled past this (px) before the shortcut shows up. */
const SHOW_AFTER = 400
/** After jumping to the top, scrolling further than this (px) means "I'm reading again": forget the saved spot. */
const FORGET_AFTER = 40
/** `scrollend` isn't everywhere; if it never fires, assume the smooth scroll is done after this long (ms). */
const TRAVEL_TIMEOUT = 1000

type Mode = "hidden" | "top" | "return"

/** Pure decision: what to show (and whether the saved spot survives) for a scroll position. */
function decide(y: number, saved: number | null, threshold: number): { mode: Mode; saved: number | null } {
  const kept = saved !== null && y > FORGET_AFTER ? null : saved
  return { mode: kept !== null ? "return" : y > threshold ? "top" : "hidden", saved: kept }
}

/**
 * ScrollLandmark — a floating shortcut for long pages: jump to the top, and jump back to where you were.
 *
 * It shows after you've scrolled a bit. Tap it to go to the top; it then turns into "back where you were" and takes you
 * back to the exact spot. Scrolling on your own forgets the saved spot. (iOS's tap-the-status-bar can't return you.)
 *
 * For the page, render `<ScrollLandmark />` anywhere. For a scrolling container, pass its ref as `target` and place the
 * button inside a `relative` wrapper (it is `absolute` then). Use it on long, single-column content (docs, feeds, lists);
 * don't use it on short pages.
 */
function ScrollLandmark({
  target,
  className,
  threshold = SHOW_AFTER,
}: {
  /** Scroll container. Omit to follow the window. */
  target?: React.RefObject<HTMLElement | null>
  className?: string
  /** Distance scrolled (px) before the shortcut appears. */
  threshold?: number
}) {
  const t = useTranslations("common")
  const [mode, setMode] = React.useState<Mode>("hidden")
  const saved = React.useRef<number | null>(null)
  const travelling = React.useRef(false)
  const timer = React.useRef<number | undefined>(undefined)

  const container = () => target?.current ?? null
  const position = () => container()?.scrollTop ?? window.scrollY

  function refresh() {
    if (travelling.current) return
    const next = decide(position(), saved.current, threshold)
    saved.current = next.saved
    setMode(next.mode)
  }

  React.useEffect(() => {
    const el = target?.current ?? null
    const source: HTMLElement | Window = el ?? window

    const onScroll = () => {
      if (travelling.current) return
      const next = decide(el ? el.scrollTop : window.scrollY, saved.current, threshold)
      saved.current = next.saved
      setMode(next.mode)
    }

    onScroll()
    source.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      source.removeEventListener("scroll", onScroll)
      window.clearTimeout(timer.current)
    }
  }, [target, threshold])

  function travel(to: number) {
    const el = container()
    const source: HTMLElement | Window = el ?? window
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    travelling.current = true
    window.clearTimeout(timer.current)

    const done = () => {
      source.removeEventListener("scrollend", done)
      window.clearTimeout(timer.current)
      travelling.current = false
      refresh()
    }
    source.addEventListener("scrollend", done, { once: true })
    timer.current = window.setTimeout(done, TRAVEL_TIMEOUT)

    const options: ScrollToOptions = { top: to, behavior: reduce ? "auto" : "smooth" }
    if (el) el.scrollTo(options)
    else window.scrollTo(options)
  }

  function onClick() {
    if (mode === "top") {
      saved.current = position()
      setMode("return")
      travel(0)
    } else if (mode === "return" && saved.current !== null) {
      const back = saved.current
      saved.current = null
      setMode(back > threshold ? "top" : "hidden")
      travel(back)
    }
  }

  const visible = mode !== "hidden"
  const returning = mode === "return"
  const label = returning ? t("scrollReturn") : t("scrollTop")

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-slot="scroll-landmark"
      data-mode={mode}
      aria-label={label}
      title={label}
      aria-hidden={!visible || undefined}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
      className={cn(
        "z-30 rounded-full bg-background/80 shadow-md backdrop-blur-md transition-[opacity,translate,scale] duration-200 ease-out motion-reduce:transition-none",
        target ? "absolute right-3 bottom-3" : "fixed right-4 bottom-4",
        visible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-90 opacity-0",
        className
      )}
    >
      {returning ? <Undo /> : <ArrowUp />}
    </Button>
  )
}

export { ScrollLandmark }
