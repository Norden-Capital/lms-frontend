import type { Metadata } from "next"
import { LayoutDashboard } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Dashboard",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function DashboardPage() {
  await requireUser()

  return (
    <ComingSoon
      icon={LayoutDashboard}
      title="Overview"
      description="Your key numbers in one place, coming soon."
      showDashboardLink={false}
    />
  )
}
