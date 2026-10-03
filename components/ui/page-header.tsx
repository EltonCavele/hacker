"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronLeft, MoreH } from "reicon-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { cn } from "@/lib/utils"

type PageHeaderAction = {
  /** Visible text on desktop; accessible name when only the icon is shown. */
  label: string
  icon?: React.ReactNode
  /** Navigate (renders a link). Use `onClick` instead for an action; it needs the page to be a client component. */
  href?: string
  onClick?: () => void
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive"
  disabled?: boolean
}

type PageHeaderBack = {
  /** Where to go. Omit to go back in history. */
  href?: string
  label?: string
}

/**
 * PageHeader — title bar pinned to the top of a page, with an optional back button and action buttons.
 *
 * Layout: back button at the start edge, title centred, actions at the end edge. The bar spans the full width of the page
 * area, ignoring the `max-w` of the page content; it keeps its own height in the flow (3.5rem; 4.75rem from `md` up, so the row centre sits on the `SidebarHeader` row: 1rem padding + 2.75rem brand) so content starts below it and the title/actions line up horizontally with the sidebar's brand and account button.
 * Content scrolling underneath dissolves into a blur that fades from the background colour (top) to transparent (scroll edge).
 *
 * `start` puts any node (e.g. an avatar link) at the start edge instead of the back button; `back` wins if both are set.
 * `back` adds a back button (a link when it has `href`, otherwise history back). `actions` are the buttons on the end side:
 * all of them from `md` up; below `md` a single action stays a button (icon only if it has an icon), several collapse into one
 * "more" button (…) that opens a menu with all of them. Actions with `onClick` need a client component page.
 *
 * Use it for: the title of a full page in the authenticated area. Render it first, as a direct child of the page area, and put
 * the content in a sibling below it.
 * Don't use it for: titles inside a card, dialog or sheet (use their own headers).
 */
function BackButton({ back }: { back: PageHeaderBack }) {
  const router = useRouter()
  const t = useTranslations("common")
  const label = back.label ?? t("back")
  return back.href ? (
    <Button asChild aria-label={label} size="icon" variant="ghost" className="rounded-full bg-secondary">
      <Link href={back.href}><ChevronLeft /></Link>
    </Button>
  ) : (
    <Button aria-label={label} onClick={() => router.back()} size="icon" type="button" variant="ghost" className="rounded-full bg-secondary">
      <ChevronLeft />
    </Button>
  )
}

function ActionButton({ action, iconOnly = false, size }: { action: PageHeaderAction; iconOnly?: boolean; size?: "sm" | "icon" }) {
  const showLabel = !iconOnly || !action.icon
  const content = (
    <>
      {action.icon}
      {showLabel ? action.label : null}
    </>
  )
  const common = {
    "aria-label": showLabel ? undefined : action.label,
    disabled: action.disabled,
    size: iconOnly && action.icon ? ("icon" as const) : size,
    variant: action.variant ?? "secondary",
  }
  return action.href ? (
    <Button asChild {...common} className="rounded-full sm:rounded-2xl">
      <Link href={action.href}>{content}</Link>
    </Button>
  ) : (
    <Button onClick={action.onClick} type="button" className="rounded-full sm:rounded-2xl" {...common}>
      {content}
    </Button>
  )
}

/** Below `md`: one action stays a button, several collapse into a "more" menu. */
function MobileActions({ actions }: { actions: PageHeaderAction[] }) {
  if (actions.length === 0) return null
  if (actions.length === 1) return <ActionButton action={actions[0]} iconOnly size="sm" />
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Mais ações" size="icon" type="button" variant="ghost">
          <MoreH />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
        {actions.map((action) =>
          action.href ? (
            <DropdownMenuItem asChild disabled={action.disabled} key={action.label} size="lg" variant={action.variant === "destructive" ? "destructive" : "default"}>
              <Link href={action.href}>{action.icon}{action.label}</Link>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={action.disabled} key={action.label} onSelect={action.onClick} size="lg" variant={action.variant === "destructive" ? "destructive" : "default"}>
              {action.icon}{action.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PageHeader({
  title,
  back,
  start,
  actions = [],
  className,
}: {
  title: React.ReactNode
  back?: PageHeaderBack
  start?: React.ReactNode
  actions?: PageHeaderAction[]
  className?: string
}) {
  return (
    <div data-slot="page-header-bar" className="pointer-events-none sticky top-0 z-30 h-14 md:h-19">
      <div className="absolute inset-x-0 top-0">
        <ProgressiveBlur side="top" size={76} tint={false} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-linear-to-b from-background to-transparent" />
        <div className={cn("pointer-events-auto relative z-20 grid h-14 md:h-19 w-full grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-6", className)}>
          <div className="flex items-center justify-self-start">{back ? <BackButton back={back} /> : start}</div>
          <h1 className="truncate text-center text-lg/none font-semibold">{title}</h1>
          <div className="flex items-center gap-2 justify-self-end">
            <div className="md:hidden"><MobileActions actions={actions} /></div>
            <div className="flex items-center gap-2 max-md:hidden">
              {actions.map((action) => <ActionButton action={action} key={action.label} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { PageHeader }
export type { PageHeaderAction, PageHeaderBack }
