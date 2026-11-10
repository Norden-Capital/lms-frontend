"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { ChevronDown, LogOut } from "lucide-react"

import { logout } from "@/app/(app)/actions"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import {
  isNavItemActive,
  navSections,
  settingsSection,
  type NavItem,
} from "@/components/layout/navItems"
import { SidebarTrigger } from "@/components/layout/sidebarTrigger"

/**
 * The sidebar for the whole signed-in app, not just the dashboard.
 *
 * Width comes off the reference: a 2157px-wide capture at 1.5x DPI, so a
 * ~1440px window, with the sidebar 420px of it — 280px in CSS pixels, hence
 * w-70. That is 19.4% of the width, matching the ratio measured off the image.
 *
 * It stays mounted and animates its width rather than unmounting: an element
 * removed from the DOM cannot transition, which is why toggling it used to
 * snap. `inert` keeps the clipped-but-present controls out of the tab order and
 * the accessibility tree while it is closed.
 */
/** Shared by plain links and collapsible triggers so the two stay identical. */
const ROW =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
// The icon stays an outline when active — decided 2026-10-19. The white pill,
// the weight and the colour already mark the current page; a filled icon on
// top of that was one signal too many.
// The icon takes the palette's sidebar colour on the other palettes (--row-active-icon).
const ROW_ACTIVE = "bg-(--row-active) font-medium text-foreground shadow-sm [&_svg]:text-(--row-active-icon)"
const ROW_IDLE = "text-muted-foreground hover:text-foreground"

function AppSidebar({
  open,
  widthClassName,
  onToggle,
  onNavigate,
  identity,
  isAdmin = false,
  isOwner = false,
}: {
  /** Open on this screen: decides whether its contents can be reached. */
  open: boolean
  /** Its width, set by the shell per screen size. */
  widthClassName: string
  onToggle: () => void
  /** A menu link was clicked: on a phone, the shell closes the sidebar. */
  onNavigate?: () => void
  /** The identity card, rendered on the server and handed down by the layout. */
  identity?: React.ReactNode
  /** Decides whether the admin-only sections are drawn at all. */
  isAdmin?: boolean
  /** Decides whether the Owner's Platform section is drawn. */
  isOwner?: boolean
}) {
  const pathname = usePathname()

  // Which menus (Overview, Configuration…) are open — changed 2026-11-04:
  // only the one holding the page on screen opens. You can still open or
  // close one by hand; that lasts until you go to another page.
  const [manual, setManual] = useState<{ path: string; groups: Record<string, boolean> }>({
    path: pathname,
    groups: {},
  })
  const groups = manual.path === pathname ? manual.groups : {}

  function toggleGroup(href: string, next: boolean) {
    setManual((current) => ({
      path: pathname,
      groups: { ...(current.path === pathname ? current.groups : {}), [href]: next },
    }))
  }

  // Filtered rather than dimmed or disabled. A greyed-out menu item invites
  // somebody to work out how to earn it, and here there is nothing to earn:
  // Management comes with being an administrator or not at all.
  const sections = navSections.filter(
    (section) => (isAdmin || !section.adminOnly) && (isOwner || !section.ownerOnly)
  )

  // One menu entry: a plain link, or a group that opens to show its pages.
  // Used by the scrolling menu and by the pinned Settings block alike, so
  // System Settings opens just like Configuration — decided 2026-10-26.
  function renderItem(item: NavItem) {
    const active = isNavItemActive(item.href, pathname)
    const itemClass = cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)

    if (!item.items) {
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={itemClass}
        >
          <item.icon className="size-4 shrink-0" />
          {item.title}
        </Link>
      )
    }

    return (
      // Open when a child page is the one on screen, unless you
      // opened or closed it by hand on this page.
      <Collapsible
        key={item.href}
        open={groups[item.href] ?? active}
        onOpenChange={(next) => toggleGroup(item.href, next)}
      >
        <CollapsibleTrigger className={cn(itemClass, "group")}>
          <item.icon className="size-4 shrink-0" />
          {item.title}
          {/* aria-expanded, not data-open: Base UI's trigger
              exposes its state through aria-expanded only.
              Tailwind compiles `data-open` to [data-state=open],
              a Radix convention that never matches here — the
              chevron would silently never turn. */}
          <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform group-aria-expanded:rotate-180" />
        </CollapsibleTrigger>

        {/* Base UI hands the panel its measured height as
            --collapsible-panel-height and flags the in/out frames
            with data-starting-style / data-ending-style, so
            animating height between 0 and that variable is all the
            smoothing needs. overflow-hidden stops the rows
            spilling out mid-transition. */}
        <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
          {/* The tree. The spine is drawn per-row rather than as a
              border-l on the list: the last row only draws its top
              half, so the line stops at the final tick instead of
              running past it. */}
          <ul className="ml-4 flex flex-col py-1">
            {item.items.map((sub) => {
              const subActive = isNavItemActive(sub.href, pathname)

              return (
                <li
                  key={sub.href}
                  className="relative before:absolute before:top-0 before:left-0 before:h-full before:w-px before:bg-(--line-tree) last:before:h-1/2"
                >
                  <Link
                    href={sub.href}
                    aria-current={subActive ? "page" : undefined}
                    className={cn(
                      "relative flex items-center py-1.5 pl-5 text-sm transition-colors",
                      // the tick joining this row to the spine
                      "before:absolute before:top-1/2 before:left-0 before:h-px before:w-3 before:bg-(--line-tree)",
                      subActive
                        ? "font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sub.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <aside
      inert={!open}
      onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest("a")) onNavigate?.()
      }}
      className={cn(
        // sticky + h-svh + self-start pins it to the viewport instead of
        // scrolling with the page. self-start matters: without it the flex
        // parent stretches the aside to the full content height and there is
        // nothing left for sticky to do.
        // bg-sidebar, not the literal it used to be. The filter panel now wants
        // the same surface, and two copies of a hex is one of them going stale.
        "sticky top-0 h-svh shrink-0 self-start overflow-hidden bg-sidebar transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
        // On a phone it lies over the page instead of pushing it aside.
        "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl",
        widthClassName
      )}
    >
      {/* Fixed width so the contents are clipped rather than reflowed as the
          aside narrows — laying them out again every frame is what makes this
          kind of animation look broken. */}
      <div className="flex h-full w-70 flex-col">
        {/* items-start, not items-center: the card and the trigger are
            different heights, so centring them left their top edges on
            different lines. pt-3.5 is not arbitrary either — the navbar centres
            the same 28px trigger in its 56px row, putting it 14px down, so
            matching that keeps the trigger from jumping when the sidebar
            opens or closes. */}
        <div className="flex items-start gap-2 px-6 pt-3.5">
          {identity}
          <SidebarTrigger open onToggle={onToggle} />
        </div>

        {/* Scrolls on its own once the nav outgrows the viewport, so the
            identity card above it stays put. */}
        <nav
          // The scrollbar itself is the global one in globals.css.
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4"
        >
          {sections.map((section, index) => (
            <div
              key={section.title}
              className={cn(
                "flex flex-col",
                // The divider stays inside the nav's padding rather than being
                // pulled out with a negative margin, so it stops well short of
                // the sidebar edges. At px-6 that is 24px in each side, and the
                // footer dividers match via mx-6.
                index > 0 && "border-t border-(--line-sidebar) pt-3"
              )}
            >
              <p className="px-2.5 pb-1 text-xs font-medium text-foreground">
                {section.title}
              </p>

              {/* pl-2 sets the items in from the section title rather than
                  flush with it. On the wrapper, not the rows, so collapsible
                  sub-trees shift with their parent. */}
              <div className="flex flex-col gap-0 pl-2">
                {section.items.map(renderItem)}
              </div>
            </div>
          ))}
        </nav>

        {/* Outside the nav, so it stays pinned to the bottom however long the
            menu above grows. The border sits on this element rather than an
            inner one so it reaches both edges without the -mx-3 trick. */}
        <div className="mx-6 border-t border-(--line-sidebar) py-4">
          <p className="px-2.5 pb-1 text-xs font-medium text-foreground">
            {settingsSection.title}
          </p>

          <div className="flex flex-col gap-0 pl-2">
            {settingsSection.items.map(renderItem)}
          </div>
        </div>

        {/* Log out sits in its own block, divided off from Settings — it ends
            the session rather than navigating, so it does not belong in a list
            of links. */}
        <div className="mx-6 border-t border-(--line-sidebar) py-3">
          <div className="pl-2">
            <AlertDialog>
              {/* Not ROW_IDLE: this one goes destructive on hover rather than
                  to foreground, since it ends the session. */}
              <AlertDialogTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      ROW,
                      "text-muted-foreground hover:text-destructive"
                    )}
                  />
                }
              >
                <LogOut className="size-4 shrink-0" />
                Log out
              </AlertDialogTrigger>

              {/* size="sm" does two jobs: it pins the popup to max-w-xs at
                  every breakpoint instead of widening to max-w-sm, and it keeps
                  the header centred and stacked — the default size switches to
                  icon-beside-text from sm up. */}
              <AlertDialogContent size="sm">
                {/* flex overrides the header's own grid, which would otherwise
                    put the media on its own row. Icon and title share a
                    centred row, description sits under both. */}
                <AlertDialogHeader className="flex flex-col items-center gap-1.5 text-center">
                  <div className="flex items-center gap-2">
                    <AlertDialogMedia className="relative mb-0 size-8 overflow-hidden bg-destructive/10 text-destructive">
                      <LiquidGlassLayers />
                      {/* Sized explicitly, which also opts out of the media
                          slot's own size-6 default for bare svgs. relative so
                          it paints above the glass layers. */}
                      <LogOut className="relative size-4" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                  </div>
                  <AlertDialogDescription>
                    You&apos;ll be signed out on this device and sent back to
                    the sign-in screen.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  {/* A form, not an onClick: the session cookie is httpOnly,
                      so only the server can clear it. `contents` makes the
                      button the footer grid's direct child — a wrapping form
                      would take the cell and leave the button its natural
                      width, so the two would not match. */}
                  <form action={logout} className="contents">
                    <AlertDialogAction type="submit" variant="destructive">
                      Log out
                    </AlertDialogAction>
                  </form>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </aside>
  )
}

export { AppSidebar }
