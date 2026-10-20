"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

import { ComposeForm } from "@/components/inbox/composeForm"
import { useInboxLoading } from "@/components/inbox/inboxLoading"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { MailSender } from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * Writing a new email in the right-hand pane, where an open email would be —
 * decided 2026-10-20, instead of a window over the inbox. `?compose=new` opens
 * it, so the list stays usable beside it.
 */
function ComposePane({ senders, ownEmail }: { senders: MailSender[]; ownEmail: string }) {
  const { navigate } = useInboxLoading()
  const pathname = usePathname()
  const params = useSearchParams()

  function close() {
    const next = new URLSearchParams(params.toString())
    next.delete("compose")
    navigate(`${pathname}?${next.toString()}`, "mail")
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <p className="text-sm font-semibold">New email</p>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="hover:bg-foreground/10"
                aria-label="Close"
                onClick={close}
              />
            }
          >
            <X className="size-4" />
          </TooltipTrigger>
          <TooltipContent>Close without sending</TooltipContent>
        </Tooltip>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto p-4", THIN_SCROLLBAR)}>
        <ComposeForm senders={senders} ownEmail={ownEmail} mode="new" original={null} onDone={close} />
      </div>
    </div>
  )
}

export { ComposePane }
