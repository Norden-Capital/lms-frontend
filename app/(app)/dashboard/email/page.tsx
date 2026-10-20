import type { Metadata } from "next"
import { Mail } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Email overview",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function EmailOverviewPage() {
  await requireUser()

  return <ComingSoon icon={Mail} title="Email overview" />
}
