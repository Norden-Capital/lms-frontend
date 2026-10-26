import { redirect } from "next/navigation"

/**
 * The dashboard is Leads Overview — decided 2026-10-26. Signing in, and every
 * "back to dashboard" button, comes here and lands there.
 */
export default function DashboardPage() {
  redirect("/dashboard/leads")
}
