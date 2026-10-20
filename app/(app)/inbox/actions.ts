"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Everything that changes mail: organising a message, sending one. Server
 * Actions, because the access token lives in an httpOnly cookie the browser
 * cannot read.
 *
 * <p>⚠️ Only async functions may be exported from a `"use server"` file.
 */

function failure(error: { status: number; message: string; fieldErrors?: Record<string, string> }): ActionState {
  if (error.status === 401) redirect("/login?reason=session-expired")
  return { ok: false, message: error.message, fieldErrors: error.fieldErrors }
}

/** archive, inbox, junk, delete, star, unstar, read, unread — done in Gmail itself. */
export async function mailAction(mailId: string, action: string): Promise<ActionState> {
  const result = await apiFetch(
    `/api/inbox/messages/${encodeURIComponent(mailId)}/actions`,
    { method: "POST", authenticated: true, body: JSON.stringify({ action }) }
  )
  if (!result.ok) return failure(result.error)

  revalidatePath("/inbox")
  return { ok: true }
}

/**
 * A two-minute pass to send one email, which the browser then posts straight
 * to the backend with the files attached.
 *
 * <p>Not through here: this server (Vercel) refuses uploads over 4.5 MB, and
 * Gmail allows 25. Asking for the pass is what checks INBOX:SEND.
 */
export async function sendLink(): Promise<ActionState & { url?: string }> {
  const result = await apiFetch<{ url: string }>(
    "/api/inbox/send-link",
    { method: "POST", authenticated: true }
  )
  if (!result.ok) return failure(result.error)

  const base = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "")
  return { ok: true, url: `${base}${result.data.url}` }
}

/** Repaints the inbox after the browser sent something on its own. */
export async function refreshInbox(): Promise<void> {
  revalidatePath("/inbox")
}

/** A two-minute link to one attached file, which the browser then downloads. */
export async function attachmentLink(mailId: string, index: number): Promise<ActionState & { url?: string }> {
  const result = await apiFetch<{ url: string }>(
    `/api/inbox/messages/${encodeURIComponent(mailId)}/attachments/${index}/link`,
    { method: "POST", authenticated: true }
  )
  if (!result.ok) return failure(result.error)

  const base = (process.env.BACKEND_URL ?? "").replace(/\/+$/, "")
  return { ok: true, url: `${base}${result.data.url}` }
}
