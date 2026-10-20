import type { Metadata } from "next"
import { FileText } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"

export const metadata: Metadata = {
  title: "Terms of Use",
}

/** Not built yet — a "coming soon" page until it is. */
export default function TermsOfUsePage() {
  return <ComingSoon icon={FileText} title="Terms of Use" />
}
