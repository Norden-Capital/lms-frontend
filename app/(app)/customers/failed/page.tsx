import type { Metadata } from "next"

import { ApplicationsScreen } from "@/components/customers/applicationsScreen"
import type { ApplicationsQuery } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Failed",
}

/** People who finished step 2, but LeadScout refused them or could not be reached. */
export default async function FailedPage({ searchParams }: { searchParams: Promise<ApplicationsQuery> }) {
  await requireUser()

  return (
    <ApplicationsScreen
      status="FAILED"
      query={await searchParams}
      title="Failed"
      description="People who finished the form, but LeadScout did not take them."
      heading="All failed"
      empty="Nothing has failed."
    />
  )
}
