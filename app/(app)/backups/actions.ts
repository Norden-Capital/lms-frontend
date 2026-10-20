"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Back up now, download, delete — the Owner only; the backend refuses anybody
 * else.
 *
 * <p>⚠️ Only async functions may be exported from a `"use server"` file — see
 * `app/(app)/users/actions.ts`.
 */

function failure(error: { status: number; message: string }): ActionState {
  if (error.status === 401) redirect("/login?reason=session-expired")
  return { ok: false, message: error.message }
}

/** Starts a backup. It runs in the background; the page follows it. */
export async function startBackup(): Promise<ActionState> {
  const result = await apiFetch("/api/backups", { method: "POST", authenticated: true })
  if (!result.ok) return failure(result.error)

  revalidatePath("/backups")
  return { ok: true }
}

/**
 * A two-minute link to download one backup, straight from the API.
 *
 * <p>Straight from the API rather than through this website, because the
 * website's server cannot pass on large files. The link is the proof — it
 * works for that one file, once asked for, for two minutes.
 */
export async function backupDownloadLink(id: string): Promise<ActionState & { url?: string }> {
  const result = await apiFetch<{ url: string }>(
    `/api/backups/${encodeURIComponent(id)}/download-link`,
    { method: "POST", authenticated: true }
  )
  if (!result.ok) return failure(result.error)

  const base = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "")
  return { ok: true, url: `${base}${result.data.url}` }
}

/** Removes the files on the server and in R2. The row stays in the log. */
export async function deleteBackup(id: string): Promise<ActionState> {
  const result = await apiFetch(`/api/backups/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authenticated: true,
  })
  if (!result.ok) return failure(result.error)

  revalidatePath("/backups")
  return { ok: true }
}
