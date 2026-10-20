"use client"

import { ProviderIcon } from "@/components/inbox/providerIcon"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/**
 * The mailbox, with the Gmail mark — decided 2026-10-20 to keep it a select
 * even with one mailbox, so the header reads the same way it always has and a
 * second mailbox would slot straight in.
 */
function AccountSwitcher({ email }: { email: string }) {
  return (
    <Select value={email}>
      {/* A plain h-8, matching the folder buttons beside it. A set width, so
          the folders keep their room; the address truncates here and shows in
          full in the list that opens. */}
      <SelectTrigger className="h-8 w-52 shrink-0 bg-card" aria-label="Mailbox">
        {/* A function, or the trigger prints the raw value with no logo. */}
        <SelectValue>
          {() => (
            <span className="flex min-w-0 items-center gap-2">
              <ProviderIcon provider="gmail" />
              <span className="truncate">{email}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>

      {/* alignItemWithTrigger off: a plain dropdown, not a scrolling popup. */}
      {/* min-w-max so the address and the tick beside it both fit. */}
      <SelectContent align="start" alignItemWithTrigger={false} className="min-w-max">
        <SelectItem value={email} className="pr-8">
          <span className="flex items-center gap-2 whitespace-nowrap">
            <ProviderIcon provider="gmail" />
            {email}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

export { AccountSwitcher }
