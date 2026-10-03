"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircle, InfoCircle, AlertTriangle, XCircle } from "reicon-react"
import { Spinner } from "@/components/ui/spinner"

const MOBILE_QUERY = "(max-width: 639px)"

function subscribeMobile(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

const useIsMobile = () =>
  useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  )

/**
 * Toaster — renders toasts. Mounted once in app/layout.tsx. Appears at the top on mobile screens, bottom-right otherwise. Trigger with `toast.success("…")` / `toast.error("…")` from "sonner".
 * Use for brief, non-blocking feedback after an action. Use Alert for messages that must persist.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "top-center" : "bottom-right"}
      icons={{
        success: (
          <CheckCircle className="size-4" />
        ),
        info: (
          <InfoCircle className="size-4" />
        ),
        warning: (
          <AlertTriangle className="size-4" />
        ),
        error: (
          <XCircle className="size-4" />
        ),
        loading: (
          <Spinner />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-2xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
