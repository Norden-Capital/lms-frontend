"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Changing the channels on Configuration → Channels — the Owner only.
 *
 * <p>⚠️ Only async functions may be exported from a `"use server"` file.
 */

async function done(path: string, init: RequestInit): Promise<ActionState> {
  const result = await apiFetch(path, { ...init, authenticated: true })
  if (!result.ok) {
    if (result.error.status === 401) redirect("/login?reason=session-expired")
    return { ok: false, message: result.error.message }
  }

  revalidatePath("/configuration/channels")
  revalidatePath("/dashboard/leads")
  return { ok: true }
}

/** Adds a channel: the word after utm_source=. */
export async function addChannel(name: string): Promise<ActionState> {
  return done("/api/channels", { method: "POST", body: JSON.stringify({ name }) })
}

/**
 * Changes a channel's name shown in the LMS, or switches it on or off. Sends
 * only what changed. The tag never changes. SEO can't be switched off.
 */
export async function updateChannel(
  name: string,
  changes: { label?: string | null; active?: boolean },
): Promise<ActionState> {
  return done(`/api/channels/${encodeURIComponent(name)}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  })
}
