import type { Metadata } from "next"
import { UserX } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Abandoned",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function AbandonedPage() {
  await requireUser()

  return <ComingSoon icon={UserX} title="Abandoned" description="People who started and did not finish." />
}
