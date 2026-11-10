import { redirect } from "next/navigation"

/** Settings has pages of its own; the first one is My account. */
export default function SettingsPage() {
  redirect("/settings/my-account")
}
