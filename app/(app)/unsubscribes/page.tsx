import type { Metadata } from "next"
import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { PageHeader } from "@/components/layout/pageHeader"
import { UnsubscribesTable } from "@/components/unsubscribes/unsubscribesTable"
import { requirePermission } from "@/lib/auth"
import { listUnsubscribeBrands, listUnsubscribes } from "@/lib/unsubscribes"
import type { UnsubscribesQuery } from "@/lib/unsubscribeTypes"

export const metadata: Metadata = {
  title: "Unsubscribes",
}

/** People who asked a brand site to stop emailing them. */
export default async function UnsubscribesPage({ searchParams }: { searchParams: Promise<UnsubscribesQuery> }) {
  await requirePermission("UNSUBSCRIBE:READ")
  const query = await searchParams

  const [result, brands] = await Promise.all([listUnsubscribes(query), listUnsubscribeBrands()])

  if (!result.ok && result.error.status === 403) {
    forbidden()
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3">
      <PageHeader title="Unsubscribes" description="People who asked to stop getting emails from a brand." />

      {result.ok ? (
        <UnsubscribesTable
          key={JSON.stringify(query)}
          page={result.data}
          query={query}
          brands={brands.ok ? brands.data : []}
        />
      ) : (
        <div className="flex flex-1 items-start justify-center">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            <p className="text-sm font-medium">Could not load this list</p>
            <p className="text-xs text-muted-foreground">{result.error.message}</p>
          </div>
        </div>
      )}
    </div>
  )
}
