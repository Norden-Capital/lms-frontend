import type { Metadata } from "next"
import { LifeBuoy } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"

export const metadata: Metadata = {
  title: "Help Center",
}

/** Not built yet — a "coming soon" page until it is. */
export default function HelpCenterPage() {
  return (
    <ComingSoon
      icon={LifeBuoy}
      title="Help Center"
      description="Guides and answers are on their way."
    />
  )
}
