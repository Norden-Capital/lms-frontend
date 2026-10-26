import type { Metadata } from "next"
import { UserPlus } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Leads",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function LeadsPage() {
  await requireUser()

  return <ComingSoon icon={UserPlus} title="Leads" description="People who showed interest." />
}
