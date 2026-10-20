"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { InboxButton } from "@/components/layout/inboxButton"
import { Button } from "@/components/ui/button"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"

/** "forgot-password" -> "forgot password". Capitalising is left to CSS. */
function labelFor(segment: string) {
  return segment.replace(/-/g, " ")
}

/**
 * Sits at the top of the content area, not across the sidebar — matching the
 * reference, where the sidebar runs full height beside it.
 *
 * `leading` is where the shell puts the sidebar trigger once the sidebar is
 * closed. It lives here rather than floating over the content so it cannot
 * overlap the breadcrumb.
 */
function AppNavbar({
  leading,
  avatar,
  canOpenInbox = false,
}: {
  leading?: React.ReactNode
  /** The signed-in user's initials, rendered on the server by the layout. */
  avatar?: React.ReactNode
  /** Whether this account holds `INBOX:READ` — see AppShell. */
  canOpenInbox?: boolean
}) {
  // Derived, not hardcoded: this navbar is part of the shell, so it renders on
  // /profile as well as /dashboard, and a fixed "Dashboard" crumb would lie.
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)


  return (
    // bg-background is load-bearing now it is sticky: without a background the
    // content would scroll visibly through it.
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-[#ECECEC] bg-background px-4">
      {leading}

      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1
            const href = `/${segments.slice(0, index + 1).join("/")}`

            return (
              <Fragment key={href}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="capitalize">
                      {labelFor(segment)}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      className="capitalize"
                      render={<Link href={href} />}
                    >
                      {labelFor(segment)}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        {/* Both buttons are deliberately identical — they are peers, and any
            divergence would read as one of them meaning something different.
            Note that only one of them goes anywhere yet: notifications have no
            screen to open. */}
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden bg-card"
          aria-label="Notifications"
        >
          <LiquidGlassLayers />
          {/* relative so the icon paints above the glass layers */}
          <Bell className="relative" />
        </Button>

        {/* Drawn only for an account that holds INBOX:READ. Hidden rather than
            disabled, the same rule the admin-only menu sections follow: a button
            that always refuses reads as something you are supposed to have and
            cannot. The page refuses the route regardless — this only decides
            what to draw. */}
        {/* Drawn only for an account that holds INBOX:READ. Hidden rather than
            disabled: a button that always refuses reads as something you are
            supposed to have and cannot. The dot is real — see InboxButton. */}
        {canOpenInbox && <InboxButton />}

        {avatar}
      </div>
    </header>
  )
}

export { AppNavbar }
