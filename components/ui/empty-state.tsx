import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * EmptyState — what a list, table or section shows when there is nothing to display yet (no tasks, no payments, no results).
 *
 * Optional `icon` above a `title`, a short `description` and an `action` (usually a Button) that leads to the next step.
 * Use it for: empty collections and "no results" after a search or filter.
 * Don't use it for: loading (Skeleton), failures (Alert or the page's `ErrorState`), or one-off messages.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-8 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export { EmptyState }
