"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { APPEARANCE_COOKIE, toAppearance, type Appearance } from "@/lib/appearance"

/**
 * Settings → Theme (added 2026-11-10). Saves your look on your account, then
 * puts it in the cookie the root layout reads, so the next page load paints it
 * at once.
 */
export async function saveAppearance(look: Appearance): Promise<{ ok: boolean; message: string }> {
  const result = await apiFetch<Appearance>("/api/users/me/appearance", {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(toAppearance(look)),
  })

  if (!result.ok) {
    if (result.error.status === 401) redirect("/login?reason=session-expired")
    return { ok: false, message: result.error.message }
  }

  const saved = toAppearance(result.data)
  ;(await cookies()).set(APPEARANCE_COOKIE, encodeURIComponent(JSON.stringify(saved)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })
  revalidatePath("/", "layout")
  return { ok: true, message: "Theme saved." }
}
