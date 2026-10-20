import type { Metadata } from "next"
import { Lock } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

/** Not built yet — a "coming soon" page until it is. */
export default function PrivacyPolicyPage() {
  return <ComingSoon icon={Lock} title="Privacy Policy" />
}
