import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * List — simple vertical rows with a start side (title + description) and an end side (value, badge, action).
 *
 * Compose: List > ListItem > [ListIcon] + ListItemStart (ListItemTitle, ListItemDescription) + ListItemEnd.
 * A ListItem expects `ListItemStart` and `ListItemEnd`, with an optional `ListIcon` before them: the icon sits to the left of the title and description, vertically centered.
 * Rows have no dividers or surface; add `className="border-b"` (or wrap in a Card) if you need them.
 * Use it for payment history, members, settings summaries. Use Table for comparable columns, DropdownMenu/Select for choices.
 */
function List({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list"
      role="list"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

/**
 * A single row. Expects `ListItemStart` and `ListItemEnd` (the start side grows,
 * the end side hugs the right edge), optionally preceded by a `ListIcon`.
 */
function ListItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item"
      role="listitem"
      className={cn(
        "flex items-center justify-between gap-4 py-3 hover:text-muted-foreground/80 cursor-pointer",
        className
      )}
      {...props}
    />
  )
}

/** Leading icon, to the left of the title and description. Pass the icon as the child; it is sized to `size-5`. */
function ListIcon({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-icon"
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center text-foreground [&_svg]:size-5 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function ListItemStart({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-start"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-start",
        className
      )}
      {...props}
    />
  )
}

function ListItemEnd({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-end"
      className={cn("flex shrink-0 flex-col items-end gap-0.5", className)}
      {...props}
    />
  )
}

function ListItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ListItemDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="list-item-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  List,
  ListItem,
  ListIcon,
  ListItemStart,
  ListItemEnd,
  ListItemTitle,
  ListItemDescription,
}
