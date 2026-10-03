"use client"

import * as React from "react"
import { Slot } from "radix-ui"
import type { IconComponent } from "reicon-react/createIcon"
import { cn } from "@/lib/utils"

const SidebarItemContext = React.createContext(false)

/**
 * Sidebar — app navigation column (modelled on app.family.co). On desktop it is a 260px column with the header on top, the
 * navigation in the middle and small links at the bottom; below `md` it turns into a bottom tab bar (icons only, header and
 * sub-links hidden).
 *
 * Use it for: the primary navigation of an app section (account, settings, dashboard).
 * Don't use it for: in-page tabs (use `Tabs`), a slide-over panel (use `Sheet`), or per-page filters.
 *
 * It is purely presentational and router-agnostic: it renders no links of its own and knows nothing about the product.
 * Pass the current route state with `isActive` and render your router's link with `asChild`:
 *
 * ```tsx
 * <Sidebar>
 *   <SidebarHeader>
 *     <SidebarBrand asChild><Link href="/">Acme</Link></SidebarBrand>
 *     <Avatar />
 *   </SidebarHeader>
 *   <SidebarNav>
 *     <SidebarMenu>
 *       <SidebarItem isActive={pathname === "/"}>
 *         <SidebarLink asChild><Link href="/"><SidebarIcon icon={Wallet} /><SidebarLabel>Wallets</SidebarLabel></Link></SidebarLink>
 *       </SidebarItem>
 *     </SidebarMenu>
 *     <SidebarSubmenu>
 *       <SidebarSubitem><SidebarSubLink href="/privacy">Privacy</SidebarSubLink></SidebarSubitem>
 *     </SidebarSubmenu>
 *   </SidebarNav>
 * </Sidebar>
 * ```
 *
 * Layout is the consumer's job: it is a normal flex column that fills its parent. Pin it with `className`
 * (e.g. `fixed inset-y-0 left-0`) or place it in a grid/flex row. Colours come from tokens, so it follows light/dark.
 */
function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "flex w-full max-w-65 flex-col gap-2 bg-background px-3 pt-4 pb-3.25 text-foreground shadow-[inset_-1px_0_0_0_var(--border)]",
        "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:max-w-none  max-md:px-4 max-md:py-0 max-md:pb-[env(safe-area-inset-bottom)] max-md:shadow-none",
        className
      )}
      {...props}
    />
  )
}

/** Top row: brand on the start side, an account button (or anything) on the end side. Hidden on mobile. */
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex items-center justify-between gap-8 pr-3 max-md:hidden", className)}
      {...props}
    />
  )
}

/** The logo/name link in the header. `asChild` to render your router's `Link`. */
function SidebarBrand({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="sidebar-brand"
      className={cn(
        "flex w-fit items-center gap-2 rounded-2xl px-3 py-2.5 font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    />
  )
}

/** Wraps the menu and the sub-links; pushes them to the top and bottom of the column. */
function SidebarNav({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      data-slot="sidebar-nav"
      className={cn("flex h-full flex-col justify-between gap-6 max-md:justify-center", className)}
      {...props}
    />
  )
}

/** The main list of destinations. A column on desktop, a row spread across the bar on mobile. */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex list-none flex-col max-md:flex-row max-md:justify-between", className)}
      {...props}
    />
  )
}

/** One entry of `SidebarMenu`. `isActive` marks the current page (highlight + `aria-current` on its link). */
function SidebarItem({
  className,
  isActive = false,
  ...props
}: React.ComponentProps<"li"> & { isActive?: boolean }) {
  return (
    <SidebarItemContext.Provider value={isActive}>
      <li
        data-slot="sidebar-item"
        data-active={isActive}
        className={cn("group/sidebar-item max-md:flex", className)}
        {...props}
      />
    </SidebarItemContext.Provider>
  )
}

/**
 * The clickable row inside a `SidebarItem`: an icon (`SidebarIcon`, filled when active; 24px) plus a `SidebarLabel`. Renders an `<a>`;
 * pass `asChild` to use your router's `Link` (or a `<button>` for actions). `aria-current="page"` is set from the item's `isActive`.
 * `aria-disabled` dims it and blocks clicks.
 */
function SidebarLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  const isActive = React.useContext(SidebarItemContext)
  return (
    <Comp
      data-slot="sidebar-link"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl p-3 text-base/5 font-medium tracking-[-0.00813rem] text-muted-foreground outline-none transition-colors duration-100",
        // Hover / active surface: a pseudo-element so the icon and label can sit above it.
        "before:absolute before:inset-x-0 before:top-0 before:bottom-px before:rounded-2xl before:bg-muted before:opacity-0 before:transition before:duration-100 hover:before:opacity-100 active:before:scale-[0.99] group-data-[active=true]/sidebar-item:before:opacity-100",
        "hover:text-foreground group-data-[active=true]/sidebar-item:text-foreground",
        "focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-disabled:pointer-events-none aria-disabled:opacity-20",
        "[&>svg]:relative [&>svg]:size-6 [&>svg]:shrink-0 [&>svg]:transition-colors [&>svg]:duration-100 hover:[&>svg]:text-foreground group-data-[active=true]/sidebar-item:[&>svg]:text-foreground",
        "max-md:px-4 max-md:before:hidden max-md:[&>svg]:size-8",
        className
      )}
      {...props}
    />
  )
}

/**
 * Icon of a `SidebarLink`: pass a reicon component and it renders `Filled` while the item is active, `Outline` otherwise
 * (desktop column and mobile tab bar alike). Use it instead of placing the icon directly.
 */
function SidebarIcon({ icon: Icon, ...props }: { icon: IconComponent } & Omit<React.ComponentProps<IconComponent>, "weight">) {
  const isActive = React.useContext(SidebarItemContext)
  return <Icon weight={isActive ? "Filled" : "Outline"} {...props} />
}

/** Text of a `SidebarLink`. Hidden on mobile, where the bar shows icons only. */
function SidebarLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="sidebar-label"
      className={cn("relative top-[0.5px] max-md:hidden", className)}
      {...props}
    />
  )
}

/** Row of small secondary links (docs, privacy, terms) at the bottom, separated by dots. Hidden on mobile. */
function SidebarSubmenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-submenu"
      className={cn("flex list-none items-center pl-1 max-md:hidden", className)}
      {...props}
    />
  )
}

function SidebarSubitem({ className, isActive = false, ...props }: React.ComponentProps<"li"> & { isActive?: boolean }) {
  return (
    <li
      data-slot="sidebar-subitem"
      data-active={isActive}
      className={cn(
        "group/sidebar-subitem flex items-center after:block after:size-0.75 after:rounded-full after:bg-foreground after:opacity-10 last:after:hidden",
        className
      )}
      {...props}
    />
  )
}

/** Small link inside a `SidebarSubitem`. `asChild` to render your router's `Link`. */
function SidebarSubLink({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="sidebar-sublink"
      className={cn(
        "flex items-center rounded-full p-2 text-[0.8125rem] tracking-[-0.0025rem] text-muted-foreground outline-none transition-colors duration-100 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 group-data-[active=true]/sidebar-subitem:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarBrand,
  SidebarHeader,
  SidebarIcon,
  SidebarItem,
  SidebarLabel,
  SidebarLink,
  SidebarMenu,
  SidebarNav,
  SidebarSubitem,
  SidebarSubLink,
  SidebarSubmenu,
}
