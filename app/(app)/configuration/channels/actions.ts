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

/** Removes a channel's link. Its leads keep their channel. */
export async function removeChannel(name: string): Promise<ActionState> {
  return done(`/api/channels/${encodeURIComponent(name)}`, { method: "DELETE" })
}
