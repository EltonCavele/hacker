import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Spinner — indeterminate "working" indicator for a small area (inside a Button, next to a label).
 * For page or section loading prefer a Skeleton. Buttons show one automatically with `isLoading`.
 * Drawn inline (a 3/4 arc, same shape as lucide's Loader2) because reicon's `Loader` is a spoked spinner.
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      role="status"
      aria-label="A carregar"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

export { Spinner }
