import { redirect } from "next/navigation"

import { requireUser } from "@/lib/auth"

/**
 * Configuration has sections of its own: Brands first, then Channels. An
 * administrator may hold only one of them (owner pages, 2026-11-14), so this
 * opens the first one they can see.
 */
export default async function ConfigurationPage() {
  const user = await requireUser()
  redirect(
    user.permissions.includes("BRAND:READ") || !user.permissions.includes("CHANNEL_SETUP:READ")
      ? "/configuration/brands"
      : "/configuration/channels"
  )
}
