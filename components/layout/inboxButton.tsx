"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Inbox } from "lucide-react"

import { usePulse } from "@/components/inbox/usePulse"
import { NewMark } from "@/components/layout/newMark"
import { Button } from "@/components/ui/button"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * The header's inbox button, with a dot only when there is unread mail —
 * decided 2026-10-20 (it used to be a fixed dot). Checks every minute, and
 * again on every page change, so reading mail clears it soon after.
 */
function InboxButton() {
  const pathname = usePathname()
  const { pulse, check } = usePulse(60_000)
  const unread = pulse?.unread ?? 0

  useEffect(() => {
    check()
  }, [pathname, check])

  const label = unread > 0 ? `Inbox, ${unread} unread` : "Inbox"

  return (
    // The dot hangs off this wrapper: the button clips its children to draw
    // the glass, which would cut a dot on its corner in half.
    <div className="relative">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="relative overflow-hidden bg-card"
              aria-label={label}
              render={<Link href="/inbox" />}
            />
          }
        >
          <LiquidGlassLayers />
          <Inbox className="relative" />
        </TooltipTrigger>
        <TooltipContent>{unread > 0 ? `${unread} unread` : "Inbox"}</TooltipContent>
      </Tooltip>

      {unread > 0 && <NewMark className="-top-0.5 -right-0.5" />}
    </div>
  )
}

export { InboxButton }
