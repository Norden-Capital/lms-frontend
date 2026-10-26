import type { Metadata } from "next"
import { UserPlus } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Leads overview",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function LeadsOverviewPage() {
  await requireUser()

  return <ComingSoon icon={UserPlus} title="Leads overview" />
}
