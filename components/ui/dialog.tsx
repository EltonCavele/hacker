"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Dialog as DialogPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { ScrollShadow } from "@/components/ui/scroll-shadow"
import { SheetHandle } from "@/components/ui/sheet-handle"
import { X } from "reicon-react"

/**
 * Dialog — modal window that blocks the page for a focused task (edit a record, fill a short form, view details).
 *
 * Compose: Dialog > DialogTrigger + DialogContent (DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter).
 * Pass `size` (sm default, md, lg, xl) to widen it on desktop; mobile ignores it.
 * Wrap long content in DialogBody: it is a ScrollShadow, so it scrolls on its own (fading the edges that hide content) while the header and footer stay fixed. Without it the whole dialog scrolls.
 * On screens below `sm` it opens as a bottom sheet (grabber handle: swipe down to close; with `isExpansible` also swipe up to expand, footer stays pinned; footer buttons become `lg`).
 * Don't use it for destructive confirmations (use AlertDialog), long flows or side panels (use Sheet), or simple hints (use Popover/Tooltip).
 * DialogTitle is required for screen readers.
 */
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 max-sm:data-closed:duration-[350ms] supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

/** Desktop (`sm`+) max width per size; capped so the dialog never touches the viewport edges. Mobile is always a full-width sheet. */
const dialogSizes = {
  sm: "sm:max-w-[min(24rem,calc(100%-2rem))]",
  md: "sm:max-w-[min(28rem,calc(100%-2rem))]",
  lg: "sm:max-w-[min(32rem,calc(100%-2rem))]",
  xl: "sm:max-w-[min(40rem,calc(100%-2rem))]",
} as const

type DialogSize = keyof typeof dialogSizes

function DialogContent({
  className,
  children,
  showCloseButton = true,
  isExpansible = false,
  size = "sm",
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  /** Max width on desktop (`sm` 24rem, `md` 28rem, `lg` 32rem, `xl` 40rem). No effect on mobile, where it is always a full-width bottom sheet. */
  size?: DialogSize
  /** Bottom sheet only (below `sm`): lets the user swipe the handle up to expand to full height. The footer stays pinned to the bottom. */
  isExpansible?: boolean
}) {
  const t = useTranslations("common")
  const closeRef = React.useRef<HTMLButtonElement>(null)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          // Mobile: bottom sheet (full width, anchored to the bottom, slides up). sm+: centred modal.
          dialogSizes[size],
          isExpansible && "max-sm:max-h-[60dvh]",
          "fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[calc(100dvh-2rem)] w-full gap-4 overflow-y-auto rounded-t-2xl bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm text-popover-foreground duration-200 outline-none data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-bottom sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:pb-4 sm:duration-100 sm:data-open:slide-in-from-bottom-0 sm:data-open:zoom-in-95 sm:data-closed:slide-out-to-bottom-0 sm:data-closed:zoom-out-95 max-sm:data-closed:duration-[350ms] max-sm:data-closed:ease-[cubic-bezier(0.32,0.72,0,1)]",
          className
        )}
        {...props}
      >
        <SheetHandle isExpansible={isExpansible} onDismiss={() => closeRef.current?.click()} />
        <DialogPrimitive.Close ref={closeRef} hidden aria-hidden tabIndex={-1} />
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2 z-20"
              size="icon-sm"
            >
              <X/>
              <span className="sr-only">{t("close")}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex shrink-0 flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<typeof ScrollShadow>) {
  return (
    <ScrollShadow
      data-slot="dialog-body"
      className={cn("-mx-4 min-h-0 flex-1 px-4", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const t = useTranslations("common")
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "sticky -bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mt-auto shrink-0 -mx-4 -mb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col-reverse gap-2 rounded-b-xl bg-popover p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-bottom-4 sm:-mb-4 sm:pb-4 max-sm:*:h-11 max-sm:*:px-6 max-sm:*:text-base sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{t("close")}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export type { DialogSize }

export {
  Dialog,
  DialogClose,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
