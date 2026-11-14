"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { AppNavbar } from "@/components/layout/appNavbar"
import { HeldPermissions } from "@/components/access/heldPermissions"
import { AppSidebar } from "@/components/layout/appSidebar"
import { SidebarTrigger } from "@/components/layout/sidebarTrigger"
import { cn } from "@/lib/utils"

/**
 * Shell for the whole signed-in app — every route under `(app)`, not just the
 * dashboard.
 *
 * It owns one thing: whether the sidebar is open. The sidebar and navbar are
 * separate components; this only holds the state they both need and decides
 * which of them the trigger belongs to.
 *
 * Client-side for that state. The layout rendering it stays a Server Component,
 * so `children` are still server-rendered and pass straight through.
 */
/** Where the sidebar's open or closed state is kept, in this browser only. */
const SIDEBAR_KEY = "sidebar"

/** Below Tailwind's `md`: the sidebar lies over the page instead of beside it. */
const PHONE = "(max-width: 767px)"

function subscribePhone(onChange: () => void) {
  const query = window.matchMedia(PHONE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** False on the server, so the first paint matches; CSS does the layout either way. */
function useIsPhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE).matches, () => false)
}

function AppShell({
  children,
  identity,
  avatar,
  isAdmin = false,
  permissions = [],
  canOpenInbox = false,
}: {
  children: React.ReactNode
  /** Rendered on the server by the layout — see the note there. */
  identity?: React.ReactNode
  avatar?: React.ReactNode
  /**
   * Whether to draw the admin-only parts of the menu.
   *
   * <p>Read on the server by the layout, where the session is. Passing it down
   * as a plain boolean keeps this component free of any way to ask who is
   * signed in, which is what lets it stay a Client Component.
   */
  isAdmin?: boolean
  /** What the account holds: decides which owner pages the sidebar draws. */
  permissions?: string[]
  /**
   * Whether to draw the inbox button in the navbar.
   *
   * <p>Hidden rather than disabled for somebody without the permission, the same
   * rule the admin-only menu sections follow: a control that always refuses
   * reads as something you are supposed to have and cannot, rather than
   * something that was never yours.
   *
   * <p>Hiding it is not what stops them — the page refuses the route. This only
   * decides what to draw.
   */
  canOpenInbox?: boolean
}) {
  // Open or closed, remembered in this browser — decided 2026-10-26. This is the
  // computer's choice; a phone has its own, which always starts closed.
  const [open, setOpenState] = useState(true)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const isPhone = useIsPhone()
  const shown = isPhone ? phoneOpen : open

  useEffect(() => {
    // Read after the first paint: the server cannot see this browser's storage.
    const timer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(SIDEBAR_KEY) === "closed") setOpenState(false)
      } catch {
        // Storage blocked: the sidebar simply starts open.
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  function setOpen(next: boolean) {
    setOpenState(next)
    try {
      window.localStorage.setItem(SIDEBAR_KEY, next ? "open" : "closed")
    } catch {
      // Storage blocked: the choice is not remembered.
    }
  }

  return (
    // h-svh, not min-h-svh: the window is now exactly one screen and never
    // grows, so the page as a whole cannot scroll. Navbar, sidebar and footer
    // stay put, and whatever needs to scroll does it inside the content row
    // below. overflow-hidden is what enforces that rather than merely asking.
    <HeldPermissions permissions={permissions}>
    <div className="flex h-svh overflow-hidden">
      <AppSidebar
        open={shown}
        // Each screen size has its own width rule, so the first paint is right
        // before the browser has said which one this is.
        widthClassName={cn(
          open ? "md:w-70 md:border-r md:border-(--line-sidebar)" : "md:w-0",
          phoneOpen ? "max-md:w-70 max-md:border-r max-md:border-(--line-sidebar)" : "max-md:w-0"
        )}
        onToggle={() => (isPhone ? setPhoneOpen(false) : setOpen(false))}
        onNavigate={() => setPhoneOpen(false)}
        identity={identity}
        isAdmin={isAdmin}
        permissions={permissions}
      />

      {/* On a phone, behind the open sidebar: a tap outside it closes it. */}
      {phoneOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setPhoneOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      ) : null}

      {/* No background of its own — the page shows through, which is one less
          colour to keep in sync if the page background ever changes. */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* The way back in, handed to the navbar so it sits in the row rather
            than floating over the breadcrumb. */}
        <AppNavbar
          avatar={avatar}
          canOpenInbox={canOpenInbox}
          leading={
            // Always there on a phone, where the sidebar starts closed; on a
            // computer only while it is closed.
            <span className={cn(open && "md:hidden")}>
              <SidebarTrigger
                open={false}
                onToggle={() => (isPhone ? setPhoneOpen(true) : setOpen(true))}
              />
            </span>
          }
        />

        {/* The scrolling region, and the only one. `min-h-0` is doing real work:
            a flex child defaults to min-height:auto, which lets it grow past its
            parent instead of scrolling inside it — without this the overflow
            rule above simply clips the bottom off long pages.
            A page that wants to own its own scrolling (the user table) sets
            `h-full overflow-hidden` on itself and manages it from there. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>

        {/* Outside the scrolling region, so it is pinned to the bottom of the
            window rather than sitting at the end of the content. `shrink-0`
            keeps it from being squeezed away when the content is tall.

            The year is hardcoded to match the auth footer. Computing it in this
            client component would differ between the server render and the
            browser at a new year's midnight, which is a hydration error nobody
            would ever reproduce. */}
        <footer className="shrink-0 border-t px-6 py-1.5 text-right text-[0.7rem] text-muted-foreground">
          © 2026 Norden Capital
        </footer>
      </main>
    </div>
    </HeldPermissions>
  )
}

export { AppShell }
