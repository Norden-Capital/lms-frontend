import { redirect } from "next/navigation"

/** Profile was merged into My dashboard on 2026-10-26. Old links land there. */
export default function ProfileRedirect() {
  redirect("/settings/dashboard")
}
