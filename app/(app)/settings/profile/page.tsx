import type { Metadata } from "next"
import { UserRound } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Profile",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function ProfilePage() {
  await requireUser()

  return (
    <ComingSoon
      icon={UserRound}
      title="Profile"
      description="Changing your name, contact details and password is on its way."
    />
  )
}
