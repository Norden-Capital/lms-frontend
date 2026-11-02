import type { Metadata } from "next"

import { ApplicationsScreen } from "@/components/customers/applicationsScreen"
import type { ApplicationsQuery } from "@/lib/applicationTypes"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Abandoned",
}

/** People who finished step 1 but not step 2. Someone who later became a lead leaves this list. */
export default async function AbandonedPage({ searchParams }: { searchParams: Promise<ApplicationsQuery> }) {
  await requireUser()

  return (
    <ApplicationsScreen
      status="ABANDONED"
      query={await searchParams}
      title="Abandoned"
      description="People who finished step 1 but not step 2."
      heading="All abandoned"
      empty="Nobody has abandoned the form."
      showResult={false}
    />
  )
}
