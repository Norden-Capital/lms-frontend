import { redirect } from "next/navigation"

/** My dashboard was renamed My account on 2026-11-09. Old links land there. */
export default function OldDashboardPage() {
  redirect("/settings/my-account")
}
