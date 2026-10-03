import * as React from "react"
import { cn } from "@/lib/utils"

type ProgressiveBlurSide = "top" | "bottom" | "left" | "right"

/**
 * Seven stacked blur layers, each masked to a band (% of the overlay, measured from the outer edge). Blur strength
 * grows toward the edge, so detail dissolves progressively instead of fading to a flat colour (detail.design).
 */
const LAYERS = [
  { blur: 48, from: 0, to: 25 },
  { blur: 32, from: 0, to: 37.5 },
  { blur: 16, from: 12.5, to: 50 },
  { blur: 8, from: 25, to: 62.5 },
  { blur: 4, from: 37.5, to: 75 },
  { blur: 2, from: 50, to: 87.5 },
  { blur: 1, from: 62.5, to: 100 },
] as const

/** Gradient axis, pointing away from the edge the overlay is attached to. */
const AXIS: Record<ProgressiveBlurSide, string> = {
  top: "to bottom",
  bottom: "to top",
  left: "to right",
  right: "to left",
}

const TINT: Record<ProgressiveBlurSide, string> = {
  top: "bg-linear-to-b",
  bottom: "bg-linear-to-t",
  left: "bg-linear-to-r",
  right: "bg-linear-to-l",
}

const POSITION: Record<ProgressiveBlurSide, string> = {
  top: "inset-x-0 top-0",
  bottom: "inset-x-0 bottom-0",
  left: "inset-y-0 left-0",
  right: "inset-y-0 right-0",
}

/** Opaque inside the band, transparent at both ends; the band touching the outer edge starts opaque, the last one ends opaque. */
function bandMask(axis: string, from: number, to: number) {
  const stops: string[] = []
  stops.push(from === 0 ? "black 0%" : `transparent ${from}%`)
  if (from > 0) stops.push(`black ${from + 12.5}%`)
  stops.push(to === 100 ? "black 100%" : `black ${to - 12.5}%`)
  if (to < 100) stops.push(`transparent ${to}%`)
  return `linear-gradient(${axis}, ${stops.join(", ")})`
}

/**
 * ProgressiveBlur — a soft blurred edge for content that scrolls underneath something (a sticky header, a footer bar).
 *
 * Unlike a colour-fade gradient it keeps colour and dissolves only detail, so photos and saturated UI don't look washed out.
 * Place it as a sibling of the scroller, inside a `relative` wrapper, and put your header above it with a higher `z-index`:
 * `<div className="relative"><div className="overflow-y-auto">…</div><ProgressiveBlur side="top" /></div>`.
 * It ignores pointer events. `tint` adds a surface-coloured wash so text on the edge stays readable.
 * Don't use it as a general background blur (use a plain `backdrop-blur`) or on content that doesn't scroll.
 */
function ProgressiveBlur({
  side = "top",
  size = 80,
  tint = true,
  layerClassName,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  /** Edge of the wrapper the blur is attached to. */
  side?: ProgressiveBlurSide
  /** Thickness of the blurred band, in px. */
  size?: number
  /** Add the surface-coloured wash over the blur. */
  tint?: boolean
  /**
   * Classes for each blur layer. To fade the effect, put the opacity here: opacity on the wrapper (or any ancestor) turns it
   * into a backdrop root and the blur disappears while it is below 1.
   */
  layerClassName?: string
}) {
  const axis = AXIS[side]
  const vertical = side === "top" || side === "bottom"

  return (
    <div
      data-slot="progressive-blur"
      data-side={side}
      aria-hidden
      className={cn("pointer-events-none absolute z-10", POSITION[side], className)}
      style={{ ...(vertical ? { height: size } : { width: size }), ...style }}
      {...props}
    >
      {LAYERS.map(({ blur, from, to }) => {
        const mask = bandMask(axis, from, to)
        return (
          <div
            key={blur}
            className={cn("absolute inset-0", layerClassName)}
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        )
      })}
      {tint && (
        <div
          className={cn("absolute inset-0 from-background/55 to-transparent", TINT[side])}
        />
      )}
    </div>
  )
}

export { ProgressiveBlur }
export type { ProgressiveBlurSide }
