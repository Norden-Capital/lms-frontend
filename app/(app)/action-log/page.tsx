import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { ActionLogTable } from "@/components/actionLog/actionLogTable"
import { PageHeader } from "@/components/layout/pageHeader"
import { listActionLog } from "@/lib/actionLog"
import type { ActionLogQuery } from "@/lib/actionLogTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Action Log",
}

/**
 * Who did what to whom, and when — decided 2026-10-19. The Owner only: the
 * middleware sends anybody else to the no-access screen, and the backend
 * refuses them too.
 */
export default async function ActionLogPage({
  searchParams,
}: {
  searchParams: Promise<ActionLogQuery>
}) {
  await requireUser()

  const query = await searchParams
  const result = await listActionLog(query)

  if (!result.ok && result.error.status === 403) {
    forbidden()
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3">
      <PageHeader
        title="Action Log"
        description="Who did what, to whom, and when. Only you can see this."
      />

      {result.ok ? (
        <ActionLogTable key={JSON.stringify(query)} page={result.data} query={query} />
      ) : (
        <div className="flex flex-1 items-start justify-center">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            <p className="text-sm font-medium">The action log couldn&apos;t be loaded</p>
            <p className="text-xs text-muted-foreground">{result.error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
