import { redirect } from "next/navigation"

/** Settings has pages of its own; the first one is My dashboard. */
export default function SettingsPage() {
  redirect("/settings/dashboard")
}
