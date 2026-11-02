import { forbidden } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { ApplicationsTable } from "@/components/customers/applicationsTable"
import { PageHeader } from "@/components/layout/pageHeader"
import { listApplicationBrands, listApplications } from "@/lib/applications"
import type { ApplicationsQuery } from "@/lib/applicationTypes"

/** The Leads, Abandoned and Failed pages: the same screen on a different list. */
async function ApplicationsScreen({
  status,
  query,
  title,
  description,
  heading,
  empty,
  showResult = true,
}: {
  status: "LEAD" | "ABANDONED" | "FAILED"
  query: ApplicationsQuery
  title: string
  description: string
  heading: string
  empty: string
  showResult?: boolean
}) {
  const [result, brands] = await Promise.all([listApplications(status, query), listApplicationBrands()])

  if (!result.ok && result.error.status === 403) {
    forbidden()
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3">
      <PageHeader title={title} description={description} />

      {result.ok ? (
        <ApplicationsTable
          key={JSON.stringify(query)}
          page={result.data}
          query={query}
          brands={brands.ok ? brands.data : []}
          heading={heading}
          empty={empty}
          showResult={showResult}
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

export { ApplicationsScreen }
