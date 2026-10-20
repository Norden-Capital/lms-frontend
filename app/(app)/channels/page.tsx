import type { Metadata } from "next"
import { Share2 } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Channels",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function ChannelsPage() {
  await requireUser()

  return <ComingSoon icon={Share2} title="Channels" />
}
