import type { Metadata } from "next"
import { UserCheck } from "lucide-react"

import { ComingSoon } from "@/components/layout/comingSoon"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Customers",
}

/** Not built yet — a "coming soon" page until it is. */
export default async function CustomerListPage() {
  await requireUser()

  return <ComingSoon icon={UserCheck} title="Customers" description="People who became customers." />
}
