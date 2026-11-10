import type { Metadata } from "next"
import { forbidden, notFound } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import { ClientApplications } from "@/components/customers/clientDetail"
import { PageHeader } from "@/components/layout/pageHeader"
import { getClient, listApplicationBrands } from "@/lib/applications"
import { sharedSites } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Client",
}

/** One client: known by their email, with every time they applied. */
export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()

  const { id } = await params
  const [result, brands] = await Promise.all([getClient(id), listApplicationBrands()])

  if (!result.ok && result.error.status === 403) forbidden()
  if (!result.ok && result.error.status === 404) notFound()

  if (!result.ok) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Client" backHref="/customers/leads" backLabel="Back to leads" />
        <div className="flex justify-center">
          <div className="flex max-w-md flex-col items-center gap-2 rounded-md border bg-card p-8 text-center">
            <ShieldAlert className="size-5 text-warning" aria-hidden />
            <p className="text-sm font-medium">Could not load this client</p>
            <p className="text-xs text-muted-foreground">{result.error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  const client = result.data
  const count = client.applications.length

  return (
    // Fills the screen on a wide one, so each card scrolls on its own.
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3 lg:overflow-hidden">
      <PageHeader
        title="Lead details"
        description={`${count} ${count === 1 ? "application" : "applications"}`}
        backHref="/customers/leads"
        backLabel="Back to leads"
      />
      <ClientApplications client={client} sharedSites={[...sharedSites(brands.ok ? brands.data : [])]} />
    </div>
  )
}
