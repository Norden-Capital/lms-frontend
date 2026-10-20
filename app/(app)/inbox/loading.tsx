import { cookies } from "next/headers"

import { ListSkeleton, MailSkeleton } from "@/components/inbox/inboxLoading"
import { InboxShell } from "@/components/inbox/inboxShell"
import { Skeleton } from "@/components/ui/skeleton"
import { PANES_COOKIE, parsePaneLayout } from "@/lib/inboxLayout"

/**
 * The inbox while it first loads — decided 2026-10-20. The same panes at the
 * same sizes (read from the same cookie), so when the mail arrives nothing
 * moves; only the grey shapes are replaced.
 */
export default async function InboxLoading() {
  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden" role="status" aria-label="Loading the inbox">
      <InboxShell
        defaultLayout={layout}
        list={
          <div className="flex h-full min-h-0 flex-col" aria-hidden>
            <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <Skeleton className="h-8 w-52" />
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="size-7" />
                ))}
              </div>
              <Skeleton className="h-8 w-36" />
            </div>
            <div className="flex shrink-0 items-center gap-2 p-4 pb-2">
              <Skeleton className="size-9" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="size-9" />
            </div>
            <div className="min-h-0 flex-1 overflow-hidden px-4">
              <ListSkeleton />
            </div>
          </div>
        }
        reading={<MailSkeleton />}
      />
    </div>
  )
}
