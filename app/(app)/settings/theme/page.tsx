import type { Metadata } from "next"

import { ThemeForm } from "@/components/settings/themeForm"
import { requireUser } from "@/lib/auth"
import { toAppearance } from "@/lib/appearance"

export const metadata: Metadata = {
  title: "Theme",
}

/** Settings → Theme (added 2026-11-10): your own look, saved on your account. */
export default async function ThemePage() {
  const user = await requireUser()

  return <ThemeForm saved={toAppearance(user.appearance)} />
}
