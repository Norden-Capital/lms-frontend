import type { Metadata } from "next"
import { Megaphone } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Paid ads overview",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function PaidAdsOverviewPage() {
  await requireUser()

  return <ComingSoon icon={Megaphone} title="Paid ads overview" />
}
