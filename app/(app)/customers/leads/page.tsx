import type { Metadata } from "next"

import { ApplicationsScreen } from "@/components/customers/applicationsScreen"
import type { ApplicationsQuery } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Leads",
}

/** People who finished step 2 and were taken by LeadScout. */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<ApplicationsQuery> }) {
  await requireUser()

  return (
    <ApplicationsScreen
      status="LEAD"
      query={await searchParams}
      title="Leads"
      description="People who finished the form and were sent to LeadScout."
      heading="All leads"
      empty="No leads yet."
    />
  )
}
