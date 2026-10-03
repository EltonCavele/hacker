"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type LoadState = "loading" | "loaded" | "error"

/** Reflects the load state on the element itself (no React state, so nothing re-renders and it survives hydration). */
function mark(img: HTMLImageElement, state: LoadState) {
  img.dataset.state = state
}

/**
 * BlurImage — an image that appears out of a soft blur instead of popping in (detail.design).
 *
 * It starts blurred and transparent, and eases to sharp when the browser fires `load`. Images already in the cache, or that
 * finished before hydration, are picked up too. Pass `placeholder` (a tiny data URL or low-res URL) to show a blurred preview
 * underneath while the real image loads; without it the box shows a muted surface.
 *
 * Give the wrapper a size (`wrapperClassName="aspect-video"`, `h-48 w-full`…) so the layout doesn't jump. On error the image stays
 * hidden and the muted surface remains. Respects reduced motion (fade only, no blur).
 * Uses a plain `<img>`; for remote, optimised delivery use `next/image` and apply the same data-state styling.
 */
function BlurImage({
  className,
  wrapperClassName,
  placeholder,
  alt,
  onLoad,
  onError,
  ...props
}: Omit<React.ComponentProps<"img">, "placeholder"> & {
  /** Tiny preview (data URL or low-res URL) shown blurred under the image while it loads. */
  placeholder?: string
  /** Classes for the wrapper that clips the image (size, aspect ratio, radius). */
  wrapperClassName?: string
}) {
  return (
    <span
      data-slot="blur-image"
      className={cn("relative block overflow-hidden bg-muted", wrapperClassName)}
    >
      {placeholder && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholder}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover blur-xl"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={(img) => {
          // Already decoded before React attached `onLoad` (cache, or finished before hydration).
          if (img?.complete && img.naturalWidth > 0 && !img.dataset.state) mark(img, "loaded")
        }}
        data-slot="blur-image-img"
        data-state="loading"
        alt={alt}
        decoding="async"
        onLoad={(event) => {
          mark(event.currentTarget, "loaded")
          onLoad?.(event)
        }}
        onError={(event) => {
          mark(event.currentTarget, "error")
          onError?.(event)
        }}
        className={cn(
          "relative size-full scale-105 object-cover opacity-0 blur-xl transition-[filter,opacity,scale] duration-700 ease-out motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:duration-300 data-[state=loaded]:scale-100 data-[state=loaded]:opacity-100 data-[state=loaded]:blur-none",
          className
        )}
        {...props}
      />
    </span>
  )
}

export { BlurImage }
