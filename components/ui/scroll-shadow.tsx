"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ScrollShadow — a vertically scrolling region that softly fades the edges hiding content.
 *
 * Use it for any bounded, scrollable area (dialog body, side panel, list inside a card). Give it a
 * height constraint (`max-h-*`, or `flex-1 min-h-0` inside a flex column) or it won't scroll.
 * The fade is a `mask-image`, so it works on any background; each edge eases in/out as you scroll.
 * Don't use it for the page itself or for horizontal scrolling.
 *
 * `size` is the fade length in px. The `--shadow-*` properties are registered in globals.css so they animate.
 */
function ScrollShadow({
  className,
  onScroll,
  size = 32,
  style,
  ...props
}: React.ComponentProps<"div"> & { size?: number }) {
  const ref = React.useRef<HTMLDivElement>(null)

  // Writes data attributes straight to the element (no re-render per scroll event); the fade is CSS.
  const update = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.dataset.shadowTop = String(el.scrollTop > 0)
    el.dataset.shadowBottom = String(el.scrollTop + el.clientHeight < el.scrollHeight - 1)
  }, [])

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    // Container or content size changes (sheet expanding, content loading) move the edges too.
    const resize = new ResizeObserver(update)
    resize.observe(el)
    Array.from(el.children).forEach((child) => resize.observe(child))
    return () => resize.disconnect()
  }, [update])

  return (
    <div
      ref={ref}
      data-slot="scroll-shadow"
      onScroll={(event) => {
        update()
        onScroll?.(event)
      }}
      style={{ "--scroll-shadow-size": `${size}px`, ...style } as React.CSSProperties}
      className={cn(
        "overflow-y-auto",
        "[--shadow-bottom:0px] [--shadow-top:0px] data-[shadow-bottom=true]:[--shadow-bottom:var(--scroll-shadow-size)] data-[shadow-top=true]:[--shadow-top:var(--scroll-shadow-size)]",
        "transition-[--shadow-top,--shadow-bottom] duration-300 ease-out motion-reduce:transition-none",
        // Eased (ease-out) fade: more stops than a plain linear ramp so the edge dissolves instead of banding.
        "[-webkit-mask-image:var(--scroll-shadow-mask)] [mask-image:var(--scroll-shadow-mask)]",
        "[--scroll-shadow-mask:linear-gradient(to_bottom,transparent_0,rgb(0_0_0/0.15)_calc(var(--shadow-top)*0.3),rgb(0_0_0/0.5)_calc(var(--shadow-top)*0.6),black_var(--shadow-top),black_calc(100%-var(--shadow-bottom)),rgb(0_0_0/0.5)_calc(100%-var(--shadow-bottom)*0.6),rgb(0_0_0/0.15)_calc(100%-var(--shadow-bottom)*0.3),transparent_100%)]",
        className
      )}
      {...props}
    />
  )
}

export { ScrollShadow }
